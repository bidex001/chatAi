"use client";

import React, { useEffect, useState } from "react";
import Login from "./component/login";
import Main from "./component/main";
import SideBar from "./component/sideBar";
import api from "./lib/api";

const Page = () => {
  const [authStatus, setAuthStatus] = useState("loading");
  const [authError, setAuthError] = useState("");
  const [user, setUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [conversationStatus, setConversationStatus] = useState("idle");
  const [conversationError, setConversationError] = useState("");
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    let ignore = false;

    async function getUser() {
      try {
        const res = await api.get("/me");
        if (ignore) {
          return;
        }

        setUser(res.data);
        setAuthError("");
        setAuthStatus("authenticated");
      } catch (error) {
        if (ignore) {
          return;
        }

        setUser(null);
        if (error?.response?.status === 401) {
          setAuthError("");
          setAuthStatus("unauthenticated");
          return;
        }

        setAuthError("Could not reach the API. Start the backend and try again.");
        setAuthStatus("error");
      }
    }

    getUser();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if (authStatus !== "authenticated" || !user) {
      return;
    }

    let ignore = false;

    async function loadConversations() {
      setConversationStatus("loading");
      setConversationError("");

      try {
        const res = await api.get("/conversations");
        if (ignore) {
          return;
        }

        const nextConversations = res.data;
        setConversations(nextConversations);
        setConversationStatus("ready");
        setActiveConversationId((currentConversationId) => {
          if (
            currentConversationId &&
            nextConversations.some((chat) => chat.id === currentConversationId)
          ) {
            return currentConversationId;
          }

          return nextConversations[0]?.id || null;
        });
      } catch (error) {
        if (ignore) {
          return;
        }

        setConversations([]);
        setConversationStatus("error");
        setConversationError(
          "Could not load conversations. Check your session and API server."
        );
      }
    }

    loadConversations();

    return () => {
      ignore = true;
    };
  }, [authStatus, user]);

  async function refreshConversations(preferredConversationId = null) {
    try {
      const res = await api.get("/conversations");
      const nextConversations = res.data;

      setConversations(nextConversations);
      setConversationStatus("ready");
      setConversationError("");
      setActiveConversationId((currentConversationId) => {
        if (
          preferredConversationId &&
          nextConversations.some((chat) => chat.id === preferredConversationId)
        ) {
          return preferredConversationId;
        }

        if (
          currentConversationId &&
          nextConversations.some((chat) => chat.id === currentConversationId)
        ) {
          return currentConversationId;
        }

        return nextConversations[0]?.id || null;
      });

      return nextConversations;
    } catch (error) {
      setConversationStatus("error");
      setConversationError(
        "Could not load conversations. Check your session and API server."
      );
      throw error;
    }
  }

  function handleNewChat() {
    setActiveConversationId(null);
  }

  const activeConversation =
    conversations.find((chat) => chat.id === activeConversationId) || null;

  if (authStatus === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 px-6 text-slate-600">
        Checking your session...
      </div>
    );
  }

  if (authStatus === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 px-6">
        <div className="max-w-md rounded-3xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-900">
            Backend unavailable
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">{authError}</p>
        </div>
      </div>
    );
  }

  if (authStatus !== "authenticated" || !user) {
    return (
      <Login
        onAuthSuccess={(nextUser) => {
          setUser(nextUser);
          setAuthError("");
          setAuthStatus("authenticated");
        }}
      />
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(135deg,#eef2ff_0%,#f8fafc_44%,#eff6ff_100%)] text-slate-900">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(129,140,248,0.22),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(56,189,248,0.14),_transparent_22%),radial-gradient(circle_at_bottom_left,_rgba(168,85,247,0.14),_transparent_28%)]" />

      <div className="relative flex min-h-screen items-stretch justify-center p-3 lg:p-6">
        <div className="relative flex min-h-[calc(100vh-1.5rem)] w-full max-w-[1600px] overflow-hidden rounded-[34px] border border-white/60 bg-white/70 shadow-[0_30px_90px_rgba(79,70,229,0.12)] backdrop-blur-xl lg:min-h-[calc(100vh-3rem)]">
          {isSidebarOpen ? (
            <button
              type="button"
              aria-label="Close sidebar overlay"
              onClick={() => setIsSidebarOpen(false)}
              className="absolute inset-0 z-30 bg-slate-950/20 backdrop-blur-sm lg:hidden"
            />
          ) : null}

          <SideBar
            activeConversationId={activeConversationId}
            conversationError={conversationError}
            conversations={conversations}
            conversationStatus={conversationStatus}
            isOpen={isSidebarOpen}
            onNewChat={handleNewChat}
            onClose={() => setIsSidebarOpen(false)}
            onSelectConversation={setActiveConversationId}
            user={user}
          />

          <Main
            activeConversation={activeConversation}
            activeConversationId={activeConversationId}
            onConversationActivated={setActiveConversationId}
            onConversationListRefresh={refreshConversations}
            onSidebarOpen={() => setIsSidebarOpen(true)}
            user={user}
          />
        </div>
      </div>
    </div>
  );
};

export default Page;
