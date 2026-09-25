import React from "react";

const marqueeItems = [
  "PLAIN BOPP",
  "1 TO 6 INCH WIDTHS",
  "100 METRE ROLLS",
  "15 DAY TURNAROUND",
  "CUSTOM PRINTED TAPE",
  "SIVAKASI ADHESIVE SOLUTIONS",
  "STARTING FROM 1 BOX",
  "MULTI-COLOUR PRINTING",
  "CHEMICAL & ELECTRIC DYE",
  "DOORSTEP TAMIL NADU DELIVERY",
];

export const TapeMarquee: React.FC = () => {
  return (
    <div className="w-full bg-[#082820] py-3.5 overflow-hidden border-y border-[#0d382c]/40 text-[#f5f0e6] select-none">
      <div className="tape-marquee flex items-center text-xs md:text-sm font-mono tracking-widest uppercase">
        {/* Repeat sequence 4 times for smooth continuous looping */}
        {[...marqueeItems, ...marqueeItems, ...marqueeItems, ...marqueeItems].map((item, idx) => (
          <div key={idx} className="flex items-center shrink-0">
            <span className="text-[#e58a00] mx-4 font-bold">/</span>
            <span className="hover:text-[#e58a00] transition-colors">{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
