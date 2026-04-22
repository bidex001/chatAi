import React from "react";
import { Menu } from "lucide-react";
import { HiDotsVertical } from "react-icons/hi";
import { LuShare2 } from "react-icons/lu";

const MainHeader = ({ onSidebarOpen }) => {
  return (
    <div className="flex w-full items-center border-b border-white/70 bg-white/55 px-5 py-4 backdrop-blur xl:px-8">
      <button
        type="button"
        aria-label="Open sidebar"
        onClick={onSidebarOpen}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-white/80 bg-white/75 text-slate-500 shadow-sm transition hover:bg-white lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="ml-auto flex items-center gap-3">
        <button className="flex items-center justify-center gap-3 rounded-2xl border border-white/80 bg-white/75 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-white">
          <span>
            <LuShare2 />
          </span>
          <p>Share</p>
        </button>

        <button className="flex h-10 w-10 items-center justify-center rounded-full border border-white/80 bg-white/75 text-slate-500 shadow-sm transition hover:bg-white">
          <HiDotsVertical />
        </button>
      </div>
    </div>
  );
};

export default MainHeader;
