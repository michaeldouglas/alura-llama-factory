"use client";

import { signOut } from "next-auth/react";

export default function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/" })}
      className="rounded-full border border-navy/10 px-5 py-3 text-sm font-bold text-navy transition hover:border-purple hover:text-purple"
    >
      Sair
    </button>
  );
}
