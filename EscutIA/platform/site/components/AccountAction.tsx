"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";

import AuthModal from "@/components/AuthModal";

type AccountActionProps = {
  className?: string;
  onNavigate?: () => void;
};

export default function AccountAction({ className, onNavigate }: AccountActionProps) {
  const { status } = useSession();

  if (status === "authenticated") {
    return (
      <Link href="/dashboard" className={className} onClick={onNavigate}>
        Dashboard
      </Link>
    );
  }

  if (status === "loading") {
    return (
      <span className={`${className ?? ""} text-navy/45`} aria-busy="true">
        Carregando...
      </span>
    );
  }

  return <AuthModal className={className} />;
}
