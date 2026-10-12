import React, { useState, useEffect } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { supabase } from "@/api/supabaseClient";
import { ArrowRight, Star, CheckCircle, Truck, Lock, Award, ChevronDown, ChevronUp, Shield, MessageCircle, ShoppingBag, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProductCard from "@/components/store/ProductCard";

const SUPP_IMG = "https://media.base44.com/images/public/6a492486a8334e5d309012cd/113f93901_generated_bccfa118.png";
const ORAL_IMG = "https://media.base44.com/images/public/6a492486a8334e5d309012cd/de8ca8946_generated_5daeae9b.png";

export default function Home() {
  const { addToCart } = useOutletContext();
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
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
      
      if (!featuredData || featuredData.length === 0) {
        const { data: regularData, error: regularError } = await supabase
          .from('products')
          .select('*')
          .eq('is_active', true)
          .order('created_date', { ascending: false })
          .limit(6);
        
        setFeatured(regularData || []);
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
      <section className="min-h-[85vh] flex items-center relative overflow-hidden bg-gradient-to-br from-[#F8FAFC] to-[#E2F1E7]/50 dark:from-[#051510] dark:to-[#071f15]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 w-full">
          <div className="text-center py-12 sm:py-16 lg:py-20">
            <h1 className="font-heading font-bold text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-[#0A3D2E] dark:text-white mb-4 sm:mb-6 leading-tight">
              Welcome to <span className="text-[#22C55E]">BennyCare</span>
            </h1>
            <p className="text-[#0A3D2E]/60 dark:text-white/70 text-base sm:text-lg max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed">
              Your journey to optimal health starts here. Discover premium supplements and oral care products crafted with precision and care.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/shop">
                <Button className="bg-[#22C55E] text-[#051510] hover:bg-[#16a34a] font-semibold h-12 px-8 rounded-xl text-sm shadow-lg">
                  Shop Products
                </Button>
              </Link>
              <Link to="/about">
                <Button variant="outline" className="border-[#22C55E] text-[#22C55E] hover:bg-[#22C55E]/10 h-12 px-8 rounded-xl text-sm">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
          <h2 className="font-heading font-bold text-2xl sm:text-3xl text-[#0A3D2E] dark:text-white mb-8 sm:mb-12">Browse by Category</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <Link to="/shop?category=supplements" className="group relative overflow-hidden rounded-2xl aspect-[4/3]">
              <img src={SUPP_IMG} alt="Supplements" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A3D2E]/60 to-transparent" />
              <div className="absolute bottom-6 left-6">
                <h3 className="font-heading font-bold text-xl text-white mb-1">Supplements</h3>
                <p className="text-white/80 text-sm">Clinical-grade formulations</p>
              </div>
            </Link>
            <Link to="/shop?category=oral_care" className="group relative overflow-hidden rounded-2xl aspect-[4/3]">
              <img src={ORAL_IMG} alt="Oral Care" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A3D2E]/60 to-transparent" />
              <div className="absolute bottom-6 left-6">
                <h3 className="font-heading font-bold text-xl text-white mb-1">Oral Care</h3>
                <p className="text-white/80 text-sm">Botanical wellness</p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      {!loading && featured.length > 0 && (
        <section className="py-12 sm:py-16 lg:py-20 bg-[#E2F1E7]/30 dark:bg-white/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
            <div className="flex items-center justify-between mb-8 sm:mb-12">
              <h2 className="font-heading font-bold text-2xl sm:text-3xl text-[#0A3D2E] dark:text-white">Featured Products</h2>
              <Link to="/shop" className="text-sm font-medium text-[#22C55E] hover:text-[#16a34a] transition-colors">
                View All →
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              {featured.map(product => (
                <ProductCard key={product.id} product={product} onAddToCart={addToCart} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Why Choose Us */}
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
          <h2 className="font-heading font-bold text-2xl sm:text-3xl text-[#0A3D2E] dark:text-white mb-8 sm:mb-12 text-center">Why Choose BennyCare?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {[
              { icon: Award, title: "Quality Assured", desc: "Third-party tested for purity and potency" },
              { icon: Truck, title: "Fast Delivery", desc: "Nationwide shipping within 2-5 days" },
              { icon: Shield, title: "Secure Payments", desc: "Your data is always protected" },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="text-center p-6 rounded-2xl bg-white dark:bg-[#071f15] border border-[#E2F1E7] dark:border-white/10 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-full bg-[#E2F1E7] dark:bg-white/10 flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-6 h-6 text-[#22C55E]" />
                </div>
                <h3 className="font-semibold text-lg text-[#0A3D2E] dark:text-white mb-2">{title}</h3>
                <p className="text-sm text-[#0A3D2E]/60 dark:text-white/70">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-12 sm:py-16 lg:py-20 bg-[#E2F1E7]/30 dark:bg-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
          <h2 className="font-heading font-bold text-2xl sm:text-3xl text-[#0A3D2E] dark:text-white mb-8 sm:mb-12 text-center">Happy Customers</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: "Adaobi N.", rating: 5, text: "Great products! I've been using the supplements for 3 months and feel amazing." },
              { name: "Chinedu O.", rating: 5, text: "The oral care products are excellent. My dentist is impressed!" },
              { name: "Funmi A.", rating: 5, text: "Fast delivery and premium quality. Highly recommend BennyCare!" },
            ].map(({ name, rating, text }) => (
              <div key={name} className="bg-white dark:bg-[#071f15] p-6 rounded-2xl border border-[#E2F1E7] dark:border-white/10">
                <div className="flex items-center gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-4 h-4 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`} />
                  ))}
                </div>
                <p className="text-sm text-[#0A3D2E]/70 dark:text-white/80 mb-4">{text}</p>
                <p className="text-sm font-semibold text-[#0A3D2E] dark:text-white">{name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-12 text-center">
          <h2 className="font-heading font-bold text-2xl sm:text-3xl text-[#0A3D2E] dark:text-white mb-4">Get 10% Off</h2>
          <p className="text-[#0A3D2E]/60 dark:text-white/70 text-sm mb-6">Subscribe to our newsletter for exclusive offers</p>
          {subscribed ? (
            <div className="flex items-center justify-center gap-2 text-[#22C55E]">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Thanks for subscribing!</span>
            </div>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); setSubscribed(true); }} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="flex-1 px-4 py-3 rounded-xl border border-[#E2F1E7] dark:border-white/20 bg-white dark:bg-white/10 text-[#0A3D2E] dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#22C55E]"
              />
              <Button type="submit" className="bg-[#22C55E] text-[#051510] hover:bg-[#16a34a] font-semibold h-12 px-6 rounded-xl text-sm">
                Subscribe
              </Button>
            </form>
          )}
        </div>
      </section>

      {/* FAQ */}
      <section className="py-12 sm:py-16 lg:py-20 bg-[#E2F1E7]/30 dark:bg-white/5">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-12">
          <h2 className="font-heading font-bold text-2xl sm:text-3xl text-[#0A3D2E] dark:text-white mb-8 sm:mb-12 text-center">Common Questions</h2>
          <div className="space-y-3">
            {[
              { q: "How long does shipping take?", a: "Nationwide shipping within 2-5 business days" },
              { q: "What's your return policy?", a: "30-day return policy for unopened products" },
              { q: "Are products FDA approved?", a: "Yes, NAFDAC certified" },
            ].map(({ q, a }, index) => (
              <div key={index} className="bg-white dark:bg-[#071f15] rounded-xl border border-[#E2F1E7] dark:border-white/10 overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left"
                >
                  <span className="font-semibold text-[#0A3D2E] dark:text-white">{q}</span>
                  {openFaq === index ? <ChevronUp className="w-5 h-5 text-[#22C55E]" /> : <ChevronDown className="w-5 h-5 text-[#0A3D2E]/50 dark:text-white/50" />}
                </button>
                {openFaq === index && (
                  <div className="px-6 pb-4 pt-0">
                    <p className="text-sm text-[#0A3D2E]/70 dark:text-white/80">{a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Promo Banner */}
      <section className="py-10 sm:py-12 bg-gradient-to-r from-[#22C55E] to-[#16a34a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <h3 className="font-heading font-bold text-xl sm:text-2xl text-[#051510] mb-1">
                Free Shipping on Orders Over ₦10,000
              </h3>
              <p className="text-[#051510]/80 text-sm">Use code: <span className="font-mono font-bold">FREESHIP</span></p>
            </div>
            <Link to="/shop">
              <Button className="bg-[#051510] text-white hover:bg-black font-semibold h-12 px-6 rounded-xl text-sm">
                Shop Now
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-20 lg:py-24 bg-[#0A3D2E] dark:bg-[#0A3D2E]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-12 text-center">
          <h2 className="font-heading font-bold text-2xl sm:text-3xl md:text-4xl text-white mb-4">
            Start Your Wellness Journey Today
          </h2>
          <p className="text-white/70 text-base sm:text-lg mb-8 max-w-lg mx-auto">
            Join thousands who have upgraded their health with BennyCare's premium products.
          </p>
          <Link to="/shop">
            <Button className="w-full sm:w-auto bg-[#22C55E] text-[#051510] hover:bg-[#16a34a] font-semibold h-12 px-8 rounded-xl text-sm">
              Explore Products
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
