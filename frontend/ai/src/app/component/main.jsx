"use client";

import React, { useEffect, useRef, useState } from "react";
import api from "../lib/api";
import MainConversationPanel from "./mainConversationPanel";
import MainSuggestionCards from "./mainSuggestionCards";
import MainWelcomeSection from "./mainWelcomeSection";
import MainHeader from "./headers/mainHeader";
import {
  buildConversationTitle,
  formatMessageTime,
  getErrorMessage,
  normalizeMessage,
} from "./mainUtils";

const Main = ({
  activeConversation,
  activeConversationId,
  onConversationActivated,
  onConversationListRefresh,
  onSidebarOpen,
  user,
}) => {
  // Local UI state plus the active backend conversation metadata.
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState([]);
  const [conversationTitle, setConversationTitle] = useState("New Chat");
  const [modelName, setModelName] = useState("");
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const messagesContainerRef = useRef(null);

  useEffect(() => {
    if (!activeConversationId) {
      setConversationTitle("New Chat");
      setModelName("");
      return;
    }

    if (activeConversation?.title) {
      setConversationTitle(activeConversation.title);
    }
  }, [activeConversation, activeConversationId]);

  useEffect(() => {
    let ignore = false;

    // When the selected conversation changes, fetch its full message history.
    async function loadConversationMessages() {
      if (!activeConversationId) {
        setMessages([]);
        setError("");
        setModelName("");
        setIsBootstrapping(false);
        return;
      }

      setIsBootstrapping(true);
      setError("");
      setModelName("");

      try {
        const response = await api.get(
          `/conversations/${activeConversationId}/messages`
        );

        if (ignore) {
          return;
        }

        setMessages(response.data.map(normalizeMessage));
      } catch (nextError) {
        if (ignore) {
          return;
        }

        setMessages([]);
        setError(
          getErrorMessage(
            nextError,
            "Could not load this conversation. Make sure the backend is running."
          )
        );
      } finally {
        if (!ignore) {
          setIsBootstrapping(false);
        }
      }
    }

    loadConversationMessages();

    return () => {
      ignore = true;
    };
  }, [activeConversationId]);

  useEffect(() => {
    const container = messagesContainerRef.current;

    if (!container) {
      return;
    }

    container.scrollTo({
      top: container.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  async function syncConversationMessages(nextConversationId) {
    const response = await api.get(`/conversations/${nextConversationId}/messages`);
    setMessages(response.data.map(normalizeMessage));
  }

  // The first prompt creates a conversation; later prompts reuse the active one.
  async function ensureConversation(nextPrompt) {
    if (activeConversationId) {
      return activeConversationId;
    }

    const response = await api.post("/conversations", {
      title: buildConversationTitle(nextPrompt),
    });

    setConversationTitle(response.data.title);
    onConversationActivated(response.data.id);

    return response.data.id;
  }

  // Send the prompt to the backend chat route and replace the optimistic UI
  // messages with the saved user and assistant messages from the API.
  async function submitPrompt(value) {
    const nextPrompt = value.trim();

    if (!nextPrompt || isSending) {
      return;
    }

    const optimisticUserId = `local-user-${Date.now()}`;
    const optimisticAssistantId = `local-assistant-${Date.now()}`;
    const optimisticTime = formatMessageTime(new Date().toISOString());

    setPrompt("");
    setError("");
    setIsSending(true);
    setMessages((currentMessages) => [
      ...currentMessages,
      {
        id: optimisticUserId,
        role: "user",
        text: nextPrompt,
        time: optimisticTime,
      },
      {
        id: optimisticAssistantId,
        role: "assistant",
        text: "Thinking...",
        time: "",
        pending: true,
      },
    ]);

    let nextConversationId = activeConversationId;

    try {
      nextConversationId = await ensureConversation(nextPrompt);

      const response = await api.post(`/conversations/${nextConversationId}/chat`, {
        content: nextPrompt,
      });

      const resolvedConversationId = response.data.user_message.conversation_id;

      setModelName(response.data.model || "");
      onConversationActivated(resolvedConversationId);
      setMessages((currentMessages) => [
        ...currentMessages.filter(
          (message) =>
            message.id !== optimisticUserId &&
            message.id !== optimisticAssistantId
        ),
        normalizeMessage(response.data.user_message),
        normalizeMessage(response.data.assistant_message),
      ]);
      try {
        await onConversationListRefresh(resolvedConversationId);
      } catch {
        // Keep the chat responsive even if the sidebar refresh fails.
      }
    } catch (nextError) {
      setError(
        getErrorMessage(nextError, "Could not send your message to the backend.")
      );

      if (nextConversationId) {
        try {
          await syncConversationMessages(nextConversationId);
          await onConversationListRefresh(nextConversationId);
        } catch {
          setMessages((currentMessages) =>
            currentMessages.filter(
              (message) => message.id !== optimisticAssistantId
            )
          );
        }
      } else {
        setMessages((currentMessages) =>
          currentMessages.filter(
            (message) =>
              message.id !== optimisticUserId &&
              message.id !== optimisticAssistantId
          )
        );
      }
    } finally {
      setIsSending(false);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    submitPrompt(prompt);
  }

  const showIntro = !isBootstrapping && messages.length === 0;

  return (
    <main className="flex min-w-0 flex-1 flex-col overflow-hidden bg-transparent">
      <MainHeader onSidebarOpen={onSidebarOpen} />

      <div className="flex flex-1 flex-col overflow-y-auto p-5 lg:p-8">
        <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6">
          {showIntro ? (
            <>
              <MainWelcomeSection username={user.username} />
              <MainSuggestionCards
                isSending={isSending}
                onSelectPrompt={submitPrompt}
              />
            </>
          ) : null}

          <MainConversationPanel
            conversationId={activeConversationId}
            conversationTitle={conversationTitle}
            error={error}
            isBootstrapping={isBootstrapping}
            isSending={isSending}
            messages={messages}
            messagesContainerRef={messagesContainerRef}
            modelName={modelName}
            onPromptChange={setPrompt}
            onSubmit={handleSubmit}
            prompt={prompt}
          />
        </div>
      </div>
    </main>
  );
};

export default Main;
