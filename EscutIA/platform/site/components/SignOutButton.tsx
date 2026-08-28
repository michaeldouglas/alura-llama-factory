"use client";

import { signOut } from "next-auth/react";

type SignOutButtonProps = {
  className?: string;
  onSignOut?: () => void;
};

export default function SignOutButton({ className, onSignOut }: SignOutButtonProps) {
  return (
    <button
      type="button"
      onClick={() => {
        onSignOut?.();
        void signOut({ callbackUrl: "/" });
      }}
      className={className ?? "rounded-full border border-navy/10 px-5 py-3 text-sm font-bold text-navy transition hover:border-purple hover:text-purple"}
    >
      Sair
    </button>
  );
}
