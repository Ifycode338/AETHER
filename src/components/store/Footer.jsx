import React from "react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-[#0A3D2E] text-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-[#22C55E] flex items-center justify-center">
                <span className="text-[#051510] font-bold text-sm">B</span>
              </div>
              <span className="font-heading font-bold text-xl tracking-tight">BennyCare</span>
            </div>
            <p className="text-white/60 text-sm leading-relaxed max-w-sm">
              Premium supplements and oral care products formulated with clinical precision
              and botanical purity. Biology, refined.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-4 text-[#22C55E]">Shop</h4>
            <div className="flex flex-col gap-2">
              <Link to="/shop?category=supplements" className="text-sm text-white/60 hover:text-white transition-colors">Supplements</Link>
              <Link to="/shop?category=oral_care" className="text-sm text-white/60 hover:text-white transition-colors">Oral Care</Link>
              <Link to="/shop" className="text-sm text-white/60 hover:text-white transition-colors">All Products</Link>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-4 text-[#22C55E]">Company</h4>
            <div className="flex flex-col gap-2">
              <Link to="/about" className="text-sm text-white/60 hover:text-white transition-colors">About Us</Link>
              <Link to="/about" className="text-sm text-white/60 hover:text-white transition-colors">Contact</Link>
              <Link to="/about" className="text-sm text-white/60 hover:text-white transition-colors">Privacy Policy</Link>
              <Link to="/about" className="text-sm text-white/60 hover:text-white transition-colors">Terms of Service</Link>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-white/40">© 2026 BennyCare. All rights reserved.</p>
          <p className="text-xs text-white/40">Biology. Refined.</p>
        </div>
      </div>
    </footer>
  );
}