import Image from "next/image";
import { LuSparkles } from "react-icons/lu";

const MainWelcomeSection = ({ username }) => {
  return (
    <div className="relative overflow-hidden rounded-[32px] border border-white/80 bg-white/74 px-6 py-10 text-center shadow-[0_24px_55px_rgba(148,163,184,0.14)] backdrop-blur-xl md:px-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(129,140,248,0.18),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(56,189,248,0.14),_transparent_28%)]" />

      <div className="relative flex flex-col items-center gap-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50/90 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-violet-600">
          <LuSparkles />
          <span>AI Workspace</span>
        </div>

        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[linear-gradient(135deg,#ede9fe_0%,#dbeafe_100%)] shadow-[0_14px_28px_rgba(129,140,248,0.2)]">
          <Image src="/ailogo.png" alt="AI Logo" width={56} height={56} />
        </div>

        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 md:text-5xl">
          Hello, <span className="text-violet-600">{username}</span>
        </h1>

        <p className="max-w-2xl text-sm leading-7 text-slate-500 md:text-base">
          Ask questions, draft content, debug code, or brainstorm ideas. The
          whole workspace now behaves like a connected chatbot with one active
          conversation at a time.
        </p>
      </div>
    </div>
  );
};

export default MainWelcomeSection;
