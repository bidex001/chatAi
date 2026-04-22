import { splitMessageContent } from "./mainUtils";

const MainChatMessage = ({ message }) => {
  const isUser = message.role === "user";
  const contentBlocks = message.pending
    ? [{ type: "text", content: message.text }]
    : splitMessageContent(message.text);

  return (
    <div className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`flex max-w-3xl gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold shadow-sm ${
            isUser
              ? "bg-slate-900 text-white"
              : "bg-[linear-gradient(135deg,#ede9fe_0%,#dbeafe_100%)] text-violet-700"
          }`}
        >
          {isUser ? "You" : "AI"}
        </div>

        <div className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}>
          <div
            className={`max-w-full rounded-3xl px-5 py-4 shadow-[0_14px_28px_rgba(148,163,184,0.14)] ${
              isUser
                ? "rounded-br-md bg-[linear-gradient(135deg,#4f46e5_0%,#7c3aed_100%)] text-white"
                : "rounded-bl-md border border-white/80 bg-white/88 text-slate-800"
            }`}
          >
            <div className="space-y-4">
              {contentBlocks.map((block, index) => {
                if (block.type === "code") {
                  return (
                    <div
                      key={`${message.id}-code-${index}`}
                      className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 text-slate-100"
                    >
                      <div className="border-b border-slate-800 px-4 py-3 text-xs uppercase tracking-[0.25em] text-slate-400">
                        {block.language}
                      </div>
                      <pre className="overflow-x-auto px-4 py-4 text-sm leading-7 text-slate-100">
                        <code>{block.content}</code>
                      </pre>
                    </div>
                  );
                }

                return (
                  <p
                    key={`${message.id}-text-${index}`}
                    className={`whitespace-pre-wrap text-sm leading-7 ${
                      message.pending ? "italic text-slate-500" : ""
                    }`}
                  >
                    {block.content}
                  </p>
                );
              })}
            </div>
          </div>

          {message.time ? (
            <span className="mt-2 px-2 text-xs text-slate-400">{message.time}</span>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default MainChatMessage;
