"use client";

import Link from "next/link";
import { Bot, Copy, Plus, RotateCcw, Send, Sparkles, ThumbsDown, ThumbsUp } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Avatar, StatusBadge } from "../components/ui/product-ui";

type Message = { id: number; role: "user" | "assistant"; text: string };

const prompts = [
  "Find tickets similar to TS-101",
  "Summarize today’s critical work",
  "Explain the authentication latency logs",
  "Draft release notes for resolved tickets",
];

export function AssistantWorkspace() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, role: "assistant", text: "I can investigate tickets, explain logs, compare incidents, and turn findings into actionable work. What should we look at?" },
  ]);

  function submit(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    setMessages((current) => [
      ...current,
      { id: Date.now(), role: "user", text: trimmed },
      {
        id: Date.now() + 1,
        role: "assistant",
        text: "I found a strong relationship between TS-101 and two earlier authentication incidents. The common signal is connection-pool exhaustion after RS256 verification. I recommend increasing worker concurrency, then validating p99 latency under a 6k RPS load test.",
      },
    ]);
    setInput("");
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    submit(input);
  }

  return (
    <div className="grid min-h-0 flex-1 lg:grid-cols-[260px_minmax(0,1fr)_300px]">
      <aside className="hidden border-r border-[var(--outline-variant)] bg-[var(--surface-container-low)] p-4 lg:block">
        <button className="mb-5 flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[var(--primary-container)] text-xs font-semibold text-[var(--on-primary-container)]" onClick={() => setMessages([])} type="button"><Plus size={14} /> New conversation</button>
        <p className="mb-2 px-2 font-mono text-[9px] uppercase tracking-wider text-[var(--outline)]">Recent</p>
        {["Investigate TS-101 latency", "Weekly support summary", "Compare OAuth incidents", "Release notes draft"].map((item, index) => <button className={`mb-1 w-full truncate rounded-lg px-3 py-2.5 text-left text-xs ${index === 0 ? "bg-[var(--secondary-container)] text-[var(--on-secondary-container)]" : "text-[var(--on-surface-variant)] hover:bg-[var(--surface-container-high)]"}`} key={item} type="button">{item}</button>)}
      </aside>

      <main className="flex min-h-0 flex-col">
        <header className="border-b border-[var(--outline-variant)] px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-xl bg-[var(--primary-container)] text-[var(--on-primary-container)]"><Bot size={18} /></span>
            <div><h1 className="text-sm font-semibold">TicketSense AI</h1><p className="text-[10px] text-[var(--outline)]">Uses workspace tickets and verified solutions</p></div>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="mx-auto max-w-3xl space-y-5">
            {messages.length === 1 && (
              <div className="grid gap-2 sm:grid-cols-2">
                {prompts.map((prompt) => <button className="rounded-xl border border-[var(--outline-variant)] bg-[var(--surface-container-low)] p-4 text-left text-xs leading-5 hover:border-[var(--primary)]" key={prompt} onClick={() => submit(prompt)} type="button"><Sparkles className="mb-3 text-[var(--primary)]" size={16} />{prompt}</button>)}
              </div>
            )}
            {messages.map((message) => (
              <div className={`flex gap-3 ${message.role === "user" ? "justify-end" : ""}`} key={message.id}>
                {message.role === "assistant" && <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[var(--primary-container)] text-[var(--on-primary-container)]"><Bot size={15} /></span>}
                <div className={`max-w-[82%] rounded-xl px-4 py-3 text-sm leading-6 ${message.role === "user" ? "bg-[var(--secondary-container)] text-[var(--on-secondary-container)]" : "border border-[var(--outline-variant)] bg-[var(--surface-container-low)]"}`}>
                  <p>{message.text}</p>
                  {message.role === "assistant" && message.id !== 1 && <div className="mt-4 flex items-center gap-1 border-t border-[var(--outline-variant)] pt-3 text-[var(--outline)]"><button aria-label="Copy response" className="rounded p-1.5 hover:bg-[var(--surface-container-high)]" type="button"><Copy size={13} /></button><button aria-label="Retry response" className="rounded p-1.5 hover:bg-[var(--surface-container-high)]" type="button"><RotateCcw size={13} /></button><button aria-label="Helpful" className="rounded p-1.5 hover:bg-[var(--surface-container-high)]" type="button"><ThumbsUp size={13} /></button><button aria-label="Not helpful" className="rounded p-1.5 hover:bg-[var(--surface-container-high)]" type="button"><ThumbsDown size={13} /></button></div>}
                </div>
                {message.role === "user" && <Avatar initials="AM" name="Alex Morgan" size="md" />}
              </div>
            ))}
          </div>
        </div>
        <form className="border-t border-[var(--outline-variant)] p-4" onSubmit={handleSubmit}>
          <div className="mx-auto flex max-w-3xl items-end gap-2 rounded-xl border border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] p-2 focus-within:border-[var(--primary)]">
            <label className="sr-only" htmlFor="assistant-message">Ask TicketSense AI</label>
            <textarea className="max-h-36 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none" id="assistant-message" onChange={(event) => setInput(event.target.value)} placeholder="Ask about a ticket, incident, or workflow…" value={input} />
            <button aria-label="Send message" className="grid size-10 shrink-0 place-items-center rounded-lg bg-[var(--primary-container)] text-[var(--on-primary-container)] disabled:opacity-40" disabled={!input.trim()} type="submit"><Send size={16} /></button>
          </div>
        </form>
      </main>

      <aside className="hidden border-l border-[var(--outline-variant)] bg-[var(--surface-container-low)] p-4 xl:block">
        <p className="mb-3 font-mono text-[9px] uppercase tracking-wider text-[var(--outline)]">Referenced tickets</p>
        <Link className="block rounded-xl border border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] p-4 hover:border-[var(--primary)]" href="/tickets/TS-101">
          <div className="mb-2 flex items-center justify-between"><span className="font-mono text-[9px] text-[var(--primary)]">TS-101</span><StatusBadge status="Open" /></div>
          <strong className="text-xs leading-5">Database migration latency in production</strong>
        </Link>
      </aside>
    </div>
  );
}
