import About from "@/components/About";
import CTA from "@/components/CTA";
import Features from "@/components/Features";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import HowItWorks from "@/components/HowItWorks";
import Safety from "@/components/Safety";

export default function Home() {
  return (
    <div className="min-h-screen overflow-hidden bg-warm text-navy">
      <Header />
      <main>
        <Hero />
        <HowItWorks />
        <Features />
        <Safety />
        <About />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
