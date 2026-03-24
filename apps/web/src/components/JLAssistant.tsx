"use client";

/**
 * JLAssistant — Universal floating Claude AI assistant
 * Appears on every JL project page as a floating action button.
 * Connects to ask-jl Supabase Edge Function.
 * JackoLeeno JL — "كل كود وفكرة وقرار صُنع بحب"
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { MessageCircle, X, Send, Loader2, Bot, RefreshCw } from "lucide-react";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://huzekvothmihiljegmor.supabase.co";
const ASK_JL_URL  = `${SUPABASE_URL}/functions/v1/ask-jl`;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

type ProjectContext = "factory" | "ops" | "hub" | "general";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface JLAssistantProps {
  project?: ProjectContext;
  lang?: "ar" | "en";
}

export default function JLAssistant({ project = "factory", lang = "ar" }: JLAssistantProps) {
  const isAr = lang === "ar";
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Focus input when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  // Greeting on first open
  useEffect(() => {
    if (open && messages.length === 0) {
      const greeting = isAr
        ? "مرحباً! أنا مساعدك JL. كيف أقدر أساعدك اليوم؟ 👋"
        : "Hello! I'm your JL Assistant. How can I help you today? 👋";
      setMessages([{ role: "assistant", content: greeting }]);
    }
  }, [open, messages.length, isAr]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    setError(null);
    setMessages(prev => [...prev, { role: "user", content: text }]);
    setLoading(true);

    // Add empty assistant message for streaming
    setMessages(prev => [...prev, { role: "assistant", content: "" }]);

    try {
      const res = await fetch(ASK_JL_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_ANON_KEY,
          "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ message: text, lang, project, stream: true }),
      });

      if (!res.ok || !res.body) {
        throw new Error(isAr ? "خطأ في الاتصال" : "Connection error");
      }

      const reader  = res.body.getReader();
      const decoder = new TextDecoder("utf-8", { fatal: false });
      let buffer = "";
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let idx: number;
        while ((idx = buffer.indexOf("\n")) !== -1) {
          const line = buffer.slice(0, idx).trim();
          buffer = buffer.slice(idx + 1);
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const chunk = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (chunk) {
              accumulated += chunk;
              setMessages(prev => {
                const msgs = [...prev];
                msgs[msgs.length - 1] = { role: "assistant", content: accumulated };
                return msgs;
              });
            }
          } catch { /* partial JSON */ }
        }
      }

      if (!accumulated) {
        setMessages(prev => {
          const msgs = [...prev];
          msgs[msgs.length - 1] = {
            role: "assistant",
            content: isAr ? "لم أتمكن من الرد. حاول مرة أخرى." : "Could not respond. Please try again.",
          };
          return msgs;
        });
      }
    } catch (err) {
      setMessages(prev => prev.slice(0, -1)); // remove empty assistant message
      setError(isAr ? "حدث خطأ. يرجى المحاولة مرة أخرى." : "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [input, loading, lang, project, isAr]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const reset = () => {
    setMessages([]);
    setError(null);
    setInput("");
  };

  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3"
      dir={isAr ? "rtl" : "ltr"}
    >
      {/* ── Chat Panel ──────────────────────────────────── */}
      {open && (
        <div className="w-[340px] max-h-[520px] flex flex-col bg-[#0f0f1a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-purple-900/60 to-pink-900/40 border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white leading-none">
                  {isAr ? "المساعد JL" : "JL Assistant"}
                </p>
                <p className="text-[10px] text-purple-300">Claude · JackoLeeno JL</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={reset}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
                title={isAr ? "محادثة جديدة" : "New chat"}
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0 max-h-[360px]">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] px-3 py-2 rounded-xl text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "bg-purple-600/80 text-white rounded-br-none"
                      : "bg-white/5 border border-white/10 text-gray-200 rounded-bl-none"
                  }`}
                >
                  {msg.content || (
                    loading && i === messages.length - 1
                      ? <span className="flex gap-1 items-center py-1">
                          <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                          <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                          <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                        </span>
                      : null
                  )}
                </div>
              </div>
            ))}

            {error && (
              <div className="text-xs text-red-400 text-center px-2">{error}</div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-3 pb-3 pt-2 border-t border-white/5">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isAr ? "اكتب رسالتك..." : "Type your message..."}
                rows={1}
                disabled={loading}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 resize-none focus:outline-none focus:border-purple-500 transition-colors disabled:opacity-50"
                style={{ maxHeight: "80px" }}
              />
              <button
                type="button"
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="flex-shrink-0 w-9 h-9 flex items-center justify-center bg-gradient-to-br from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-40 rounded-xl transition-all"
              >
                {loading
                  ? <Loader2 className="w-4 h-4 text-white animate-spin" />
                  : <Send className="w-4 h-4 text-white" />
                }
              </button>
            </div>
            <p className="text-[9px] text-gray-600 text-center mt-1">
              {isAr ? "مشغّل بـ Claude · JackoLeeno JL" : "Powered by Claude · JackoLeeno JL"}
            </p>
          </div>
        </div>
      )}

      {/* ── FAB Button ──────────────────────────────────── */}
      <button
        type="button"
        onClick={() => setOpen(p => !p)}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ${
          open
            ? "bg-white/10 border border-white/20 text-gray-300"
            : "bg-gradient-to-br from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-purple-500/30"
        }`}
        title={isAr ? "المساعد JL" : "JL Assistant"}
      >
        {open ? <X className="w-5 h-5" /> : <Bot className="w-6 h-6" />}
        {/* Pulse ring when closed */}
        {!open && (
          <span className="absolute w-14 h-14 rounded-full border-2 border-purple-500/30 animate-ping" />
        )}
      </button>
    </div>
  );
}
