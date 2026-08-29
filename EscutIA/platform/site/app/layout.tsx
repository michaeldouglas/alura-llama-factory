import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import AuthProvider from "@/components/AuthProvider";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  ...(siteUrl
    ? {
        metadataBase: new URL(siteUrl),
        alternates: { canonical: "/" },
      }
    : {}),
  title: {
    default: "Apoio emocional online para falar e ser ouvido | EscutIA",
    template: "%s | EscutIA",
  },
  description:
    "Converse sobre o que você está vivendo, organize seus pensamentos e encontre um próximo passo com acolhimento, privacidade e sem julgamentos.",
  applicationName: "EscutIA",
  keywords: [
    "apoio emocional",
    "conversa acolhedora",
    "saúde emocional",
    "escuta",
  ],
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "EscutIA",
    title: "Apoio emocional online para falar e ser ouvido | EscutIA",
    description:
      "Converse sobre o que você está vivendo, organize seus pensamentos e encontre um próximo passo com acolhimento, privacidade e sem julgamentos.",
    ...(siteUrl ? { url: "/" } : {}),
    images: [
      {
        url: "/logo.png",
        width: 2172,
        height: 724,
        alt: "EscutIA",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Apoio emocional online para falar e ser ouvido | EscutIA",
    description:
      "Converse sobre o que você está vivendo, organize seus pensamentos e encontre um próximo passo com acolhimento, privacidade e sem julgamentos.",
    images: ["/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <a
          href="#main-content"
          className="sr-only rounded-full bg-navy px-4 py-3 text-sm font-bold text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200]"
        >
          Pular para o conteúdo principal
        </a>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
