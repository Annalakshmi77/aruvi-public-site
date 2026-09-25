import React from "react";
import { Check } from "lucide-react";

export const TapeTypesSection: React.FC = () => {
  const tapeCards = [
    {
      badge: "PRINTED",
      title: "Custom printed",
      description:
        "Your logo, tagline, handling instructions or QR code, printed in one or multiple colours.",
      features: [
        "1 to 6 color rotogravure printing",
        "Sharp edge reproduction for logos & QR codes",
        "Chemical or electric cylinder dye options",
      ],
    },
    {
      badge: "PLAIN",
      title: "Plain BOPP",
      description:
        "Reliable unprinted tape in standard or special colours, with no dye charge.",
      features: [
        "High shear strength & long shelf life",
        "Milky White, Brown & Transparent in stock",
        "Zero dye charge & fastest dispatch",
      ],
    },
    {
      badge: "MADE TO ORDER",
      title: "Your specification",
      description:
        "Choose a 1 to 6 inch width, base colour and roll length for larger orders.",
      features: [
        "Custom lengths (100m to 1000m jumbo rolls)",
        "Special base film colors (Pink, Violet, Green)",
        "Custom mic (40 to 52 micron) adhesive coating",
      ],
    },
  ];

  return (
    <section id="types" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
        <div>
          <span className="text-xs font-mono font-bold tracking-widest text-[#0d4d3d] uppercase mb-2 block">
            01 — TAPE TYPES
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#0d382c] tracking-tight font-display">
            Made around your package
          </h2>
        </div>
        <p className="text-base sm:text-lg text-[#0d382c]/75 max-w-md">
          Start with your artwork, colour and box quantity. We handle the rest.
        </p>
      </div>

      {/* 3 Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {tapeCards.map((card) => (
          <div
            key={card.title}
            className="group relative bg-[#faf6f0] border border-[#0d382c]/15 hover:border-[#0d4d3d] rounded-2xl p-7 transition-all duration-200 hover:shadow-lg flex flex-col justify-between"
          >
            <div>
              <span className="text-[11px] font-mono tracking-widest font-bold text-[#0d4d3d] uppercase block mb-3">
                {card.badge}
              </span>
              <h3 className="text-2xl font-bold text-[#0d382c] mb-3 group-hover:text-[#0d4d3d] transition-colors">
                {card.title}
              </h3>
              <p className="text-sm leading-relaxed text-[#0d382c]/80 mb-6">
                {card.description}
              </p>
            </div>

            <div className="pt-4 border-t border-[#0d382c]/10 flex items-center text-xs text-[#0d4d3d] font-semibold">
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-[#0d4d3d] stroke-[3]" />
                In Production
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
