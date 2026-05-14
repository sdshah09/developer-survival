'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { Menu, SquarePen, Plus, Mic, ChevronDown, MessageSquare, Sun, Moon } from 'lucide-react';
import { useEffect, useRef, useState, FormEvent } from 'react';
import { useTheme } from 'next-themes';

export default function ChatUI() {
  const { messages, sendMessage } = useChat({
    transport: new DefaultChatTransport({
      api: process.env.NEXT_PUBLIC_BACKEND_URL
        ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/chat`
        : 'http://localhost:8000/chat',
    }),
  });
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch — only render theme-dependent UI after mount
  useEffect(() => setMounted(true), []);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage({ text: input });
    setInput('');
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const isDark = mounted && resolvedTheme === 'dark';

  return (
    <div className="flex h-screen bg-[#FAF6F0] dark:bg-[#2a2a2a] text-gray-900 dark:text-gray-100">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-[#EAE4D9] dark:border-gray-800 bg-[#F3EEE5] dark:bg-[#222]">
        <div className="flex items-center justify-between px-4 py-4 border-b border-[#EAE4D9] dark:border-gray-800">
          <span className="text-[15px] font-semibold">Chats</span>
          <button className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors">
            <SquarePen className="w-5 h-5" strokeWidth={2} />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
          {['New conversation', 'Project ideas', 'Travel plan'].map((label, i) => (
            <button
              key={label}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[14px] text-left transition-colors ${
                i === 0
                  ? 'bg-white dark:bg-gray-800 shadow-sm'
                  : 'hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              <MessageSquare className="w-4 h-4 text-gray-500 dark:text-gray-400" strokeWidth={2} />
              <span className="truncate">{label}</span>
            </button>
          ))}
        </nav>
        <div className="px-4 py-3 border-t border-[#EAE4D9] dark:border-gray-800 text-[13px] text-gray-600 dark:text-gray-400">
          Sam
        </div>
      </aside>

      {/* Main column */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-[#EAE4D9] dark:border-gray-800">
          <button className="md:hidden p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors">
            <Menu className="w-6 h-6 text-gray-800 dark:text-gray-200" strokeWidth={2} />
          </button>
          <h1 className="text-[15px] font-medium text-gray-800 dark:text-gray-200">
            New conversation
          </h1>
          {/* Theme toggle */}
          <button
            type="button"
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            aria-label="Toggle theme"
            className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors"
          >
            {mounted ? (
              isDark ? (
                <Sun className="w-5 h-5" strokeWidth={2} />
              ) : (
                <Moon className="w-5 h-5" strokeWidth={2} />
              )
            ) : (
              <div className="w-5 h-5" />
            )}
          </button>
        </header>

        {/* Message area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-6 py-8">
            {messages.length === 0 ? (
              <div className="mt-12">
                <h2 className="text-[40px] font-semibold text-[#2C2C2C] dark:text-gray-100 leading-[1.1] tracking-tight">
                  Hey Sam, how can I help?
                </h2>
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`px-5 py-3 rounded-[20px] max-w-[75%] text-[15px] leading-relaxed ${
                        m.role === 'user'
                          ? 'bg-[#EAE4D9] dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                          : 'bg-white dark:bg-gray-800 border border-[#EAE4D9] dark:border-gray-700 text-gray-800 dark:text-gray-200'
                      }`}
                    >
                      {m.parts.map((p, i) => (p.type === 'text' ? <span key={i}>{p.text}</span> : null))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bottom area */}
        <div className="border-t border-[#EAE4D9] dark:border-gray-800 bg-gradient-to-t from-[#FAF6F0] dark:from-[#2a2a2a] via-[#FAF6F0] dark:via-[#2a2a2a] to-transparent">
          <div className="max-w-3xl mx-auto px-6 py-4">
            {messages.length === 0 && (
              <div className="flex gap-3 pb-4 flex-wrap">
                {['Write a first draft', 'Get advice', 'Learn something'].map((text) => (
                  <button
                    key={text}
                    onClick={() => sendMessage({ text })}
                    className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200/60 dark:border-gray-700 rounded-full text-[14px] font-medium text-gray-700 dark:text-gray-200 shadow-sm hover:shadow-md transition-shadow"
                  >
                    {text}
                  </button>
                ))}
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="bg-[#EBE5DA] dark:bg-[#3a3a3a] rounded-[28px] p-3 flex flex-col gap-3"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Message Copilot"
                className="w-full bg-transparent border-none outline-none px-5 pt-4 pb-3 text-[17px] text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
              />
              <div className="flex justify-between items-center px-2 pb-1">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 flex items-center justify-center">
                    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
                      <path d="M12 2L2 12h3v8h6v-6h2v6h6v-8h3L12 2z" fill="url(#grad)" />
                      <defs>
                        <linearGradient id="grad" x1="0" y1="0" x2="24" y2="24">
                          <stop stopColor="#4F46E5" />
                          <stop offset="1" stopColor="#EC4899" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                  <button
                    type="button"
                    className="flex items-center gap-1 text-[13px] font-medium text-gray-700 dark:text-gray-300"
                  >
                    Quick <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex gap-1">
                  <button
                    type="button"
                    className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors text-gray-700 dark:text-gray-300"
                  >
                    <Plus className="w-[22px] h-[22px]" strokeWidth={2} />
                  </button>
                  <button
                    type="button"
                    className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors text-gray-700 dark:text-gray-300"
                  >
                    <Mic className="w-[22px] h-[22px]" strokeWidth={2} />
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
