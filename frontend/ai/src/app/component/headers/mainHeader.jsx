"use client"
import React from "react";
import { useState } from "react";
import { Menu } from "lucide-react";
import { HiDotsVertical } from "react-icons/hi";
import { LuShare2 } from "react-icons/lu";
import { ToastContainer,toast } from "react-toastify";  
import 'react-toastify/dist/ReactToastify.css';

const MainHeader = ({ onSidebarOpen }) => {
  const [shareStatus, setShareStatus] = useState("");

  async function handleShare(){
    try {
    if(navigator.share){
        await navigator.share({
          title: "ChatAi",
          text:"enjoying this amazing chat application, check it out!",
          url:window.location.href
        })
        toast.success("content shared successfully!"),{
            position: "top-right",
          autoClose: 3000, // Close after 3 seconds
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        }
      }else {
        // 2. Fallback to Copy to Clipboard
        await navigator.clipboard.writeText(linkToShare);
        toast.info('Link Copied to Clipboard!', {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
      }
    } catch (error) {
     if(error.name !== "AbortError"){
        toast.error("Failed to share content. Please try again."), {
              position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        }
     }else{
        toast.error("Sharing was cancelled."), {
          position: "top-right",
          autoClose: 2000,
          hideProgressBar: true,
        }
     }
    }
  }


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
        <button 
        onClick={handleShare}
        className="flex items-center justify-center gap-3 rounded-2xl border border-white/80 bg-white/75 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-white">
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
