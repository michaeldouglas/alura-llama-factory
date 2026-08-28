"use client";

import { signIn } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type AuthModalProps = {
  className?: string;
};

export default function AuthModal({ className }: AuthModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    previouslyFocusedRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    const focusableSelector =
      '#login-modal-dialog button:not([disabled]), #login-modal-dialog [href], #login-modal-dialog input:not([disabled]), #login-modal-dialog select:not([disabled]), #login-modal-dialog textarea:not([disabled]), #login-modal-dialog [tabindex]:not([tabindex="-1"])';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        return;
      }

      if (event.key !== "Tab") return;

      const focusableElements = Array.from(document.querySelectorAll<HTMLElement>(focusableSelector));
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (!document.querySelector("#login-modal-dialog")?.contains(document.activeElement)) {
        event.preventDefault();
        firstElement.focus();
      } else if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);
    const focusTimer = window.setTimeout(() => closeButtonRef.current?.focus(), 0);

    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocusedRef.current?.focus();
      previouslyFocusedRef.current = null;
    };
  }, [open]);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    await signIn("google", { callbackUrl: "/dashboard" });
    setLoading(false);
  };

  return (
    <>
      <button ref={triggerRef} type="button" className={className} onClick={() => setOpen(true)}>
        Entrar
      </button>

      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-navy/45 px-5 py-8 backdrop-blur-sm"
            role="presentation"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setOpen(false);
            }}
          >
            <section
              id="login-modal-dialog"
              aria-labelledby="login-modal-title"
              aria-describedby="login-modal-description"
              aria-modal="true"
              className="w-full max-w-md rounded-[30px] bg-warm p-7 text-navy shadow-2xl sm:p-9"
              role="dialog"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="eyebrow">bem-vindo de volta</p>
                  <h2 id="login-modal-title" className="mt-3 text-3xl font-black tracking-[-0.04em]">
                    Entre na EscutIA
                  </h2>
                </div>
                <button
                  ref={closeButtonRef}
                  type="button"
                  aria-label="Fechar janela de login"
                  onClick={() => setOpen(false)}
                  className="rounded-full px-3 py-1 text-2xl leading-none text-navy/55 transition hover:bg-white hover:text-navy"
                >
                  ×
                </button>
              </div>

              <p id="login-modal-description" className="mt-4 leading-7 text-navy/65">
                Use sua conta Google para acessar seu espaço pessoal.
              </p>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="mt-7 flex w-full items-center justify-center gap-3 rounded-full bg-white px-5 py-4 text-sm font-extrabold text-navy shadow-lg shadow-navy/10 transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-wait disabled:opacity-60"
              >
                <span aria-hidden="true" className="text-lg font-black text-purple">
                  G
                </span>
                {loading ? "Abrindo o Google..." : "Continuar com Google"}
              </button>

              <p className="mt-5 text-center text-xs leading-5 text-navy/45">
                Ao continuar, você será redirecionado para a autenticação segura do Google.
              </p>
            </section>
          </div>,
          document.body,
        )}
    </>
  );
}
