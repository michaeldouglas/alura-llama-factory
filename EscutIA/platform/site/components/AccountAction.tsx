"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { useSession } from "next-auth/react";

import AuthModal from "@/components/AuthModal";
import SignOutButton from "@/components/SignOutButton";

type AccountActionProps = {
  className?: string;
  onNavigate?: () => void;
};

export default function AccountAction({ className, onNavigate }: AccountActionProps) {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  if (status === "authenticated") {
    const displayName = session.user?.name || session.user?.email?.split("@")[0] || "pessoa";
    const firstName = displayName.trim().split(/\s+/)[0] || "pessoa";
    const initials = displayName
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
    const menuLabel = `Menu da conta de ${displayName}`;

    return (
      <div ref={menuRef} className="relative w-full sm:w-auto">
        <button
          ref={triggerRef}
          type="button"
          className={className}
          aria-label={`Abrir ${menuLabel}`}
          aria-expanded={open}
          aria-controls={`account-menu-${menuId}`}
          aria-haspopup="true"
          onClick={() => setOpen((current) => !current)}
        >
          {session.user?.image ? (
            <Image
              src={session.user.image}
              alt=""
              width={32}
              height={32}
              className="h-8 w-8 rounded-full object-cover"
            />
          ) : (
            <span aria-hidden="true" className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-purple/15 text-xs font-black text-purple">
              {initials}
            </span>
          )}
          <span className="min-w-0 truncate">Olá, {firstName}</span>
          <svg
            aria-hidden="true"
            viewBox="0 0 16 16"
            className={`h-4 w-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          >
            <path
              d="m4 6 4 4 4-4"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.75"
            />
          </svg>
        </button>

        {open && (
          <div
            id={`account-menu-${menuId}`}
            aria-label={menuLabel}
            className="absolute right-0 top-[calc(100%+0.65rem)] z-50 w-[min(18rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-navy/10 bg-white p-2 text-left shadow-2xl shadow-navy/15 sm:w-72"
          >
            <Link
              href="/dashboard"
              onClick={() => {
                setOpen(false);
                onNavigate?.();
              }}
              className="flex items-center justify-between rounded-xl px-3 py-3 text-sm font-bold text-navy transition hover:bg-warm hover:text-purple"
            >
              <span>Dashboard</span>
              <span aria-hidden="true" className="text-base">→</span>
            </Link>

            <div className="my-1 border-t border-navy/8" />

            <div className="flex min-w-0 items-center gap-3 rounded-xl bg-warm/75 px-3 py-3">
              {session.user?.image ? (
                <Image
                  src={session.user.image}
                  alt={`Foto de ${displayName}`}
                  width={44}
                  height={44}
                  className="h-11 w-11 shrink-0 rounded-full object-cover"
                />
              ) : (
                <span aria-hidden="true" className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-purple/15 text-sm font-black text-purple">
                  {initials}
                </span>
              )}
              <div className="min-w-0">
                <p className="text-sm font-black text-navy">Olá, {firstName}</p>
                <p className="mt-0.5 truncate text-xs text-navy/55">{session.user?.email || displayName}</p>
              </div>
            </div>

            <div className="my-1 border-t border-navy/8" />

            <SignOutButton
              className="flex w-full items-center rounded-xl px-3 py-3 text-left text-sm font-bold text-navy/70 transition hover:bg-pink/10 hover:text-pink"
              onSignOut={() => {
                setOpen(false);
                onNavigate?.();
              }}
            />
          </div>
        )}
      </div>
    );
  }

  if (status === "loading") {
    return (
      <span className={`${className ?? ""} text-navy/45`} aria-busy="true">
        Carregando…
      </span>
    );
  }

  return <AuthModal className={className} />;
}
