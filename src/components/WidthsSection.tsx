import React from "react";

interface WidthItem {
  inch: string;
  mm: string;
  rollsPerBox: number;
  percentage: number;
}

const widthsData: WidthItem[] = [
  { inch: '1"', mm: "24 mm", rollsPerBox: 144, percentage: 16.6 },
  { inch: '1.5"', mm: "36 mm", rollsPerBox: 96, percentage: 25.0 },
  { inch: '2"', mm: "48 mm", rollsPerBox: 78, percentage: 33.3 },
  { inch: '2.5"', mm: "60 mm", rollsPerBox: 56, percentage: 41.6 },
  { inch: '3"', mm: "72 mm", rollsPerBox: 48, percentage: 50.0 },
  { inch: '3.5"', mm: "84 mm", rollsPerBox: 42, percentage: 58.3 },
  { inch: '6"', mm: "144 mm", rollsPerBox: 21, percentage: 100.0 },
];

export const WidthsSection: React.FC = () => {
  return (
    <section id="widths" className="bg-[#082820] text-[#f5f0e6] py-24 border-t border-[#0d382c]/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mb-14">
          <span className="text-xs font-mono font-bold tracking-widest text-[#e58a00] uppercase mb-2 block">
            04 — WIDTHS
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#f5f0e6] tracking-tight font-display mb-4">
            The right width for every box
          </h2>
          <p className="text-base sm:text-lg text-[#f5f0e6]/75">
            Each box contains a fixed number of rolls. Rolls are 100 metres by default under 10 boxes; custom lengths are available from 10 boxes.
          </p>
        </div>

        {/* Widths Chart Bars */}
        <div className="space-y-4 max-w-5xl">
          {widthsData.map((item) => (
            <div
              key={item.inch}
              className="flex items-center gap-4 sm:gap-6 py-2.5 px-3 rounded-lg hover:bg-white/5 transition-colors group"
            >
              {/* Inch Label */}
              <div className="w-12 sm:w-16 font-mono font-bold text-sm sm:text-base text-[#f5f0e6] group-hover:text-[#e58a00] shrink-0">
                {item.inch}
              </div>

              {/* Graphical Bar */}
              <div className="flex-1 bg-white/10 h-4 sm:h-5 rounded-full overflow-hidden p-0.5 relative">
                <div
                  className="bg-[#e58a00] h-full rounded-full transition-all duration-500 group-hover:bg-[#fbbf24]"
                  style={{ width: `${item.percentage}%` }}
                />
              </div>

              {/* Millimeter and Rolls Count */}
              <div className="w-28 sm:w-36 font-mono text-xs sm:text-sm text-right text-[#f5f0e6]/80 group-hover:text-white shrink-0">
                <span className="text-[#f5f0e6]/60">{item.mm}</span>
                <span className="mx-1.5 text-[#e58a00]">·</span>
                <span className="font-bold text-[#f5f0e6]">{item.rollsPerBox}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Footnote */}
        <div className="mt-10 pt-6 border-t border-white/10 text-xs sm:text-sm font-mono text-[#f5f0e6]/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <span>Final number is rolls per box. Custom widths can be requested.</span>
        </div>
      </div>
    </section>
  );
};
