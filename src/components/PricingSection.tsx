import React from "react";

interface ColorSwatch {
  name: string;
  color: string;
  isTransparent?: boolean;
}

const colorMap: Record<string, ColorSwatch> = {
  "Milky White": { name: "Milky White", color: "#fcfbf8" },
  Brown: { name: "Brown", color: "#78350f" },
  Transparent: { name: "Transparent", color: "#f1ede4", isTransparent: true },
  Orange: { name: "Orange", color: "#ea580c" },
  Red: { name: "Red", color: "#dc2626" },
  Yellow: { name: "Yellow", color: "#eab308" },
  Black: { name: "Black", color: "#18181b" },
  Pink: { name: "Pink", color: "#ec4899" },
  Grey: { name: "Grey", color: "#6b7280" },
  Violet: { name: "Violet", color: "#7c3aed" },
  Green: { name: "Green", color: "#16a34a" },
};

const ColorDot: React.FC<{ name: string }> = ({ name }) => {
  const item = colorMap[name] || { name, color: "#cbd5e1" };
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-[#0d382c]/85">
      <span
        className={`w-3.5 h-3.5 rounded-full border border-black/20 shadow-xs inline-block ${
          item.isTransparent ? "swatch-transparent" : ""
          }`}
        style={{ backgroundColor: item.isTransparent ? undefined : item.color }}
      />
      <span>{item.name}</span>
    </span>
  );
};

export const PricingSection: React.FC = () => {
  const tieredPricing = [
    {
      order: "1 box",
      colors: ["Milky White"],
      price: "₹7,600",
    },
    {
      order: "2 boxes",
      colors: ["Milky White"],
      price: "₹6,200",
    },
    {
      order: "3 boxes",
      colors: ["Milky White", "Brown", "Transparent"],
      price: "₹5,800",
    },
    {
      order: "5 boxes",
      colors: [
        "Milky White",
        "Brown",
        "Transparent",
        "Orange",
        "Red",
        "Yellow",
        "Black",
      ],
      price: "₹5,300",
    },
  ];

  const customJobCards = [
    {
      title: "Multi-colour printed",
      badge: "FROM 10 BOXES",
      description:
        "Two, three or more print colours. Quoted to your artwork and specifications.",
      colors: [
        "Milky White",
        "Brown",
        "Transparent",
        "Orange",
        "Red",
        "Yellow",
        "Black",
        "Pink",
        "Grey",
        "Violet",
        "Green",
      ],
    },
    {
      title: "Printed, special colours",
      badge: "FROM 10 BOXES",
      description:
        "Single-colour printing on a special base colour.",
      colors: ["Pink", "Grey", "Violet", "Green"],
    },
    {
      title: "Plain, standard colours",
      badge: "FROM 5 BOXES",
      description: "Unprinted tape with no dye charge.",
      colors: [
        "Milky White",
        "Brown",
        "Transparent",
        "Orange",
        "Red",
        "Yellow",
        "Black",
      ],
    },
    {
      title: "Plain, special colours",
      badge: "FROM 10 BOXES",
      description: "Unprinted special-colour tape with no dye charge.",
      colors: ["Pink", "Grey", "Violet", "Green"],
    },
  ];

  return (
    <section id="prices" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-[#0d382c]/10">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
        <div>
          <span className="text-xs font-mono font-bold tracking-widest text-[#0d4d3d] uppercase mb-2 block">
            03 — PRICING
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#0d382c] tracking-tight font-display">
            Fixed, honest prices
          </h2>
        </div>
        <p className="text-base sm:text-lg text-[#0d382c]/75 max-w-md">
          Single-colour printed tape prices per box, including GST. Dye charges apply only where specified.
        </p>
      </div>

      {/* Main Pricing Table Container */}
      <div className="rounded-2xl border border-[#0d382c]/20 bg-white overflow-hidden shadow-sm mb-6">
        {/* Table Header */}
        <div className="bg-[#082820] text-[#f5f0e6] px-6 py-4 grid grid-cols-12 text-xs font-mono font-bold tracking-widest uppercase">
          <div className="col-span-3 sm:col-span-2">ORDER</div>
          <div className="col-span-6 sm:col-span-8">AVAILABLE BASE COLOURS</div>
          <div className="col-span-3 sm:col-span-2 text-right">PER BOX</div>
        </div>

        {/* Rows */}
        <div className="divide-y divide-[#0d382c]/10">
          {tieredPricing.map((row) => (
            <div
              key={row.order}
              className="px-6 py-5 grid grid-cols-12 items-center hover:bg-[#faf6f0] transition-colors"
            >
              <div className="col-span-3 sm:col-span-2 font-bold text-base text-[#0d382c]">
                {row.order}
              </div>
              <div className="col-span-6 sm:col-span-8 flex flex-wrap gap-x-4 gap-y-2">
                {row.colors.map((c) => (
                  <ColorDot key={c} name={c} />
                ))}
              </div>
              <div className="col-span-3 sm:col-span-2 text-right">
                <span className="font-mono font-black text-lg sm:text-xl text-[#0d382c]">
                  {row.price}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footnote on Dye Charges */}
      <div className="text-xs sm:text-sm font-mono text-[#0d382c]/75 mb-14 px-2">
        Dye charge where applicable: chemical dye ₹4,000 · electric dye ₹5,000.
      </div>

      {/* Priced for your job - Subheading */}
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-[#0d382c] font-display">
          Priced for your job
        </h3>
      </div>

      {/* 4 Cards Grid for Custom Orders */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {customJobCards.map((card) => (
          <div
            key={card.title}
            className="rounded-2xl border border-[#0d382c]/15 bg-[#faf6f0] p-7 flex flex-col justify-between hover:border-[#0d4d3d] hover:shadow-lg transition-all duration-200"
          >
            <div>
              <div className="flex items-start justify-between gap-4 mb-2">
                <h4 className="text-xl font-bold text-[#0d382c]">
                  {card.title}
                </h4>
                <span className="bg-[#fef3c7] text-[#92400e] text-[10px] font-mono font-bold px-2.5 py-1 rounded-md tracking-wider shrink-0">
                  {card.badge}
                </span>
              </div>

              <p className="text-sm text-[#0d382c]/80 mb-5 leading-relaxed">
                {card.description}
              </p>

              {/* Color swatches */}
              <div className="flex flex-wrap gap-x-3.5 gap-y-2">
                {card.colors.map((c) => (
                  <ColorDot key={c} name={c} />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
