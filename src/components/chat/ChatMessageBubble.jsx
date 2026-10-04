import React from "react";

export default function ChatMessageBubble({ message, isAdmin = false }) {
  const isCustomer = message.sender_role === "customer";
  const mine = isAdmin ? !isCustomer : isCustomer;

  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] px-3.5 py-2 rounded-2xl text-sm whitespace-pre-wrap break-words ${
          mine
            ? "bg-[#22C55E] text-[#051510] rounded-br-md"
            : "bg-[#E2F1E7] dark:bg-white/10 text-[#0A3D2E] dark:text-white rounded-bl-md"
        }`}
      >
        {message.message}
      </div>
    </div>
  );
}