import React from "react";

export const TapeHeroImage: React.FC = () => {
  return (
    <div className="relative w-full max-w-lg mx-auto">
      {/* Hero Image Frame */}
      <div className="relative overflow-hidden rounded-2xl bg-white shadow-xl border border-[#0d382c]/10 group">
        <img
          src="/tapes/tape-hero.png"
          alt="Brown custom printed packing tape by Peacock Tapes Sivakasi"
          className="w-full aspect-square object-cover object-center transition-transform duration-500 group-hover:scale-105"
        />

        {/* In Production Badge Overlay */}
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6 bg-[#082820]/95 backdrop-blur-md text-[#f5f0e6] px-4 py-2.5 rounded-xl border border-[#0d4d3d] shadow-lg">
          <div className="text-[10px] font-mono font-bold tracking-widest text-[#e58a00] uppercase flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            IN PRODUCTION
          </div>
          <div className="text-xs font-semibold tracking-tight text-white/95 mt-0.5">
            Printed · Plain · Multi-colour
          </div>
        </div>
      </div>
    </div>
  );
};
