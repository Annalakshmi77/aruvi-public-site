import React, { useState } from "react";
import { Button } from "@/components/ui/button";

type FilterType = "All" | "Coloured" | "Transparent" | "Milky white" | "Two-colour";

interface GalleryItem {
  id: string;
  title: string;
  category: "Coloured" | "Transparent" | "Milky white" | "Two-colour";
  label: string;
  image: string;
  subtitle: string;
}

const galleryData: GalleryItem[] = [
  {
    id: "1",
    title: "Brown printed tape",
    category: "Coloured",
    label: "BROWN PRINTED TAPE",
    image: "/tapes/tape-brown-zenith.png",
    subtitle: "TMC Thiruchendur Murugan & Hemalatha Traders",
  },
  {
    id: "2",
    title: "Transparent print",
    category: "Transparent",
    label: "TRANSPARENT",
    image: "/tapes/tape-transparent-puttur.jpg",
    subtitle: "Puttur Krishna Sweets & Pettikadai Native Foods",
  },
  {
    id: "3",
    title: "Yellow printed tape",
    category: "Coloured",
    label: "YELLOW PRINTED TAPE",
    image: "/tapes/tape-white-poovilaas.png",
    subtitle: "Poovilaas high-density QR code e-commerce tape",
  },
  {
    id: "4",
    title: "Two-colour print",
    category: "Two-colour",
    label: "TWO-COLOUR",
    image: "/tapes/tape-twocolor-aran.jpg",
    subtitle: "DSR Sarees & ARAN Crackers multi-colour registration",
  },
  {
    id: "5",
    title: "Milky white printed tape",
    category: "Milky white",
    label: "MILKY WHITE",
    image: "/tapes/tape-transparent-poovilaas.jpg",
    subtitle: "Poovilaas natural corrugated box sealing",
  },
  {
    id: "6",
    title: "Milky white printed tape",
    category: "Milky white",
    label: "MILKY WHITE",
    image: "/tapes/tape-white-ashoka.png",
    subtitle: "Ashoka Textiles & Sanram Enterprises",
  },
  {
    id: "7",
    title: "Milky white Printed tape",
    category: "Milky white",
    label: "MILKY WHITE",
    image: "/tapes/tape-white-phoenix.jpg",
    subtitle: "TN 95 Phoenix Crackers & Hotel Milano",
  },
  {
    id: "8",
    title: "Orange safety printed tape",
    category: "Coloured",
    label: "COLOURED",
    image: "/tapes/tape-orange-hifi.png",
    subtitle: "HiFi Pyro Park, Rishi Ceramics & Sri Vinayaga",
  },
  {
    id: "9",
    title: "Blue color Printed Tape",
    category: "Coloured",
    label: "COLOURED",
    image: "/tapes/tape-blue-alaya.jpg",
    subtitle: "Alaya Bakery & Positeasy Billing Software",
  },
  {
    id: "10",
    title: "Red color Printed tape",
    category: "Coloured",
    label: "COLOURED",
    image: "/tapes/tape-red-rhino.jpg",
    subtitle: "Rhino & SPS Group of Companies heavy duty tape",
  },
  {
    id: "11",
    title: "Violet color Printed tape",
    category: "Coloured",
    label: "COLOURED",
    image: "/tapes/tape-violet-berlux.png",
    subtitle: "Berlux Paints & Nexgen Fireworks custom branded rolls",
  },
];

export const GallerySection: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<FilterType>("All");

  const filteredData =
    activeFilter === "All"
      ? galleryData
      : galleryData.filter((item) => item.category === activeFilter);

  return (
    <section id="gallery" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-[#0d382c]/10">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <span className="text-xs font-mono font-bold tracking-widest text-[#0d4d3d] uppercase mb-2 block">
            02 — GALLERY
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#0d382c] tracking-tight font-display">
            Real work, real rolls
          </h2>
        </div>
        <p className="text-base sm:text-lg text-[#0d382c]/75 max-w-md">
          A selection of jobs printed for businesses across Tamil Nadu.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 mb-10">
        {(["All", "Coloured", "Transparent", "Milky white", "Two-colour"] as FilterType[]).map((filter) => (
          <Button
            key={filter}
            variant={activeFilter === filter ? "filterActive" : "filter"}
            onClick={() => setActiveFilter(filter)}
            className="cursor-pointer transition-all"
          >
            {filter}
          </Button>
        ))}
      </div>

      {/* Gallery Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredData.map((item) => (
          <div
            key={item.id}
            className="group rounded-2xl bg-white border border-[#0d382c]/15 overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col"
          >
            {/* Visual Photo Box */}
            <div className="relative aspect-square w-full bg-[#f8f5ee] flex items-center justify-center overflow-hidden border-b border-[#0d382c]/10">
              <img
                src={item.image}
                alt={item.title}
                loading="lazy"
                className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
              />
            </div>

            {/* Content Details */}
            <div className="p-5 flex-1 flex flex-col justify-between bg-[#faf6f0]">
              <div>
                <h3 className="font-bold text-lg text-[#0d382c] group-hover:text-[#0d4d3d] transition-colors">
                  {item.title}
                </h3>
                <p className="text-xs text-[#0d382c]/70 mt-1 line-clamp-2">
                  {item.subtitle}
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-[#0d382c]/10 flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold tracking-widest text-[#0d4d3d] uppercase">
                  {item.label}
                </span>
                <span className="text-xs font-mono text-[#e58a00] font-semibold">
                  15-day turnaround
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
