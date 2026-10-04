import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Mail, Phone, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

const ABOUT_IMG = "https://media.base44.com/images/public/6a492486a8334e5d309012cd/91c00ceba_generated_7f33afb5.png";

export default function About() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-[#0A3D2E] py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <span className="text-xs font-semibold uppercase tracking-widest text-[#22C55E]">Our Story</span>
          <h1 className="font-heading font-bold text-4xl md:text-6xl text-white mt-4 max-w-2xl leading-tight">
            Wellness Through Precision Science
          </h1>
          <p className="text-white/50 text-lg mt-6 max-w-xl leading-relaxed">
            BennyCare was founded on a simple belief: your body deserves clinical-grade nutrition and oral
            care, formulated with transparency and backed by science.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <img src={ABOUT_IMG} alt="Laboratory with botanical supplements" className="rounded-3xl w-full shadow-lg" />
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-[#22C55E]">The Mission</span>
            <h2 className="font-heading font-bold text-3xl text-[#0A3D2E] mt-3 mb-6">
              Where Botanicals Meet Lab-Grade Quality
            </h2>
            <div className="space-y-4 text-[#0A3D2E]/70 leading-relaxed">
              <p>
                At BennyCare, we merge the wisdom of nature with modern clinical science. Every supplement
                and oral care product is crafted from responsibly sourced botanical ingredients, then
                subjected to rigorous third-party testing.
              </p>
              <p>
                Our team of formulators and health scientists work to ensure every product delivers
                measurable results — no proprietary blends, no hidden fillers, just transparent,
                effective wellness.
              </p>
              <p>
                We believe that the path to optimal health starts with knowing exactly what you put into
                your body. That's why we publish every ingredient, every dosage, and every source — so
                you can make informed choices with confidence.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-24 lg:py-32 bg-[#E2F1E7]/30">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-16">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#22C55E]">Get In Touch</span>
            <h2 className="font-heading font-bold text-3xl text-[#0A3D2E] mt-3">Contact Us</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
            {[
              { icon: Mail, label: "Email", value: "hello@bennycare.com", href: "mailto:hello@bennycare.com" },
              { icon: Phone, label: "Phone", value: "+2348033136182", href: "tel:+2348033136182" },
              { icon: MapPin, label: "Location", value: "Isolo, Lagos", href: null },
            ].map(({ icon: Icon, label, value, href }) => (
              <div key={label} className="text-center p-6 bg-white rounded-2xl border border-[#E2F1E7]">
                <div className="w-10 h-10 rounded-lg bg-[#E2F1E7] flex items-center justify-center mx-auto mb-3">
                  <Icon className="w-5 h-5 text-[#0A3D2E]" />
                </div>
                <p className="text-xs text-[#0A3D2E]/40 mb-1">{label}</p>
                {href ? (
                  <a href={href} className="text-sm font-medium text-[#0A3D2E] hover:text-[#22C55E] transition-colors">{value}</a>
                ) : (
                  <p className="text-sm font-medium text-[#0A3D2E]">{value}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 lg:py-32 bg-[#0A3D2E]">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="font-heading font-bold text-3xl md:text-4xl text-white mb-6">Ready to Upgrade Your Wellness?</h2>
          <Link to="/shop">
            <Button className="bg-[#22C55E] text-[#051510] hover:bg-[#16a34a] font-semibold h-12 px-10 rounded-xl text-sm">
              Shop Now <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}