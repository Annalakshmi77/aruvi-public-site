import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { catalogService, PublicProduct, PublicCategory, PublicVariant } from "@/services/catalog.service";
import {
  Loader2,
  X,
  Search,
  CheckCircle2,
  Package,
  Check,
  Box,
  ArrowRight,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Truck,
  Eye,
  FileSpreadsheet,
  Layers,
  Sparkles
} from "lucide-react";

interface GalleryItem {
  id: string;
  title: string;
  category: string;
  label: string;
  image: string | null;
  subtitle: string;
  price?: number | null;
  sku?: string;
  stock?: number | null;
  stockStatus?: string;
  variantCount?: number;
  variants: PublicVariant[];
}

// Map color names to exact realistic hex styling
const colorSwatchMap: Record<string, { bg: string; border: string; textDark?: boolean }> = {
  "milky white": { bg: "#fcfbf8", border: "rgba(0,0,0,0.18)", textDark: true },
  "white": { bg: "#ffffff", border: "rgba(0,0,0,0.2)", textDark: true },
  "brown": { bg: "#78350f", border: "#5a270a" },
  "transparent": { bg: "rgba(235, 230, 220, 0.85)", border: "rgba(0,0,0,0.2)", textDark: true },
  "orange": { bg: "#ea580c", border: "#c2410c" },
  "red": { bg: "#dc2626", border: "#b91c1c" },
  "yellow": { bg: "#eab308", border: "#ca8a04", textDark: true },
  "black": { bg: "#18181b", border: "#09090b" },
  "pink": { bg: "#ec4899", border: "#db2777" },
  "grey": { bg: "#6b7280", border: "#4b5563" },
  "violet": { bg: "#7c3aed", border: "#6d28d9" },
  "green": { bg: "#16a34a", border: "#15803d" },
};

// Helper: Parse rolls per box from size string or variant value
// e.g. "2 inch (48 mm)-78pieces" -> 78
const parseRollsPerBox = (text?: string): number => {
  if (!text) return 72;
  const match = text.match(/([0-9]+)\s*(?:pieces|pcs|rolls|pk)/i);
  if (match) return parseInt(match[1], 10);

  // Standard B2B tape packaging defaults by width if not specified
  if (text.includes('1"') || text.includes('1 inch') || text.includes('24 mm') || text.includes('24mm')) return 144;
  if (text.includes('1.5"') || text.includes('1.5 inch') || text.includes('36 mm')) return 96;
  if (text.includes('2"') || text.includes('2 inch') || text.includes('48 mm') || text.includes('48mm')) return 78;
  if (text.includes('2.5"') || text.includes('2.5 inch') || text.includes('60 mm')) return 60;
  if (text.includes('3"') || text.includes('3 inch') || text.includes('72 mm') || text.includes('72mm')) return 48;
  if (text.includes('6"') || text.includes('6 inch') || text.includes('144 mm')) return 24;
  return 72;
};

