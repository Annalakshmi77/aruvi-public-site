import React, { useState } from "react";
import { Compass, Menu, X } from "lucide-react";
import { startAgentGuide } from "@/lib/agentDemo";

// Orange compass badge with a soft pulse, used on the "Take a tour" buttons.
const TourDot: React.FC = () => (
  <span className="play-dot relative grid h-6 w-6 place-items-center rounded-full bg-gradient-to-br from-[#f3b14a] to-[#e58a00] text-white transition-transform group-hover:scale-110">
    <Compass className="h-3.5 w-3.5" />
  </span>
);

export const Header: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: "Tape types", href: "#types" },
    { name: "Products", href: "#gallery" },
    { name: "Widths", href: "#widths" },
    { name: "Contact", href: "#contact" },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-[#0d382c]/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        {/* Logo and Brand Title */}
        <a href="#" className="flex items-center gap-3.5 group">
          <div className="w-11 h-11 rounded-xl overflow-hidden flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform bg-[#0d4d3d] border border-[#0d4d3d]/30">
            <img
              src="/apple-touch-icon.png"
              alt="Peacock Tapes Logo"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-base sm:text-lg tracking-wider text-[#0d382c] font-display">
              PEACOCK TAPES
            </span>
            <span className="text-[11px] font-mono tracking-widest text-[#0d382c]/65 -mt-0.5">
              SIVAKASI · BOPP
            </span>
          </div>
        </a>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#0d382c]">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="hover:text-[#e58a00] transition-colors py-1 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-[#e58a00] hover:after:w-full after:transition-all font-medium"
            >
              {link.name}
            </a>
          ))}
        </nav>

        {/* Desktop: Take a tour */}
        <div className="hidden md:flex items-center rounded-full bg-[#0d382c]/[0.06] p-1 ring-1 ring-inset ring-[#0d382c]/[0.06]">
          <button
            type="button"
            onClick={startAgentGuide}
            aria-label="Take a tour"
            className="group inline-flex items-center gap-2 rounded-full bg-white py-1.5 pl-1.5 pr-3.5 text-sm font-semibold text-[#0d382c] shadow-[0_1px_2px_rgba(13,56,44,0.08),0_4px_12px_-4px_rgba(13,56,44,0.18)] hover:shadow-[0_1px_2px_rgba(13,56,44,0.1),0_6px_16px_-4px_rgba(13,56,44,0.25)] transition-shadow cursor-pointer"
          >
            <TourDot />
            <span>Take a tour</span>
          </button>
        </div>

        {/* Mobile Actions */}
        <div className="md:hidden flex items-center gap-1">
          <button
            type="button"
            onClick={startAgentGuide}
            aria-label="Take a tour"
            className="group rounded-full bg-[#0d382c]/[0.06] p-1 ring-1 ring-inset ring-[#0d382c]/[0.06] cursor-pointer"
          >
            <span className="flex rounded-full bg-white p-1 shadow-[0_1px_2px_rgba(13,56,44,0.08),0_4px_12px_-4px_rgba(13,56,44,0.18)]">
              <TourDot />
            </span>
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-[#0d382c] hover:bg-[#0d382c]/10 transition-colors"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#faf6f0] border-b border-[#0d382c]/15 px-6 py-4 space-y-3 animate-in slide-in-from-top duration-200">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-base font-medium text-[#0d382c] hover:text-[#e58a00] border-b border-[#0d382c]/5"
            >
              {link.name}
            </a>
          ))}
          <div className="rounded-full bg-[#0d382c]/[0.06] p-1 ring-1 ring-inset ring-[#0d382c]/[0.06]">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                startAgentGuide();
              }}
              className="group flex w-full items-center justify-center gap-2 rounded-full bg-white py-1.5 pl-1.5 pr-4 text-sm font-semibold text-[#0d382c] shadow-[0_1px_2px_rgba(13,56,44,0.08),0_4px_12px_-4px_rgba(13,56,44,0.18)] cursor-pointer"
            >
              <TourDot />
              <span>Take a tour</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
