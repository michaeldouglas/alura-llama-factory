import About from "@/components/About";
import CTA from "@/components/CTA";
import Features from "@/components/Features";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import HowItWorks from "@/components/HowItWorks";
import Safety from "@/components/Safety";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";

const websiteStructuredData = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "EscutIA",
  description: "Apoio emocional para conversar, organizar pensamentos e encontrar um próximo passo.",
  url: siteUrl,
};

export default function Home() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteStructuredData) }} />
      <div className="min-h-screen overflow-hidden bg-warm text-navy">
        <Header />
        <main id="main-content">
          <Hero />
          <HowItWorks />
          <Features />
          <Safety />
          <About />
          <CTA />
        </main>
        <Footer />
      </div>
    </>
  );
}
