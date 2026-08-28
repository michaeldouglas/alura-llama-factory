"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";

import AuthModal from "@/components/AuthModal";

type ConversationActionProps = {
  className?: string;
};

const conversationLabel = (
  <>
    Conversar agora <span aria-hidden="true" className="ml-1">↗</span>
  </>
);

export default function ConversationAction({ className }: ConversationActionProps) {
  const { status } = useSession();

  if (status === "loading") {
    return (
      <span className={`${className ?? ""} cursor-wait opacity-70`} aria-busy="true">
        Carregando...
      </span>
    );
  }

  if (status === "authenticated") {
    return (
      <Link href="/chat" className={className}>
        {conversationLabel}
      </Link>
    );
  }

  return (
    <AuthModal className={className} callbackUrl="/chat">
      {conversationLabel}
    </AuthModal>
  );
}
