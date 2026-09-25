import React from "react";
import { Phone, Mail, MapPin } from "lucide-react";

export const ContactSection: React.FC = () => {
  return (
    <section id="contact" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-[#0d382c]/10">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left Col: Headings */}
        <div className="lg:col-span-7">
          <span className="text-xs font-mono font-bold tracking-widest text-[#0d4d3d] uppercase mb-2 block">
            05 — CONTACT
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#0d382c] tracking-tight font-display mb-4">
            Send your artwork. Get a clear quote.
          </h2>
          <p className="text-base sm:text-lg text-[#0d382c]/75 mb-6 max-w-xl">
            Share your tape type, width, colours and number of boxes. We will confirm the price and artwork details directly.
          </p>
        </div>

        {/* Right Col: Contact Info Card */}
        <div className="lg:col-span-5">
          <div className="bg-white rounded-2xl p-8 border border-[#0d382c]/15 shadow-lg space-y-6">
            <div className="text-[11px] font-mono tracking-widest font-bold text-[#0d382c]/60 uppercase">
              ARUVI INDUSTRIES
            </div>

            <div className="space-y-5">
              {/* Phone */}
              <a
                href="tel:+919042555005"
                className="flex items-center gap-3.5 text-[#0d382c] hover:text-[#0d4d3d] transition-colors group"
              >
                <div className="w-10 h-10 rounded-lg bg-[#0d4d3d]/10 flex items-center justify-center text-[#0d4d3d] group-hover:bg-[#0d4d3d] group-hover:text-white transition-colors">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] font-mono text-[#0d382c]/60 uppercase">Phone</div>
                  <div className="font-mono font-bold text-base sm:text-lg">+91 9042555005</div>
                </div>
              </a>

              {/* Email */}
              <a
                href="mailto:peacocktapes@gmail.com"
                className="flex items-center gap-3.5 text-[#0d382c] hover:text-[#0d4d3d] transition-colors group"
              >
                <div className="w-10 h-10 rounded-lg bg-[#0d4d3d]/10 flex items-center justify-center text-[#0d4d3d] group-hover:bg-[#0d4d3d] group-hover:text-white transition-colors">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] font-mono text-[#0d382c]/60 uppercase">Email inquiries</div>
                  <div className="font-mono font-bold text-base sm:text-lg">peacocktapes@gmail.com</div>
                </div>
              </a>

              {/* Address */}
              <div className="flex items-start gap-3.5 text-[#0d382c]">
                <div className="w-10 h-10 rounded-lg bg-[#0d4d3d]/10 flex items-center justify-center text-[#0d4d3d] shrink-0 mt-0.5">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] font-mono text-[#0d382c]/60 uppercase">Factory & Office</div>
                  <div className="text-sm font-medium leading-relaxed text-[#0d382c]/90">
                    1/126-4, near TVS Nagar, Pernaickenpatti, Vembakottai Main Road, Sivakasi - 626189, Tamil Nadu, India
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
