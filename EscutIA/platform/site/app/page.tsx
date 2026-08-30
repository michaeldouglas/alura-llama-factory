import About from "@/components/site/About";
import CTA from "@/components/site/CTA";
import Features from "@/components/site/Features";
import Footer from "@/components/site/Footer";
import Header from "@/components/site/Header";
import Hero from "@/components/site/Hero";
import HowItWorks from "@/components/site/HowItWorks";
import Safety from "@/components/site/Safety";

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