// Helper to format short display size: e.g. "2 inch (48 mm)-78pieces" -> "2\" (48mm)"
const formatShortSize = (sizeStr: string): string => {
  if (!sizeStr) return "Standard";
  const match = sizeStr.match(/([0-9.]+\s*(?:inch|mm|"))(?:\s*\(([0-9]+\s*mm)\))?/i);
  if (match) {
    const rawWidth = match[1].replace(/inch/i, '"').trim();
    const mmPart = match[2] ? match[2].replace(/\s+/g, "") : null;
    return mmPart ? `${rawWidth} (${mmPart})` : rawWidth;
  }
  return sizeStr.split("-")[0].trim();
};

/**
 * E-Commerce Product Card with Clear Visual Showcase & Live DB Stock
 */
const ProductCard: React.FC<{
  item: GalleryItem;
  onOpenExplore: (item: GalleryItem) => void;
}> = ({ item, onOpenExplore }) => {
  // 1st / Default Variant
  const defaultVariant = item.variants[0];

  const defaultSize = defaultVariant?.attributes?.find((a) =>
    a.name.toLowerCase().includes("size") || a.name.toLowerCase().includes("width")
  )?.value;

  const defaultColor = defaultVariant?.attributes?.find((a) =>
    a.name.toLowerCase().includes("color")
  )?.value;

  const defaultSku = defaultVariant?.sku || item.sku;
  const defaultRolls = parseRollsPerBox(defaultSize || defaultVariant?.value);
  const defaultSwatch = defaultColor
    ? colorSwatchMap[defaultColor.toLowerCase()] || { bg: "#0d4d3d", border: "#0d382c" }
    : { bg: "#0d4d3d", border: "#0d382c" };

  // Live Database Stock Status
  const dbStatus = defaultVariant?.status || item.stockStatus || "Active";
  const dbStock = defaultVariant?.stock ?? item.stock;

  // Extract distinct sizes & colors for summary
  const { distinctSizesList, distinctColorsList } = useMemo(() => {
    const sizes = new Set<string>();
    const colors = new Set<string>();
    item.variants.forEach((v) => {
      const sizeAttr = v.attributes?.find((a) =>
        a.name.toLowerCase().includes("size") || a.name.toLowerCase().includes("width")
      )?.value;
      const colorAttr = v.attributes?.find((a) =>
        a.name.toLowerCase().includes("color")
      )?.value;
      if (sizeAttr) sizes.add(sizeAttr);
      if (colorAttr) colors.add(colorAttr);
    });
    return {
      distinctSizesList: Array.from(sizes),
      distinctColorsList: Array.from(colors),
    };
  }, [item.variants]);

  return (
    <div
      onClick={() => onOpenExplore(item)}
      className="group rounded-3xl bg-white border border-[#0d382c]/15 hover:border-[#0d4d3d]/60 overflow-hidden shadow-xs hover:shadow-2xl transition-all duration-300 flex flex-col justify-between cursor-pointer"
    >
      {/* ========================================================= */}
      {/* 1. VISUAL PRODUCT HERO CONTAINER (E-COMMERCE SHOWCASE)    */}
      {/* ========================================================= */}
      <div className="relative aspect-[16/11] w-full bg-gradient-to-b from-[#fbf8f2] via-[#f7f1e6] to-[#efe6d4] flex items-center justify-center overflow-hidden border-b border-[#0d382c]/10 p-6">
        {item.image ? (
          <img
            src={item.image}
            alt={item.title}
            loading="lazy"
            className="w-full h-full object-contain object-center transition-transform duration-500 group-hover:scale-108"
          />
        ) : (
          /* Realistic E-Commerce Tape Roll Studio Visual Representation */
          <div className="relative flex flex-col items-center justify-center transition-transform duration-500 group-hover:scale-105">
            {/* Subtle Studio Ground Shadow */}
            <div className="absolute -bottom-4 w-36 h-5 rounded-full bg-[#0d382c]/15 blur-sm" />

            {/* Dynamic Simulated Tape Roll */}
            <div
              className="relative w-36 h-36 rounded-full border-[7px] transition-all duration-300 shadow-xl flex items-center justify-center"
              style={{
                backgroundColor: defaultSwatch.bg,
                borderColor: defaultSwatch.border || "#0d382c",
              }}
            >
              {/* Inner Corrugated 76mm Core */}
              <div className="w-18 h-18 rounded-full bg-[#faedd0] border-4 border-[#c99c5c] flex flex-col items-center justify-center shadow-inner text-center">
                <span className="text-[8px] font-mono font-extrabold text-[#6b4c1b] tracking-wider uppercase">
                  PEACOCK
                </span>
                <span className="text-[6.5px] font-mono font-medium text-[#7d5c27]">
                  76mm CORE
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Top Badges */}
        <div className="absolute top-3.5 left-3.5 flex items-center gap-1.5">
          <span className="px-2.5 py-1 rounded-lg bg-white/95 backdrop-blur-xs font-mono text-[10px] font-bold text-[#0d4d3d] uppercase tracking-wider shadow-xs border border-[#0d382c]/10">
            {item.label}
          </span>
        </div>

        <div className="absolute top-3.5 right-3.5">
          <span className="px-2.5 py-1 rounded-lg bg-[#0d382c] text-white font-mono text-[10px] font-bold shadow-xs">
            {defaultSku}
          </span>
        </div>

        {/* Bottom Spec Tag on Image with Live DB Stock Status */}
        <div className="absolute bottom-3 left-3.5 right-3.5 flex items-center justify-between pointer-events-none">
          <span className="px-2 py-0.5 rounded-md bg-white/90 backdrop-blur-xs font-mono text-[10px] font-bold text-[#0d382c] shadow-2xs border border-[#0d382c]/10">
            Default: {formatShortSize(defaultSize || "1\"")}
          </span>
          <span className="px-2.5 py-0.5 rounded-md bg-emerald-600/95 text-white font-mono text-[10px] font-bold shadow-2xs flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            {dbStock !== null && dbStock !== undefined ? `Stock: ${dbStock} (${dbStatus})` : dbStatus}
          </span>
        </div>

        {/* Quick View Hover Overlay Button */}
        <div className="absolute inset-0 bg-[#0d382c]/40 opacity-0 group-hover:opacity-100 backdrop-blur-[2px] transition-all duration-300 flex items-center justify-center pointer-events-none">
          <span className="px-4 py-2 rounded-xl bg-white text-[#0d382c] font-mono text-xs font-bold shadow-xl flex items-center gap-2 transform translate-y-2 group-hover:translate-y-0 transition-transform">
            <Eye className="w-4 h-4 text-[#0d4d3d]" />
            <span>Quick View &amp; Specs</span>
          </span>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. PRODUCT DETAILS SECTION                                */}
      {/* ========================================================= */}
      <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between bg-[#faf6f0]">
        <div>
          {/* Title */}
          <h3 className="font-bold text-xl text-[#0d382c] leading-snug group-hover:text-[#0d4d3d] transition-colors font-display">
            {item.title}
          </h3>

          <p className="text-xs sm:text-sm text-[#0d382c]/75 mt-1.5 leading-relaxed line-clamp-2">
            {item.subtitle || "Premium industrial packaging tape manufactured with high tensile BOPP film."}
          </p>

          {/* Color Availability Swatches Preview */}
          {distinctColorsList.length > 0 && (
            <div className="mt-3.5 flex items-center gap-2">
              <span className="text-[11px] font-mono text-[#0d382c]/65">
                Available Colours:
              </span>
              <div className="flex items-center gap-1.5">
                {distinctColorsList.slice(0, 6).map((c) => {
                  const swatch = colorSwatchMap[c.toLowerCase()] || { bg: "#94a3b8", border: "#64748b" };
                  return (
                    <span
                      key={c}
                      title={c}
                      className="w-3.5 h-3.5 rounded-full inline-block shadow-2xs border"
                      style={{ backgroundColor: swatch.bg, borderColor: swatch.border }}
                    />
                  );
                })}
                {distinctColorsList.length > 6 && (
                  <span className="text-[10px] font-mono text-[#0d382c]/60 font-bold">
                    +{distinctColorsList.length - 6}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Technical Spec Matrix Badges */}
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="p-2.5 bg-white rounded-xl border border-[#0d382c]/10 shadow-2xs">
              <span className="text-[10px] text-[#0d382c]/60 block uppercase">Standard Length</span>
              <strong className="text-xs font-bold text-[#0d382c] block mt-0.5">
                100 Metres
              </strong>
            </div>
            <div className="p-2.5 bg-white rounded-xl border border-[#0d382c]/10 shadow-2xs">
              <span className="text-[10px] text-[#0d382c]/60 block uppercase">Packaging</span>
              <strong className="text-xs font-bold text-[#0d4d3d] flex items-center gap-1 mt-0.5">
                <Box className="w-3 h-3" />
                {defaultRolls} Rolls/Box
              </strong>
            </div>
          </div>

          {/* Configurations Overview Pill */}
          <div className="mt-3 p-2.5 bg-white rounded-xl border border-[#0d382c]/10 shadow-2xs flex items-center justify-between text-xs font-mono">
            <span className="text-[#0d4d3d] font-bold flex items-center gap-1.5 text-[11px]">
              <Layers className="w-3.5 h-3.5" />
              {item.variants.length} Configured Variants
            </span>
            <span className="text-[#0d382c]/75 text-[11px]">
              {distinctSizesList.length} Widths • {distinctColorsList.length} Colours
            </span>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-5 pt-3.5 border-t border-[#0d382c]/10">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenExplore(item);
            }}
            className="w-full py-3 px-4 rounded-xl bg-[#0d382c] hover:bg-[#0d4d3d] text-white font-mono font-bold text-xs transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            <span>Explore All {item.variants.length} Variants &amp; Dimensions</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Full E-Commerce Product Detail Modal (PDP: Browse All Variants, Dimensions, Colours & Matrix)
 */
const ProductDetailModal: React.FC<{
  product: GalleryItem;
  onClose: () => void;
}> = ({ product, onClose }) => {
  const [activeTab, setActiveTab] = useState<"configurator" | "table">("configurator");
  const [tableSearch, setTableSearch] = useState<string>("");
  const [boxQuantity, setBoxQuantity] = useState<number>(1);

  // Extract distinct sizes & colors
  const distinctSizes = useMemo(() => {
    const list: string[] = [];
    product.variants.forEach((v) => {
      const sizeAttr = v.attributes?.find((a) =>
        a.name.toLowerCase().includes("size") || a.name.toLowerCase().includes("width")
      )?.value;
      if (sizeAttr && !list.includes(sizeAttr)) {
        list.push(sizeAttr);
      }
    });
    return list;
  }, [product.variants]);

  const distinctColors = useMemo(() => {
    const list: string[] = [];
    product.variants.forEach((v) => {
      const colorAttr = v.attributes?.find((a) =>
        a.name.toLowerCase().includes("color")
      )?.value;
      if (colorAttr && !list.includes(colorAttr)) {
        list.push(colorAttr);
      }
    });
    return list;
  }, [product.variants]);

  const [selectedSize, setSelectedSize] = useState<string>(distinctSizes[0] || "");
  const [selectedColor, setSelectedColor] = useState<string>(distinctColors[0] || "");

  // Active matched variant based on selected size & color
  const activeVariant = useMemo(() => {
    return product.variants.find((v) => {
      const sizeAttr = v.attributes?.find((a) =>
        a.name.toLowerCase().includes("size") || a.name.toLowerCase().includes("width")
      )?.value;
      const colorAttr = v.attributes?.find((a) =>
        a.name.toLowerCase().includes("color")
      )?.value;

      const sizeMatch = !selectedSize || sizeAttr === selectedSize;
      const colorMatch = !selectedColor || colorAttr === selectedColor;
      return sizeMatch && colorMatch;
    }) || product.variants[0];
  }, [product.variants, selectedSize, selectedColor]);

  const rollsPerBox = parseRollsPerBox(selectedSize || activeVariant?.value);
  const totalRolls = rollsPerBox * boxQuantity;
  const activeSwatch = colorSwatchMap[selectedColor.toLowerCase()] || { bg: "#0d4d3d", border: "#0d382c" };

  // Filtered variants for table tab
  const filteredTableVariants = useMemo(() => {
    if (!tableSearch.trim()) return product.variants;
    const term = tableSearch.toLowerCase();
    return product.variants.filter((v) => {
      return (
        v.value?.toLowerCase().includes(term) ||
        v.sku?.toLowerCase().includes(term) ||
        v.attributes?.some((a) => a.value.toLowerCase().includes(term) || a.name.toLowerCase().includes(term))
      );
    });
  }, [product.variants, tableSearch]);

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-[#0d382c]/20 max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">

        {/* Modal Top Bar */}
        <div className="p-5 sm:px-8 bg-[#faf6f0] border-b border-[#0d382c]/15 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-[10px] font-mono font-bold tracking-widest text-[#0d4d3d] uppercase px-2.5 py-1 rounded bg-[#0d4d3d]/10 border border-[#0d4d3d]/20">
              {product.category}
            </span>
            <span className="text-xs font-mono font-bold text-[#0d382c] px-2.5 py-1 rounded bg-white border border-[#0d382c]/15 shadow-2xs">
              {activeVariant?.sku || product.sku}
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              {activeVariant?.stock !== null && activeVariant?.stock !== undefined
                ? `In Stock (${activeVariant.stock} units)`
                : (activeVariant?.status || product.stockStatus || "In Stock")}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* View switcher tabs */}
            <div className="bg-white p-1 rounded-xl border border-[#0d382c]/15 flex items-center gap-1">
              <button
                type="button"
                onClick={() => setActiveTab("configurator")}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${activeTab === "configurator"
                    ? "bg-[#0d4d3d] text-white shadow-xs"
                    : "text-[#0d382c]/70 hover:text-[#0d382c]"
                  }`}
              >
                Configurator
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("table")}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1 ${activeTab === "table"
                    ? "bg-[#0d4d3d] text-white shadow-xs"
                    : "text-[#0d382c]/70 hover:text-[#0d382c]"
                  }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                All Variants ({product.variants.length})
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white border border-[#0d382c]/20 flex items-center justify-center text-[#0d382c] hover:bg-[#0d382c] hover:text-white transition-colors cursor-pointer shrink-0 ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Main Content Container */}
        <div className="overflow-y-auto flex-1 p-5 sm:p-8 bg-[#faf6f0]">
          {activeTab === "configurator" ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

              {/* Left Column: Visual Tape Preview & Key Spec Highlights */}
              <div className="lg:col-span-5 space-y-4">
                {/* Dynamic visual tape roll representation */}
                <div className="rounded-2xl bg-white border border-[#0d382c]/15 p-6 shadow-xs flex flex-col items-center justify-center relative overflow-hidden">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-[#0d4d3d] mb-4 font-bold">
                    Interactive Spec Preview
                  </div>

                  {/* Visual Roll Simulation */}
                  <div className="relative w-44 h-44 flex items-center justify-center my-2">
                    {/* Outer Roll Ring */}
                    <div
                      className="w-40 h-40 rounded-full border-8 transition-all duration-300 shadow-lg flex items-center justify-center"
                      style={{
                        backgroundColor: activeSwatch.bg,
                        borderColor: activeSwatch.border || "#0d382c",
                      }}
                    >
                      {/* Inner Core */}
                      <div className="w-20 h-20 rounded-full bg-[#f4ebd0] border-4 border-[#c59a58] flex flex-col items-center justify-center shadow-inner text-center p-1">
                        <span className="text-[9px] font-mono font-bold text-[#63481b] uppercase">PEACOCK</span>
                        <span className="text-[7px] font-mono text-[#63481b]">76mm Core</span>
                      </div>
                    </div>

                    {/* Width Badge Indicator */}
                    <div className="absolute -bottom-2 bg-[#0d382c] text-white text-[10px] font-mono font-bold px-3 py-1 rounded-full shadow-md">
                      {formatShortSize(selectedSize)}
                    </div>
                  </div>

                  <div className="mt-4 text-center">
                    <span className="text-xs font-bold text-[#0d382c] block capitalize">
                      {selectedColor} Tape • {formatShortSize(selectedSize)}
                    </span>
                    <span className="text-[11px] font-mono text-[#0d382c]/60">
                      Standard Length: 100m • BOPP Film
                    </span>
                  </div>
                </div>

                {/* Technical Specification Badges */}
                <div className="grid grid-cols-2 gap-2.5 text-xs font-mono">
                  <div className="p-3 bg-white rounded-xl border border-[#0d382c]/10 shadow-2xs">
                    <span className="text-[10px] text-[#0d382c]/60 block">ROLLS PER BOX</span>
                    <strong className="text-sm font-bold text-[#0d4d3d] flex items-center gap-1 mt-0.5">
                      <Box className="w-3.5 h-3.5" />
                      {rollsPerBox} Rolls
                    </strong>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-[#0d382c]/10 shadow-2xs">
                    <span className="text-[10px] text-[#0d382c]/60 block">MINIMUM ORDER</span>
                    <strong className="text-sm font-bold text-[#0d382c] flex items-center gap-1 mt-0.5">
                      <Package className="w-3.5 h-3.5" />
                      1 Box (MOQ)
                    </strong>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-[#0d382c]/10 shadow-2xs">
                    <span className="text-[10px] text-[#0d382c]/60 block">DISPATCH LEAD TIME</span>
                    <strong className="text-xs font-bold text-[#0d382c] flex items-center gap-1 mt-0.5">
                      <Truck className="w-3.5 h-3.5 text-emerald-600" />
                      24–48 Hours
                    </strong>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-[#0d382c]/10 shadow-2xs">
                    <span className="text-[10px] text-[#0d382c]/60 block">QUALITY GRADE</span>
                    <strong className="text-xs font-bold text-[#0d382c] flex items-center gap-1 mt-0.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                      Industrial Standard
                    </strong>
                  </div>
                </div>
              </div>

              {/* Right Column: Interactive E-Commerce Variant Pickers */}
              <div className="lg:col-span-7 space-y-6">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-[#0d382c] font-display">
                    {product.title}
                  </h2>
                  <p className="text-xs text-[#0d382c]/70 mt-1">
                    {product.subtitle || "Select exact size and colour options to configure your custom bulk order."}
                  </p>
                </div>

                {/* Option 1: Width / Dimension Pills */}
                {distinctSizes.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-[#0d382c] uppercase tracking-wide flex items-center gap-1.5">
                        <span>1. Select Width / Size</span>
                      </label>
                      <span className="text-xs font-mono font-bold text-[#0d4d3d]">
                        {selectedSize}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {distinctSizes.map((size) => {
                        const isSelected = selectedSize === size;
                        const short = formatShortSize(size);
                        const pbox = parseRollsPerBox(size);
                        return (
                          <button
                            key={size}
                            type="button"
                            onClick={() => setSelectedSize(size)}
                            className={`p-2.5 rounded-xl text-left transition-all cursor-pointer border ${isSelected
                                ? "bg-[#0d4d3d] text-white border-[#0d4d3d] shadow-sm scale-[1.02]"
                                : "bg-white text-[#0d382c] border-[#0d382c]/15 hover:border-[#0d4d3d]/50 hover:bg-white"
                              }`}
                          >
                            <div className="font-mono font-bold text-xs">{short}</div>
                            <div className={`text-[10px] font-mono mt-0.5 ${isSelected ? "text-emerald-200" : "text-[#0d382c]/60"}`}>
                              {pbox} rolls / box
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Option 2: Colour Swatches */}
                {distinctColors.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-[#0d382c] uppercase tracking-wide">
                        2. Select Tape Colour
                      </label>
                      <span className="text-xs font-mono font-bold text-[#0d382c] capitalize">
                        {selectedColor}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 p-3.5 bg-white rounded-2xl border border-[#0d382c]/12 shadow-2xs">
                      {distinctColors.map((color) => {
                        const isSelected = selectedColor === color;
                        const swatch = colorSwatchMap[color.toLowerCase()] || {
                          bg: "#94a3b8",
                          border: "rgba(0,0,0,0.2)",
                        };

                        return (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setSelectedColor(color)}
                            className={`group relative flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${isSelected
                                ? "bg-[#faf6f0] border-[#0d4d3d] ring-2 ring-[#0d4d3d]/20 scale-105"
                                : "bg-white border-[#0d382c]/15 hover:border-[#0d4d3d]/40"
                              }`}
                          >
                            <span
                              className="w-4 h-4 rounded-full inline-block shadow-2xs"
                              style={{ backgroundColor: swatch.bg, border: `1px solid ${swatch.border}` }}
                            />
                            <span className="text-xs font-medium text-[#0d382c] capitalize">
                              {color}
                            </span>
                            {isSelected && <Check className="w-3 h-3 text-[#0d4d3d]" strokeWidth={3} />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Option 3: Quantity Calculator (Boxes & Total Rolls) */}
                <div className="p-4 bg-white rounded-2xl border border-[#0d382c]/15 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-[#0d382c] uppercase tracking-wide block">
                        3. Box Quantity Calculator
                      </span>
                      <span className="text-[11px] font-mono text-[#0d382c]/60">
                        1 Box = {rollsPerBox} Rolls of {formatShortSize(selectedSize)}
                      </span>
                    </div>

                    {/* Stepper */}
                    <div className="flex items-center gap-2 bg-[#faf6f0] p-1 rounded-xl border border-[#0d382c]/15">
                      <button
                        type="button"
                        onClick={() => setBoxQuantity(Math.max(1, boxQuantity - 1))}
                        className="w-7 h-7 rounded-lg bg-white border border-[#0d382c]/15 font-bold text-sm text-[#0d382c] hover:bg-[#0d382c] hover:text-white transition-colors cursor-pointer flex items-center justify-center"
                      >
                        -
                      </button>
                      <span className="font-mono font-bold text-sm text-[#0d382c] w-8 text-center">
                        {boxQuantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => setBoxQuantity(boxQuantity + 1)}
                        className="w-7 h-7 rounded-lg bg-white border border-[#0d382c]/15 font-bold text-sm text-[#0d382c] hover:bg-[#0d382c] hover:text-white transition-colors cursor-pointer flex items-center justify-center"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Calculated summary bar */}
                  <div className="p-3 bg-[#faf6f0] rounded-xl flex items-center justify-between text-xs font-mono border border-[#0d382c]/10">
                    <span className="text-[#0d382c]/75">Total Packaging Count:</span>
                    <span className="font-bold text-[#0d4d3d] text-sm">
                      {totalRolls.toLocaleString()} Total Rolls ({boxQuantity} Box{boxQuantity > 1 ? "es" : ""})
                    </span>
                  </div>
                </div>

                {/* Primary Actions */}
                <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                  <a
                    href="#contact"
                    onClick={onClose}
                    className="w-full sm:flex-1 py-3.5 px-6 rounded-xl bg-[#0d382c] hover:bg-[#0d4d3d] text-white font-mono font-bold text-sm text-center transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                  >
                    <span>Request Quote for {activeVariant?.sku || product.sku}</span>
                    <ArrowRight className="w-4 h-4" />
                  </a>
                  <button
                    type="button"
                    onClick={() => setActiveTab("table")}
                    className="w-full sm:w-auto py-3.5 px-5 rounded-xl bg-white hover:bg-[#faf6f0] text-[#0d382c] border border-[#0d382c]/20 font-mono font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-[#0d4d3d]" />
                    <span>View Matrix Table</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Table Tab: Searchable All Variants Matrix */
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-[#0d382c]/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by SKU, dimension (e.g. 2 inch), or colour (e.g. Brown)..."
                    value={tableSearch}
                    onChange={(e) => setTableSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#0d382c]/20 rounded-xl text-sm font-sans text-[#0d382c] placeholder:text-[#0d382c]/40 focus:outline-none focus:border-[#0d4d3d]"
                  />
                </div>
                <div className="text-xs font-mono text-[#0d382c]/70 shrink-0 self-center">
                  Showing {filteredTableVariants.length} of {product.variants.length} Variants
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-[#0d382c]/15 overflow-hidden shadow-xs">
                <div className="overflow-x-auto max-h-[55vh]">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-[#faf6f0] sticky top-0 border-b border-[#0d382c]/15 z-10">
                      <tr className="text-[#0d382c]">
                        <th className="py-3 px-4 font-bold">SKU</th>
                        <th className="py-3 px-4 font-bold">Width / Size</th>
                        <th className="py-3 px-4 font-bold">Colour</th>
                        <th className="py-3 px-4 font-bold">Packaging</th>
                        <th className="py-3 px-4 font-bold text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#0d382c]/10">
                      {filteredTableVariants.map((v) => {
                        const sizeAttr = v.attributes?.find((a) =>
                          a.name.toLowerCase().includes("size") || a.name.toLowerCase().includes("width")
                        )?.value;
                        const colorAttr = v.attributes?.find((a) =>
                          a.name.toLowerCase().includes("color")
                        )?.value;
                        const swatch = colorAttr
                          ? colorSwatchMap[colorAttr.toLowerCase()] || { bg: "#94a3b8", border: "rgba(0,0,0,0.2)" }
                          : { bg: "#94a3b8", border: "rgba(0,0,0,0.2)" };
                        const pbox = parseRollsPerBox(sizeAttr || v.value);

                        return (
                          <tr
                            key={v.sku}
                            onClick={() => {
                              if (sizeAttr) setSelectedSize(sizeAttr);
                              if (colorAttr) setSelectedColor(colorAttr);
                              setActiveTab("configurator");
                            }}
                            className="hover:bg-[#faf6f0] cursor-pointer transition-colors"
                          >
                            <td className="py-3 px-4 font-bold text-[#0d382c]">{v.sku}</td>
                            <td className="py-3 px-4 text-[#0d382c]">
                              {formatShortSize(sizeAttr || v.option)}
                            </td>
                            <td className="py-3 px-4 text-[#0d382c]">
                              <div className="flex items-center gap-2">
                                {colorAttr && (
                                  <span
                                    className="w-3.5 h-3.5 rounded-full inline-block shrink-0 shadow-2xs"
                                    style={{ backgroundColor: swatch.bg, border: `1px solid ${swatch.border}` }}
                                  />
                                )}
                                <span className="capitalize">{colorAttr || "Standard"}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-[#0d4d3d] font-semibold">
                              {pbox} Rolls / Box
                            </td>
                            <td className="py-3 px-4 text-right">
                              <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 text-[10px]">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                {v.stock !== null && v.stock !== undefined
                                  ? `In Stock (${v.stock})`
                                  : (v.status || "Active")}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:px-8 bg-white border-t border-[#0d382c]/15 flex items-center justify-between">
          <span className="text-xs font-mono text-[#0d382c]/60">
            Selected SKU: <strong className="text-[#0d382c]">{activeVariant?.sku || product.sku}</strong>
          </span>
          <Button
            variant="outline"
            onClick={onClose}
            className="cursor-pointer font-mono text-xs"
          >
            Close Window
          </Button>
        </div>
      </div>
    </div>
  );
};

/**
 * Main Gallery Section for Peacock Tapes
 */
export const GallerySection: React.FC = () => {
  const [categories, setCategories] = useState<string[]>(["All"]);
  const [activeFilter, setActiveFilter] = useState<string>("All");
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLive, setIsLive] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Quick View / PDP Modal State
  const [selectedExploreProduct, setSelectedExploreProduct] = useState<GalleryItem | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadCatalog() {
      try {
        setIsLoading(true);
        setError(null);
        const [catsRes, prodsRes] = await Promise.all([
          catalogService.getCategories().catch(() => [] as PublicCategory[]),
          catalogService.getProducts({ limit: 50 }),
        ]);

        if (!isMounted) return;

        // Categories list
        if (catsRes && catsRes.length > 0) {
          const uniqueCats = ["All", ...catsRes.map((c) => c.name)];
          setCategories(uniqueCats);
        }

        // Products list strictly from DB
        if (prodsRes && prodsRes.products && prodsRes.products.length > 0) {
          const mapped: GalleryItem[] = prodsRes.products.map((p: PublicProduct, idx: number) => {
            const variantCount = p.variants?.length || 0;
            const responseImage =
              (p.image && p.image.trim() !== "" ? p.image : null) ||
              (p.gallery?.[0]?.src && p.gallery[0].src.trim() !== "" ? p.gallery[0].src : null) ||
              (p.variants?.find((v) => v.image && v.image.trim() !== "")?.image || null);

            const subtitle =
              p.description ||
              (variantCount > 0
                ? `${variantCount} variant${variantCount > 1 ? "s" : ""} configured in database`
                : "");

            return {
              id: p.id || String(idx + 1),
              title: p.name,
              category: p.category || "Plain Tape",
              label: (p.category || "CATALOG").toUpperCase(),
              image: responseImage,
              subtitle,
              price: p.price,
              sku: p.sku,
              stock: p.stock,
              stockStatus: p.stockStatus,
              variantCount,
              variants: p.variants || [],
            };
          });

          setItems(mapped);
          setIsLive(true);
        } else {
          setItems([]);
        }

      } catch (err: any) {
        console.error("Failed to load live database products:", err);
        if (isMounted) {
          setError(err?.message || "Failed to load products from database.");
          setItems([]);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadCatalog();
    return () => {
      isMounted = false;
    };
  }, []);

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 6;

  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter);
    setCurrentPage(1);
  };

  const filteredData =
    activeFilter === "All"
      ? items
      : items.filter((item) => item.category.toLowerCase() === activeFilter.toLowerCase());

  const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  // Sliding window: shows 2 pages at a time (e.g. 1 2 -> 2 3 -> 3 4)
  const visiblePages = useMemo(() => {
    const maxVisible = 2;
    if (totalPages <= maxVisible) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    let start = Math.max(1, currentPage - 1);
    let end = start + maxVisible - 1;
    if (end > totalPages) {
      end = totalPages;
      start = Math.max(1, end - maxVisible + 1);
    }
    const pages: number[] = [];
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }, [currentPage, totalPages]);

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    const galleryEl = document.getElementById("gallery");
    if (galleryEl) {
      galleryEl.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <section id="gallery" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-[#0d382c]/10">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-mono font-bold tracking-widest text-[#0d4d3d] uppercase block">
              02 — PRODUCTS &amp; SPECIFICATIONS
            </span>
            {isLive && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#16a34a]/15 text-[#16a34a] border border-[#16a34a]/30">
                <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a] animate-pulse" />
                LIVE DATABASE ({items.length} products)
              </span>
            )}
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#0d382c] tracking-tight font-display">
            Real products &amp; specifications
          </h2>
        </div>
        <p className="text-base sm:text-lg text-[#0d382c]/75 max-w-md">
          Explore industrial adhesive tapes. Click on any product to view all dimensions, colours, and specifications.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 mb-10">
        {categories.map((filter) => (
          <Button
            key={filter}
            variant={activeFilter === filter ? "filterActive" : "filter"}
            onClick={() => handleFilterChange(filter)}
            className="cursor-pointer transition-all"
          >
            {filter}
          </Button>
        ))}
      </div>

      {/* Loading & Content States */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#0d4d3d]" />
          <p className="text-sm font-mono text-[#0d382c]/70">Loading live products from database...</p>
        </div>
      ) : filteredData.length === 0 ? (
        <div className="text-center py-16 bg-[#faf6f0] rounded-2xl border border-[#0d382c]/10 p-8 max-w-lg mx-auto">
          <p className="text-lg font-bold text-[#0d382c]">No products found</p>
          <p className="text-sm text-[#0d382c]/70 mt-1">
            {error ? error : "No products available in this category in the database."}
          </p>
        </div>
      ) : (
        <>
          {/* Gallery Cards Grid (Clean product details only) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
            {paginatedData.map((item) => (
              <ProductCard
                key={item.id}
                item={item}
                onOpenExplore={(prod) => setSelectedExploreProduct(prod)}
              />
            ))}
          </div>

          {/* Pagination Controls with Circular Prev & Next Buttons and Sliding Window */}
          {totalPages > 1 && (
            <div className="mt-14 pt-8 border-t border-[#0d382c]/10 flex flex-col sm:flex-row items-center justify-between gap-6">
              {/* Counter / Info */}
              <div className="text-xs font-mono text-[#0d382c]/70 order-2 sm:order-1">
                Showing <strong className="text-[#0d382c]">{startIndex + 1}–{Math.min(startIndex + itemsPerPage, filteredData.length)}</strong> of <strong className="text-[#0d382c]">{filteredData.length}</strong> products
              </div>

              {/* Navigation Arrows & Sliding Window Numbers */}
              <div className="flex items-center gap-3 order-1 sm:order-2">
                {/* Previous Button (Circular) */}
                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="w-11 h-11 rounded-full border-2 border-[#0d382c] flex items-center justify-center text-[#0d382c] hover:bg-[#0d382c] hover:text-[#f5f0e6] disabled:opacity-30 disabled:border-[#0d382c]/30 disabled:hover:bg-transparent disabled:hover:text-[#0d382c] disabled:cursor-not-allowed transition-all shadow-xs cursor-pointer active:scale-95 group"
                  aria-label="Previous Page"
                  title="Previous Page"
                >
                  <ChevronLeft className="w-5 h-5 stroke-[2.5] transition-transform group-hover:-translate-x-0.5" />
                </button>

                {/* Sliding Window Page Number Buttons (2 visible numbers at a time) */}
                <div className="flex items-center gap-2 px-1">
                  {visiblePages.map((pageNum) => {
                    const isActive = pageNum === currentPage;
                    return (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => handlePageChange(pageNum)}
                        className={`w-10 h-10 rounded-full font-mono text-sm font-bold transition-all cursor-pointer flex items-center justify-center ${isActive
                            ? "bg-[#0d4d3d] text-[#f5f0e6] shadow-md scale-105"
                            : "text-[#0d382c] hover:bg-[#0d382c]/10"
                          }`}
                        aria-label={`Page ${pageNum}`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                {/* Next Button (Circular) */}
                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="w-11 h-11 rounded-full border-2 border-[#0d382c] flex items-center justify-center text-[#0d382c] hover:bg-[#0d382c] hover:text-[#f5f0e6] disabled:opacity-30 disabled:border-[#0d382c]/30 disabled:hover:bg-transparent disabled:hover:text-[#0d382c] disabled:cursor-not-allowed transition-all shadow-xs cursor-pointer active:scale-95 group"
                  aria-label="Next Page"
                  title="Next Page"
                >
                  <ChevronRight className="w-5 h-5 stroke-[2.5] transition-transform group-hover:translate-x-0.5" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ========================================================= */}
      {/* EXPLORE / BROWSE ALL VARIANTS & SPECIFICATIONS MODAL      */}
      {/* ========================================================= */}
      {selectedExploreProduct && (
        <ProductDetailModal
          product={selectedExploreProduct}
          onClose={() => setSelectedExploreProduct(null)}
        />
      )}
    </section>
  );
};

export default GallerySection;
