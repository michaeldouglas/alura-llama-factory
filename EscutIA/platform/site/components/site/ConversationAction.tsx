"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useSession } from "next-auth/react";

import AuthModal from "@/components/shared/AuthModal";

type ConversationActionProps = {
  className?: string;
};

const conversationLabel = (
  <>
    Conversar agora <ArrowUpRight aria-hidden="true" size={16} className="ml-1 inline-block transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transition-none" />
  </>
);

export default function ConversationAction({ className }: ConversationActionProps) {
  const { status } = useSession();
  const actionClassName = `${className ?? ""} group active:scale-[0.98]`;

  if (status === "loading") {
    return (
      <span className={`${className ?? ""} cursor-wait opacity-70`} aria-busy="true" aria-live="polite">
        Carregando…
      </span>
    );
  }

  if (status === "authenticated") {
    return (
      <Link href="/chat" className={actionClassName}>
        {conversationLabel}
      </Link>
    );
  }

  return (
    <AuthModal className={actionClassName} callbackUrl="/chat">
      {conversationLabel}
    </AuthModal>
  );
}
