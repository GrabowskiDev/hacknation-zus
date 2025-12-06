import React from "react";
import { Bot, User } from "lucide-react";
import clsx from "clsx"; // Optional utility for cleaner classes, or just use template literals

interface ChatMessageProps {
  text: string;
  isUser: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ text, isUser }) => {
  return (
    <div
      className={clsx(
        "flex w-full gap-3 mb-2 animate-in fade-in slide-in-from-bottom-2 duration-300",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {/* Bot Avatar */}
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#007834]/10 flex items-center justify-center text-[#007834]">
          <Bot size={18} />
        </div>
      )}

      {/* Message Bubble */}
      <div
        className={clsx(
          "max-w-[80%] sm:max-w-[70%] p-3 sm:p-4 text-sm sm:text-base leading-relaxed whitespace-pre-line break-words shadow-sm",
          isUser
            ? "bg-[#007834] text-white rounded-2xl rounded-tr-sm"
            : "bg-white text-slate-700 border border-slate-100 rounded-2xl rounded-tl-sm"
        )}
      >
        {text}
      </div>

      {/* User Avatar */}
      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500">
          <User size={18} />
        </div>
      )}
    </div>
  );
};

export default ChatMessage;
