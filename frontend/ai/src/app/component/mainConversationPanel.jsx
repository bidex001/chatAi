import Image from "next/image";
import { LuSendHorizontal, LuSparkles } from "react-icons/lu";
import MainChatMessage from "./mainChatMessage";

const MainConversationPanel = ({
  conversationId,
  conversationTitle,
  error,
  isBootstrapping,
  isSending,
  messages,
  messagesContainerRef,
  modelName,
  onPromptChange,
  onSubmit,
  prompt,
}) => {
  return (
    <section className="relative flex min-h-[640px] flex-1 flex-col overflow-hidden rounded-[32px] border border-white/70 bg-white/78 shadow-[0_24px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(129,140,248,0.18),_transparent_30%),radial-gradient(circle_at_bottom_left,_rgba(56,189,248,0.12),_transparent_26%)]" />

      <div className="relative flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 bg-white/75 px-6 py-5 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[linear-gradient(135deg,#ede9fe_0%,#dbeafe_100%)] shadow-sm">
            <Image src="/ailogo.png" alt="AI Assistant" width={28} height={28} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              {conversationTitle}
            </h2>
            <p className="flex items-center gap-2 text-xs text-slate-500">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              {modelName ? `Standard chat bot | ${modelName}` : "Standard chat bot"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-full border border-white/80 bg-white/75 px-4 py-2 text-xs font-medium text-slate-500 shadow-sm">
          <LuSparkles className="text-violet-500" />
          <span>{conversationId ? "Live conversation" : "Ready for a new chat"}</span>
        </div>
      </div>

      <div
        ref={messagesContainerRef}
        className="relative flex-1 overflow-y-auto px-4 py-6 md:px-6"
      >
        {isBootstrapping ? (
          <div className="flex h-full items-center justify-center text-sm text-slate-500">
            Loading conversation...
          </div>
        ) : messages.length ? (
          <div className="space-y-5">
            {messages.map((message) => (
              <MainChatMessage key={message.id} message={message} />
            ))}
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center text-slate-500">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[linear-gradient(135deg,#ede9fe_0%,#dbeafe_100%)] shadow-sm">
              <Image src="/ailogo.png" alt="AI Assistant" width={34} height={34} />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-slate-800">
                Start a real conversation
              </h3>
              <p className="max-w-md text-sm leading-7">
                Use the prompt cards or type below. Every message goes through
                your backend chat route and becomes part of the selected chat.
              </p>
            </div>
          </div>
        )}
      </div>

      <form
        onSubmit={onSubmit}
        className="relative border-t border-slate-200/80 bg-white/82 p-4 md:p-5"
      >
        {error ? (
          <div className="mb-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="rounded-[30px] border border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.95)_0%,rgba(241,245,249,0.92)_100%)] p-2 shadow-[0_14px_30px_rgba(148,163,184,0.16)]">
          <div className="flex items-center gap-3 rounded-[24px] border border-slate-200/80 bg-white/85 px-3 py-3">
            <input
              type="text"
              value={prompt}
              onChange={(event) => onPromptChange(event.target.value)}
              placeholder="Ask anything..."
              className="flex-1 bg-transparent px-2 text-sm text-slate-700 outline-none placeholder:text-slate-400"
            />

            <button
              type="submit"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-[linear-gradient(135deg,#4f46e5_0%,#7c3aed_100%)] text-white shadow-[0_14px_28px_rgba(99,102,241,0.28)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_34px_rgba(99,102,241,0.34)] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
              disabled={!prompt.trim() || isSending}
            >
              <LuSendHorizontal className="text-lg" />
            </button>
          </div>
        </div>
      </form>
    </section>
  );
};

export default MainConversationPanel;
