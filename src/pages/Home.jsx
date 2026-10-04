import React, { useState, useEffect } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { supabase } from "@/api/supabaseClient";
import { ArrowRight, Shield, Leaf, Microscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProductCard from "@/components/store/ProductCard";

const HERO_IMG = "https://media.base44.com/images/public/6a492486a8334e5d309012cd/2ed927178_generated_d4ae778d.png";
const SUPP_IMG = "https://media.base44.com/images/public/6a492486a8334e5d309012cd/113f93901_generated_bccfa118.png";
const ORAL_IMG = "https://media.base44.com/images/public/6a492486a8334e5d309012cd/de8ca8946_generated_5daeae9b.png";

export default function Home() {
  const { addToCart } = useOutletContext();
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      // First try to load featured products
      const { data: featuredData, error: featuredError } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .eq('is_featured', true)
        .order('created_date', { ascending: false })
        .limit(6);
      
      if (featuredError) {
        console.error('Error loading featured products:', featuredError);
      }
      
      // If no featured products, load regular products as fallback
      if (!featuredData || featuredData.length === 0) {
        const { data: regularData, error: regularError } = await supabase
          .from('products')
          .select('*')
          .eq('is_active', true)
          .order('created_date', { ascending: false })
          .limit(6);
        
        if (regularError) {
          // Fall back to regular products if featured query fails
          setFeatured(regularData || []);
        } else {
          setFeatured(regularData || []);
        }
      } else {
        setFeatured(featuredData);
      }
      setLoading(false);
    };
    loadProducts();
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="min-h-[90vh] flex items-center relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 w-full grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <div className="py-16 sm:py-20 lg:py-0">
            <div className="inline-flex items-center gap-2 bg-[#E2F1E7] dark:bg-white/10 rounded-full px-3 sm:px-4 py-1.5 mb-6 sm:mb-8">
              <div className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
              <span className="text-xs font-medium text-[#0A3D2E]/70 dark:text-white/70 tracking-wide uppercase">Premium Wellness</span>
            </div>
            <h1 className="font-heading font-black text-[#0A3D2E] dark:text-white text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl leading-[0.9] tracking-tight mb-4 sm:mb-6">
              BIOLOGY.<br />
              <span className="text-[#22C55E]">REFINED.</span>
            </h1>
            <p className="text-[#0A3D2E]/60 dark:text-white/70 text-base sm:text-lg max-w-md leading-relaxed mb-6 sm:mb-8">
              Clinical-grade supplements and oral care products, formulated with precision
              for the self-optimizing individual.
            </p>
            <div className="flex flex-wrap gap-3 sm:gap-4">
              <Link to="/shop" className="flex-1 sm:flex-none">
                <Button className="w-full sm:w-auto bg-[#22C55E] text-[#051510] hover:bg-[#16a34a] font-semibold h-12 px-6 sm:px-8 rounded-xl text-sm">
                  Shop Now <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link to="/about" className="flex-1 sm:flex-none">
                <Button variant="outline" className="w-full sm:w-auto border-[#0A3D2E]/20 dark:border-white/20 text-[#0A3D2E] dark:text-white hover:bg-[#E2F1E7] dark:hover:bg-white/10 h-12 px-6 sm:px-8 rounded-xl text-sm">
                  Our Science
                </Button>
              </Link>
            </div>
          </div>
          <div className="relative hidden lg:block">
            <div className="absolute -inset-10 bg-[#E2F1E7]/40 dark:bg-white/10 rounded-[3rem] -rotate-6" />
            <img
              src={HERO_IMG}
              alt="Premium supplement capsule dissolving in mint leaves"
              className="relative rounded-3xl w-full max-w-lg mx-auto shadow-2xl shadow-[#0A3D2E]/10 dark:shadow-black/20"
            />
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#22C55E]/30 to-transparent" />
      </section>

      {/* Categories */}
      <section className="py-16 sm:py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
          <div className="text-center mb-12 sm:mb-16">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#22C55E]">Categories</span>
            <h2 className="font-heading font-bold text-2xl sm:text-3xl md:text-4xl text-[#0A3D2E] dark:text-white mt-3">Precision Wellness</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            <Link to="/shop?category=supplements" className="group relative overflow-hidden rounded-2xl sm:rounded-3xl aspect-[4/3]">
              <img src={SUPP_IMG} alt="Supplements collection" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A3D2E]/80 to-transparent" />
              <div className="absolute bottom-6 sm:bottom-8 left-6 sm:left-8">
                <h3 className="font-heading font-bold text-xl sm:text-2xl text-white mb-1">Supplements</h3>
                <p className="text-white/60 text-xs sm:text-sm">Clinical-grade formulations</p>
              </div>
              <div className="absolute bottom-6 sm:bottom-8 right-6 sm:right-8 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#22C55E] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 text-[#051510]" />
              </div>
            </Link>
            <Link to="/shop?category=oral_care" className="group relative overflow-hidden rounded-2xl sm:rounded-3xl aspect-[4/3]">
              <img src={ORAL_IMG} alt="Oral care collection" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A3D2E]/80 to-transparent" />
              <div className="absolute bottom-6 sm:bottom-8 left-6 sm:left-8">
                <h3 className="font-heading font-bold text-xl sm:text-2xl text-white mb-1">Oral Care</h3>
                <p className="text-white/60 text-xs sm:text-sm">Botanical oral wellness</p>
              </div>
              <div className="absolute bottom-6 sm:bottom-8 right-6 sm:right-8 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#22C55E] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 text-[#051510]" />
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      {!loading && featured.length > 0 && (
        <section className="py-16 sm:py-20 lg:py-32 bg-[#E2F1E7]/30 dark:bg-white/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8 sm:mb-12">
              <div>
                <span className="text-xs font-semibold uppercase tracking-widest text-[#22C55E]">Curated</span>
                <h2 className="font-heading font-bold text-2xl sm:text-3xl md:text-4xl text-[#0A3D2E] dark:text-white mt-3">Featured Products</h2>
              </div>
              <Link to="/shop" className="text-sm font-medium text-[#0A3D2E]/60 dark:text-white/60 hover:text-[#22C55E] transition-colors flex items-center gap-1">
                View All <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-10">
              {featured.map(product => (
                <ProductCard key={product.id} product={product} onAddToCart={addToCart} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Trust / Features */}
      <section className="py-16 sm:py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
          <div className="text-center mb-12 sm:mb-16">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#22C55E]">Why BennyCare</span>
            <h2 className="font-heading font-bold text-2xl sm:text-3xl md:text-4xl text-[#0A3D2E] dark:text-white mt-3">The BennyCare Standard</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {[
              { icon: Microscope, title: "Clinically Formulated", desc: "Every product is developed with peer-reviewed research and third-party tested for potency and purity." },
              { icon: Leaf, title: "Botanical Origins", desc: "We source the finest natural ingredients, combining traditional botanicals with modern extraction science." },
              { icon: Shield, title: "Transparent Quality", desc: "Full ingredient disclosure, no proprietary blends. Know exactly what goes into your body, every time." },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="text-center p-6 sm:p-8 rounded-2xl bg-white dark:bg-white/5 border border-[#E2F1E7] dark:border-white/10 hover:shadow-lg hover:shadow-[#0A3D2E]/5 dark:hover:shadow-black/20 transition-shadow">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#E2F1E7] dark:bg-white/10 flex items-center justify-center mx-auto mb-4 sm:mb-5">
                  <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-[#0A3D2E] dark:text-white" />
                </div>
                <h3 className="font-heading font-semibold text-lg sm:text-[#0A3D2E] dark:text-white mb-2 sm:mb-3">{title}</h3>
                <p className="text-xs sm:text-sm text-[#0A3D2E]/60 dark:text-white/70 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-20 lg:py-32 bg-[#0A3D2E] dark:bg-[#0A3D2E]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-12 text-center">
          <h2 className="font-heading font-bold text-2xl sm:text-3xl md:text-5xl text-white mb-4 sm:mb-6">
            Start Your Wellness Journey
          </h2>
          <p className="text-white/70 dark:text-white/60 text-base sm:text-lg mb-8 sm:mb-10 max-w-lg mx-auto">
            Join thousands who have upgraded their daily health ritual with BennyCare's precision-formulated products.
          </p>
          <Link to="/shop">
            <Button className="w-full sm:w-auto bg-[#22C55E] text-[#051510] hover:bg-[#16a34a] font-semibold h-12 px-8 sm:px-10 rounded-xl text-sm">
              Explore Products <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}