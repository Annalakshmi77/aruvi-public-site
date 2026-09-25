import React from "react";

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#051c16] text-[#f5f0e6]/70 py-12 border-t border-white/10 text-xs font-mono">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-[#0d4d3d] text-[#f5f0e6] flex items-center justify-center font-bold text-sm">
            PT
          </div>
          <div>
            <div className="font-bold text-[#f5f0e6] font-display text-sm tracking-wider">
              PEACOCK TAPES · ARUVI INDUSTRIES
            </div>
            <div className="text-[10px] text-[#f5f0e6]/50">
              Sivakasi, Tamil Nadu, India — BOPP Adhesive Packing Solutions
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6 text-[#f5f0e6]/70">
          <a href="#types" className="hover:text-white transition-colors">Tape Types</a>
          <a href="#gallery" className="hover:text-white transition-colors">Gallery</a>
          <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          <a href="#widths" className="hover:text-white transition-colors">Widths</a>
          <a href="#contact" className="hover:text-white transition-colors">Contact</a>
        </div>

        <div className="text-[11px] text-[#f5f0e6]/50 text-center sm:text-right">
          © {new Date().getFullYear()} Peacock Tapes. All rights reserved.
        </div>
      </div>
    </footer>
  );
};
