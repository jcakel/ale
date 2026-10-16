import React, { useEffect, useRef } from 'react';
import { MessageLog } from '../types';

interface HistoryLogProps {
  messages: MessageLog[];
}

const HistoryLog: React.FC<HistoryLogProps> = ({ messages }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-2 space-y-4 max-h-[400px]" ref={scrollRef}>
      {messages.length === 0 && (
        <div className="text-center text-stone-400 text-sm mt-10 italic">
          Presiona el micrófono para conversar con La Trini...
        </div>
      )}
      {messages.map((msg, idx) => (
        <div 
          key={idx} 
          className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
        >
          <div 
            className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
              msg.role === 'user' 
                ? 'bg-rose-500 text-white rounded-br-none' 
                : 'bg-white border border-stone-200 text-stone-800 rounded-bl-none'
            }`}
          >
            {msg.text}
          </div>
          <span className="text-[10px] text-stone-400 mt-1 mx-1">
            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      ))}
    </div>
  );
};

export default HistoryLog;