import { Send, RotateCcw, Loader2 } from "lucide-react";
import ChatMessage from "./ChatMessage"; // I renamed the import to match the file/component name
import { useChatInterface } from "@/hooks/useChatInterface"; // Import the logic

function ConversationalForm() {
  // 1. Extract all logic from the hook
  const {
    messages,
    isLoading,
    input,
    messagesEndRef,
    handleInputChange,
    handleSend,
    handleKeyPress,
    clearSession,
  } = useChatInterface();

  // 2. Render purely the UI
  return (
    <div className="flex flex-col h-full bg-white border-slate-100 overflow-hidden relative">
      {/* --- Header --- */}
      <div className="h-16 bg-[#007834] flex justify-between items-center px-6 shadow-md z-10">
        <div className="w-10"></div>

        <h1 className="text-white font-semibold text-lg tracking-wide">
          Asystent Zgłoszenia
        </h1>

        <button
          onClick={clearSession}
          title="Rozpocznij nowe zgłoszenie"
          className="text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-full transition-all duration-200"
        >
          <RotateCcw size={20} />
        </button>
      </div>

      {/* --- Chat Area --- */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50 custom-scrollbar flex flex-col gap-4">
        {messages.map((msg, index) => (
          <ChatMessage
            key={index}
            text={msg.content}
            isUser={msg.role === "user"}
          />
        ))}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-center gap-2 ml-2 mt-2 text-[#007834]">
            <Loader2 className="animate-spin" size={18} />
            <span className="text-xs font-medium text-slate-500 italic">
              Analizuję odpowiedź...
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* --- Input Area --- */}
      <div className="p-4 bg-white border-t border-slate-100">
        <div className="relative flex items-center gap-2 bg-slate-100 rounded-2xl p-2 pr-2 focus-within:ring-2 focus-within:ring-[#007834]/20 focus-within:bg-white transition-all duration-300">
          <input
            type="text"
            className="flex-1 bg-transparent border-none outline-none text-slate-700 placeholder:text-slate-400 px-3 py-2 text-sm sm:text-base"
            placeholder="Opisz sytuację..."
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyPress}
            disabled={isLoading}
            autoComplete="off"
          />

          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className={`p-3 rounded-xl transition-all duration-200 flex items-center justify-center
              ${
                !input.trim() || isLoading
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                  : "bg-[#007834] text-white shadow-lg hover:bg-[#005f2a] hover:shadow-green-900/20 hover:scale-105 active:scale-95"
              }`}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConversationalForm;
