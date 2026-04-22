import Image from "next/image";
import React from "react";

const SideHeader = () => {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#ede9fe_0%,#dbeafe_100%)] shadow-sm">
        <Image src="/ailogo.png" alt="logo" width={24} height={24} />
      </div>
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">
          ChatAi
        </h1>
        <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
          Workspace
        </p>
      </div>
    </div>
  );
};

export default SideHeader;
