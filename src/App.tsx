import React, { useEffect } from "react";
import { Header } from "@/components/Header";
import { TapeHeroImage } from "@/components/TapeHeroImage";
import { TapeMarquee } from "@/components/TapeMarquee";
import { TapeTypesSection } from "@/components/TapeTypesSection";
import { GallerySection } from "@/components/GallerySection";
import { WidthsSection } from "@/components/WidthsSection";
import { ContactSection } from "@/components/ContactSection";
import { Footer } from "@/components/Footer";
import { ArrowRight, Sparkles } from "lucide-react";
import { checkAutoStartTour } from "@/lib/agentDemo";

export function App() {
  useEffect(() => {
    void checkAutoStartTour();
  }, []);

  return (
    <div className="min-h-screen bg-white text-[#0d382c] font-display selection:bg-[#e58a00]/30 flex flex-col">
      {/* Navigation Bar */}
      <Header />

      {/* Main Content Area */}
      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative pt-12 pb-16 lg:pt-16 lg:pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Column: Value Proposition & CTAs */}
            <div className="lg:col-span-7 flex flex-col justify-center">
              {/* Kicker badge */}
              <div className="text-xs font-mono font-bold tracking-widest text-[#0d4d3d] uppercase mb-4">
                CUSTOM PRINTED · PLAIN BOPP
              </div>

              {/* Main Heading */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#0d382c] tracking-tight leading-[1.08] mb-6">
                Tape that seals <br className="hidden sm:inline" />
                the deal.
              </h1>

              {/* Subtitle / Description */}
              <p className="text-base sm:text-lg lg:text-xl text-[#0d382c]/80 leading-relaxed max-w-xl mb-8">
                Branded and plain packing tape, made at our factory in Sivakasi. Widths from 1 to 6 inches, 100-metre rolls, ready in 15 days — starting from a single box.
              </p>

              {/* Call to Actions */}
              <div className="flex flex-wrap items-center gap-4 mb-12">
                <a
                  href="#types"
                  className="bg-[#0d4d3d] hover:bg-[#09382c] text-[#f5f0e6] font-bold px-6 py-3.5 rounded-lg flex items-center gap-2 shadow-xs transition-all hover:scale-[1.02] cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-[#e58a00]" />
                  <span>Explore Tape Types</span>
                </a>

                <a
                  href="#gallery"
                  className="inline-flex items-center gap-2 border border-[#0d382c]/30 hover:border-[#0d4d3d] bg-transparent text-[#0d382c] px-6 py-3.5 rounded-lg font-bold hover:bg-[#0d4d3d]/5 transition-colors"
                >
                  <span>View Products</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>

              {/* 4 Stats Metrics Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-6 border-t border-[#0d382c]/15">
                <div>
                  <div className="font-mono font-bold text-2xl sm:text-3xl text-[#0d4d3d] tracking-tight">
                    1–6"
                  </div>
                  <div className="text-[11px] font-mono tracking-widest text-[#0d382c]/65 uppercase mt-0.5">
                    WIDTHS
                  </div>
                </div>

                <div>
                  <div className="font-mono font-bold text-2xl sm:text-3xl text-[#0d4d3d] tracking-tight">
                    100 m
                  </div>
                  <div className="text-[11px] font-mono tracking-widest text-[#0d382c]/65 uppercase mt-0.5">
                    ROLL LENGTH
                  </div>
                </div>

                <div>
                  <div className="font-mono font-bold text-2xl sm:text-3xl text-[#0d4d3d] tracking-tight">
                    15 days
                  </div>
                  <div className="text-[11px] font-mono tracking-widest text-[#0d382c]/65 uppercase mt-0.5">
                    TURNAROUND
                  </div>
                </div>

                <div>
                  <div className="font-mono font-bold text-2xl sm:text-3xl text-[#0d4d3d] tracking-tight">
                    1 box
                  </div>
                  <div className="text-[11px] font-mono tracking-widest text-[#0d382c]/65 uppercase mt-0.5">
                    MINIMUM
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Hero Product Showcase */}
            <div className="lg:col-span-5 flex justify-center">
              <TapeHeroImage />
            </div>
          </div>
        </section>

        {/* CONTINUOUS MARQUEE TICKER */}
        <TapeMarquee />

        {/* 01 - TAPE TYPES SECTION */}
        <TapeTypesSection />

        {/* 02 - GALLERY / PRODUCTS SECTION */}
        <GallerySection />

        {/* 03 - WIDTHS SECTION */}
        <WidthsSection />

        {/* 04 - CONTACT SECTION */}
        <ContactSection />
      </main>

      {/* FOOTER */}
      <Footer />
    </div>
  );
}

export default App;
