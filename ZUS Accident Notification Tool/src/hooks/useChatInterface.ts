import { useState, useRef, useEffect } from "react";
import { useChat } from "../context/ChatContext";

export const useChatInterface = () => {
  const { messages, sendMessage, isLoading, clearSession } = useChat();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logic
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const messageToSend = input;
    setInput("");
    await sendMessage(messageToSend);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSend();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  return {
    messages,
    isLoading,
    input,
    messagesEndRef,
    handleInputChange,
    handleSend,
    handleKeyPress,
    clearSession,
  };
};
