"use client";

import Image from "next/image";
import { ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";

const greeting = "Oi. O que está ocupando mais espaço na sua cabeça hoje?";
const userMessage = "Tenho tentado dar conta de tudo e estou cansado.";
const responseMessage = "Parece que tem sido pesado sustentar tudo ao mesmo tempo. Quer começar pelo que mais apertou hoje?";

export default function ChatPreview() {
  const [showUserMessage, setShowUserMessage] = useState(false);
  const [typing, setTyping] = useState(false);
  const [response, setResponse] = useState("");
  const [cycle, setCycle] = useState(0);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      setShowUserMessage(true);
      setResponse(responseMessage);
      return;
    }

    let responseInterval: number | undefined;
    const timers: number[] = [];
    const schedule = (callback: () => void, delay: number) => {
      timers.push(window.setTimeout(callback, delay));
    };

    setShowUserMessage(false);
    setTyping(false);
    setResponse("");
    schedule(() => setShowUserMessage(true), 900);
    schedule(() => setTyping(true), 1650);
    schedule(() => {
      setTyping(false);
      setResponse(responseMessage.slice(0, 1));
      let index = 1;
      responseInterval = window.setInterval(() => {
        index += 1;
        setResponse(responseMessage.slice(0, index));
        if (index >= responseMessage.length && responseInterval) {
          window.clearInterval(responseInterval);
          responseInterval = undefined;
        }
      }, 26);
    }, 2600);
    schedule(() => setCycle((current) => current + 1), 7100);

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      if (responseInterval) window.clearInterval(responseInterval);
    };
  }, [cycle]);

  return (
    <section className="hero-enter relative mx-auto w-full max-w-[490px] [--hero-delay:320ms]" aria-label="Exemplo de conversa com a EscutIA">
      <div aria-hidden="true" className="float-slow absolute -left-10 top-20 h-20 w-20 rounded-[30px] bg-peach/80 blur-[1px]" />
      <div aria-hidden="true" className="float-delay absolute -right-8 bottom-10 h-24 w-24 rounded-full bg-lilac/50 blur-[2px]" />
      <div className="relative overflow-hidden rounded-[30px] border border-white/80 bg-white/90 p-4 shadow-2xl shadow-purple/15 backdrop-blur">
        <div className="flex items-center justify-between gap-3 border-b border-navy/8 px-3 pb-4">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white p-2 shadow-md shadow-pink/20"><Image src="/escutia-mark.png" alt="" width={1254} height={1254} className="h-full w-full object-contain" /></div>
            <div>
              <p className="font-bold text-navy">EscutIA</p>
              <p className="text-xs font-medium text-navy/50">IA de apoio emocional</p>
            </div>
          </div>
          <span className="shrink-0 rounded-full bg-warm px-3 py-1.5 text-xs font-bold text-navy/50">exemplo</span>
        </div>

        <div className="space-y-3 px-1 py-5" aria-live="polite">
          <div className="flex justify-start"><div className="chat-message-enter max-w-[88%] rounded-[20px] rounded-bl-md bg-[#f2efff] px-4 py-3 text-sm leading-relaxed text-navy/80">{greeting}</div></div>
          {showUserMessage ? <div className="flex justify-end"><div className="chat-message-enter max-w-[88%] rounded-[20px] rounded-br-md bg-navy px-4 py-3 text-sm leading-relaxed text-white">{userMessage}</div></div> : null}
          {typing ? <div className="flex justify-start"><div role="status" className="chat-message-enter rounded-[20px] rounded-bl-md bg-[#f2efff] px-4 py-3 text-navy/55"><span className="sr-only">A EscutIA está digitando…</span><span aria-hidden="true" className="flex items-center gap-1"><span className="typing-dot h-1.5 w-1.5 rounded-full bg-purple" /><span className="typing-dot h-1.5 w-1.5 rounded-full bg-purple" /><span className="typing-dot h-1.5 w-1.5 rounded-full bg-purple" /></span></div></div> : null}
          {response ? <div className="flex justify-start"><div className="chat-message-enter max-w-[88%] rounded-[20px] rounded-bl-md bg-[#f2efff] px-4 py-3 text-sm leading-relaxed text-navy/80">{response}</div></div> : null}
        </div>

        <div className="flex items-center gap-2 rounded-2xl bg-warm p-2">
          <span className="flex-1 px-3 text-sm text-navy/35">Escreva como você está…</span>
          <span aria-hidden="true" className="grid h-10 w-10 place-items-center rounded-xl bg-purple text-white"><ArrowUp size={18} strokeWidth={2.5} /></span>
        </div>
        <p className="mt-3 text-center text-[11px] font-medium text-navy/35">Uma prévia da experiência. A conversa real começa quando você entrar.</p>
      </div>
    </section>
  );
}
