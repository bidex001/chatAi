"use client";

import React, { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { CiSearch } from "react-icons/ci";
import { FaHome } from "react-icons/fa";
import { FaPlus } from "react-icons/fa6";
import { IoFileTrayOutline, IoPersonOutline } from "react-icons/io5";
import { LuSparkles } from "react-icons/lu";
import SideHeader from "./headers/sideHeader";

const sidebarTabs = [
  {
    id: "home",
    label: "Home",
    icon: FaHome,
  },
  {
    id: "search",
    label: "Search",
    icon: CiSearch,
  },
  {
    id: "library",
    label: "Library",
    icon: IoFileTrayOutline,
  },
];

const SideBar = ({
  activeConversationId,
  conversationError,
  conversations,
  conversationStatus,
  isOpen,
  onNewChat,
  onClose,
  onSelectConversation,
  user,
}) => {
  const [activeTab, setActiveTab] = useState("home");
  const [searchValue, setSearchValue] = useState("");
  const searchInputRef = useRef(null);

  useEffect(() => {
    if (activeTab === "search") {
      searchInputRef.current?.focus();
    }
  }, [activeTab]);

  const normalizedQuery = searchValue.trim().toLowerCase();
  const filteredConversations = normalizedQuery
    ? conversations.filter((chat) => {
        const title = chat.title?.toLowerCase() || "";
        const message = chat.last_message?.toLowerCase() || "";
        return title.includes(normalizedQuery) || message.includes(normalizedQuery);
      })
    : conversations;

  const pinnedChats = filteredConversations.filter((chat) => chat.is_pinned);
  const recentChats = filteredConversations.filter((chat) => !chat.is_pinned);

  function handleTabChange(nextTab) {
    setActiveTab(nextTab);

    if (nextTab === "home") {
      setSearchValue("");

      if (!activeConversationId && conversations[0]) {
        onSelectConversation(conversations[0].id);
      }
    }
  }

  function handleNewChat() {
    setActiveTab("home");
    setSearchValue("");
    onNewChat();
    onClose();
  }

  function renderConversationButton(chat) {
    const isActive = chat.id === activeConversationId;

    return (
      <button
        key={chat.id}
        type="button"
        onClick={() => {
          onSelectConversation(chat.id);
          onClose();
        }}
        className={`group relative w-full overflow-hidden rounded-2xl border px-4 py-3 text-left transition duration-300 ${
          isActive
            ? "border-violet-300 bg-violet-50/90 shadow-[0_12px_32px_rgba(129,140,248,0.18)]"
            : "border-white/70 bg-white/80 hover:border-violet-200 hover:bg-white hover:shadow-[0_10px_28px_rgba(15,23,42,0.08)]"
        }`}
      >
        <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(129,140,248,0.18),_transparent_55%)] opacity-0 transition duration-300 group-hover:opacity-100" />
        <div className="relative flex items-start gap-3">
          <div
            className={`mt-1 h-2.5 w-2.5 rounded-full ${
              isActive ? "bg-violet-500" : "bg-slate-300"
            }`}
          />
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-medium text-slate-800">
              {chat.title}
            </h3>
            <p className="mt-1 truncate text-xs text-slate-500">
              {chat.last_message || "No messages yet"}
            </p>
          </div>
        </div>
      </button>
    );
  }

  function renderConversationState(emptyLabel) {
    if (conversationStatus === "loading") {
      return <p className="text-sm text-slate-500">Loading conversations...</p>;
    }

    if (conversationStatus === "error") {
      return (
        <p className="text-sm text-red-600">
          {conversationError || "Could not load conversations."}
        </p>
      );
    }

    return <p className="text-sm text-slate-500">{emptyLabel}</p>;
  }

  return (
    <aside
      className={`absolute inset-y-0 left-0 z-40 flex h-full w-[min(88vw,22rem)] max-w-sm shrink-0 flex-col border-r border-white/60 bg-white/65 p-4 shadow-[0_30px_80px_rgba(15,23,42,0.18)] backdrop-blur-xl transition duration-300 lg:relative lg:z-auto lg:w-full lg:max-w-sm lg:pointer-events-auto lg:translate-x-0 lg:shadow-none lg:min-h-full ${
        isOpen ? "translate-x-0" : "-translate-x-full pointer-events-none"
      }`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(129,140,248,0.2),_transparent_28%),radial-gradient(circle_at_bottom_left,_rgba(56,189,248,0.12),_transparent_26%)]" />

      <div className="relative flex h-full flex-col gap-6">
        <div className="flex items-center justify-between gap-3">
          <SideHeader />
          <button
            type="button"
            aria-label="Close sidebar"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/80 bg-white/75 text-slate-500 shadow-sm transition hover:bg-white lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <button
          type="button"
          onClick={handleNewChat}
          className="flex w-full items-center justify-center gap-3 rounded-2xl bg-[linear-gradient(135deg,#4f46e5_0%,#7c3aed_100%)] p-3 text-sm font-medium text-white shadow-[0_18px_35px_rgba(99,102,241,0.28)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_42px_rgba(99,102,241,0.34)]"
        >
          <FaPlus />
          <span>New Chat</span>
        </button>

        <div className="grid grid-cols-3 gap-2 rounded-3xl border border-white/70 bg-white/70 p-2 shadow-[0_10px_35px_rgba(148,163,184,0.12)]">
          {sidebarTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = tab.id === activeTab;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                className={`flex flex-col items-center justify-center gap-2 rounded-2xl px-3 py-3 text-xs font-medium transition ${
                  isActive
                    ? "bg-slate-900 text-white shadow-lg"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                }`}
              >
                <Icon className="text-base" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {(activeTab === "search" || activeTab === "library") && (
          <div className="rounded-3xl border border-white/70 bg-white/75 p-3 shadow-[0_12px_30px_rgba(148,163,184,0.12)]">
            <label className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/80 px-3 py-3">
              <CiSearch className="text-lg text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="Search conversations..."
                className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
              />
            </label>
          </div>
        )}

        {activeTab === "library" ? (
          <section className="flex min-h-0 flex-1 flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">
                Library
              </h2>
              <span className="rounded-full bg-slate-900 px-3 py-1 text-[11px] font-semibold text-white">
                {filteredConversations.length}
              </span>
            </div>

            <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto rounded-[28px] border border-white/70 bg-white/55 p-3 shadow-[0_16px_35px_rgba(148,163,184,0.12)]">
              {filteredConversations.length
                ? filteredConversations.map(renderConversationButton)
                : renderConversationState("No conversations found.")}
            </div>
          </section>
        ) : (
          <>
            <section className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">
                  Pinned
                </h2>
                <LuSparkles className="text-sm text-violet-500" />
              </div>

              <div className="flex min-h-24 flex-col gap-2 rounded-[28px] border border-white/70 bg-white/55 p-3 shadow-[0_16px_35px_rgba(148,163,184,0.12)]">
                {pinnedChats.length
                  ? pinnedChats.map(renderConversationButton)
                  : renderConversationState("No pinned chats yet.")}
              </div>
            </section>

            <section className="flex min-h-0 flex-1 flex-col gap-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">
                  {activeTab === "search" ? "Results" : "Recent"}
                </h2>
                <span className="rounded-full bg-white/80 px-3 py-1 text-[11px] font-semibold text-slate-500">
                  {activeTab === "search"
                    ? filteredConversations.length
                    : recentChats.length}
                </span>
              </div>

              <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto rounded-[28px] border border-white/70 bg-white/55 p-3 shadow-[0_16px_35px_rgba(148,163,184,0.12)]">
                {activeTab === "search"
                  ? filteredConversations.length
                    ? filteredConversations.map(renderConversationButton)
                    : renderConversationState("No matching conversations.")
                  : recentChats.length
                    ? recentChats.map(renderConversationButton)
                    : renderConversationState("No conversations yet.")}
              </div>
            </section>
          </>
        )}

        <div className="rounded-[28px] border border-white/70 bg-white/80 p-4 shadow-[0_18px_40px_rgba(148,163,184,0.14)]">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-900 text-lg text-white shadow-lg">
              <IoPersonOutline />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-sm font-medium text-slate-800">
                {user.username}
              </h3>
              <p className="truncate text-sm text-slate-500">{user.email}</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default SideBar;
