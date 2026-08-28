"use client";

import Image from "next/image";
import { useState } from "react";

import AccountAction from "@/components/AccountAction";
import ConversationAction from "@/components/ConversationAction";

const links = [
  ["Início", "#inicio"],
  ["Como funciona", "#como-funciona"],
  ["Recursos", "#recursos"],
  ["Sobre nós", "#sobre"],
  ["Segurança", "#seguranca"],
];

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-navy/5 bg-warm/90 backdrop-blur-xl">
      <div className="site-container flex h-[76px] items-center justify-between">
        <a href="#inicio" aria-label="EscutIA — voltar ao início" onClick={() => setOpen(false)}>
          <Image src="/logo.png" alt="EscutIA" width={132} height={45} priority className="h-auto w-[122px]" />
        </a>

        <nav aria-label="Navegação principal" className="hidden items-center gap-7 lg:flex">
          {links.map(([label, href]) => (
            <a key={href} href={href} className="text-sm font-semibold text-navy/65 transition hover:text-purple">
              {label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 sm:flex">
          <AccountAction className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-bold text-navy transition hover:bg-white" />
          <ConversationAction className="rounded-full bg-navy px-5 py-3 text-sm font-bold text-white shadow-lg shadow-navy/15 transition hover:-translate-y-0.5 hover:bg-purple" />
        </div>

        <button
          type="button"
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          aria-expanded={open}
          onClick={() => setOpen(!open)}
          className="rounded-xl border border-navy/10 p-2.5 text-navy transition hover:border-purple hover:text-purple sm:hidden"
        >
          <span aria-hidden="true" className="block text-xl leading-none">{open ? "×" : "☰"}</span>
        </button>
      </div>

      {open && (
        <nav aria-label="Menu mobile" className="border-t border-navy/5 bg-warm px-5 pb-5 pt-3 sm:hidden">
          {links.map(([label, href]) => (
            <a key={href} href={href} onClick={() => setOpen(false)} className="block border-b border-navy/5 py-3 text-sm font-semibold text-navy/70">
              {label}
            </a>
          ))}
          <AccountAction
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-navy/10 px-5 py-3 text-center text-sm font-bold text-navy"
            onNavigate={() => setOpen(false)}
          />
          <ConversationAction className="mt-4 block w-full rounded-full bg-navy px-5 py-3 text-center text-sm font-bold text-white" />
        </nav>
      )}
    </header>
  );
}
