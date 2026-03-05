"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Props {
  mealPlan: Record<string, unknown> | null;
  userProfile: Record<string, unknown> | null;
  additionalFoods?: { calories: number; protein: number; carbs: number; fat: number } | null;
}

const STARTERS = [
  "Why these macros?",
  "Am I on track?",
  "What should I eat more of?",
];

export default function NutritionCoach({ mealPlan, userProfile, additionalFoods }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Load last 10 messages from Supabase when panel first opens
  useEffect(() => {
    if (!isOpen || historyLoaded) return;

    async function loadHistory() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("coach_messages")
        .select("role, content")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (data && data.length > 0) {
        setMessages(data.reverse() as Message[]);
      }
      setHistoryLoaded(true);
    }

    loadHistory();
  }, [isOpen, historyLoaded]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 120);
    }
  }, [isOpen]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isTyping) return;

    const userMsg: Message = { role: "user", content: trimmed };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setIsTyping(true);

    try {
      const res = await fetch("/api/nutrition-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages,
          mealPlan,
          userProfile,
          additionalFoods,
        }),
      });

      if (res.status === 403) {
        setIsTyping(false);
        setShowUpgrade(true);
        return;
      }

      if (!res.ok) throw new Error("API error");

      const data = await res.json();
      const assistantMsg: Message = { role: "assistant", content: data.reply };
      setMessages([...nextMessages, assistantMsg]);
      persistMessages(userMsg, assistantMsg);
    } catch {
      setMessages([
        ...nextMessages,
        {
          role: "assistant",
          content: "Sorry, something went wrong. Please try again.",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  }

  async function persistMessages(userMsg: Message, assistantMsg: Message) {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from("coach_messages").insert([
        { user_id: user.id, role: userMsg.role, content: userMsg.content },
        {
          user_id: user.id,
          role: assistantMsg.role,
          content: assistantMsg.content,
        },
      ]);
    } catch (err) {
      console.warn("Failed to save coach messages:", err);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  }

  return (
    <>
      {/* Upgrade modal */}
      {showUpgrade && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="relative mx-4 w-full max-w-sm rounded-2xl border border-bw-border bg-bw-card p-8 text-center shadow-2xl">
            <button
              onClick={() => setShowUpgrade(false)}
              className="absolute right-4 top-4 rounded-lg p-1.5 text-bw-muted hover:text-bw-text hover:bg-bw-border transition"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-bw-purple/20 border border-bw-purple/30">
              <svg
                className="w-7 h-7 text-bw-purple"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.6}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z"
                />
              </svg>
            </div>

            <h2 className="mb-1 text-xl font-bold text-bw-text">
              Unlock AI Nutrition Coach
            </h2>
            <p className="mb-1 text-sm text-bw-muted">Upgrade to Premium</p>
            <p className="mb-6 text-3xl font-extrabold bg-gradient-to-r from-bw-purple to-bw-blue bg-clip-text text-transparent">
              $4.98
              <span className="text-base font-medium text-bw-muted">/mo</span>
            </p>

            <ul className="mb-6 space-y-2.5 text-left text-sm">
              {[
                "Personalized AI nutrition coaching",
                "Unlimited chat history",
                "Macro & meal plan insights",
              ].map((f) => (
                <li key={f} className="flex items-center gap-2 text-bw-muted">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-bw-purple/20 text-bw-purple text-xs font-bold">
                    ✓
                  </span>
                  {f}
                </li>
              ))}
            </ul>

            <button className="w-full rounded-xl bg-gradient-to-r from-bw-purple to-bw-blue py-3 font-bold text-white shadow-lg hover:opacity-90 active:scale-[0.98] transition">
              Upgrade to Premium
            </button>
          </div>
        </div>
      )}

      {/* Floating widget */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        {/* Chat panel */}
        {isOpen && (
          <div
            style={{ width: 380, height: 500 }}
            className="flex flex-col rounded-2xl border border-bw-border bg-bw-card shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-bw-border bg-bw-bg px-4 py-3 shrink-0">
              <div className="flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-bw-purple"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.6}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z"
                  />
                </svg>
                <span className="text-sm font-semibold text-bw-text">
                  AI Nutrition Coach
                </span>
                <span className="rounded-full bg-bw-purple/20 border border-bw-purple/30 px-2 py-0.5 text-[10px] font-bold tracking-widest text-bw-purple uppercase">
                  Premium
                </span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1.5 text-bw-muted hover:text-bw-text hover:bg-bw-border transition"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Message list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
              {messages.length === 0 && !isTyping && (
                <div className="flex h-full flex-col items-center justify-center gap-2 pb-4 text-center">
                  <span className="text-3xl">🥦</span>
                  <p className="text-sm text-bw-muted max-w-[220px]">
                    Ask me anything about your meal plan or nutrition goals.
                  </p>
                </div>
              )}

              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-bw-purple text-white rounded-br-none"
                        : "bg-bw-border text-bw-text rounded-bl-none"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-1 rounded-2xl rounded-bl-none bg-bw-border px-4 py-3">
                    <span
                      className="h-1.5 w-1.5 rounded-full bg-bw-muted animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    />
                    <span
                      className="h-1.5 w-1.5 rounded-full bg-bw-muted animate-bounce"
                      style={{ animationDelay: "160ms" }}
                    />
                    <span
                      className="h-1.5 w-1.5 rounded-full bg-bw-muted animate-bounce"
                      style={{ animationDelay: "320ms" }}
                    />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Starter chips */}
            <div className="flex flex-wrap gap-1.5 px-4 pb-2 shrink-0">
              {STARTERS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  disabled={isTyping}
                  className="rounded-full border border-bw-border bg-bw-bg px-3 py-1.5 text-xs text-bw-muted hover:border-bw-purple hover:text-bw-purple disabled:opacity-40 transition"
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Input bar */}
            <div className="shrink-0 border-t border-bw-border bg-bw-bg px-3 py-3 flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about your nutrition..."
                className="flex-1 rounded-xl border border-bw-border bg-bw-card px-3.5 py-2 text-sm text-bw-text placeholder:text-bw-muted focus:outline-none focus:border-bw-purple transition"
              />
              <button
                onClick={() => send(input)}
                disabled={!input.trim() || isTyping}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-bw-purple text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Toggle button */}
        <button
          onClick={() => setIsOpen((v) => !v)}
          style={
            !isOpen
              ? {
                  boxShadow:
                    "0 0 18px rgba(167,139,250,0.55), 0 0 36px rgba(167,139,250,0.2)",
                }
              : undefined
          }
          className="relative flex items-center gap-2 rounded-full bg-gradient-to-r from-bw-purple to-bw-blue px-5 py-3 font-semibold text-white shadow-lg hover:opacity-90 active:scale-95 transition-all"
        >
          {/* Pulse ring (collapsed only) */}
          {!isOpen && (
            <span className="absolute inset-0 rounded-full bg-bw-purple opacity-30 animate-ping" />
          )}
          <svg
            className="relative w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.8}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z"
            />
          </svg>
          <span className="relative text-sm">Coach</span>
        </button>
      </div>
    </>
  );
}
