import React, { useState, useEffect, useRef } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { supabase } from "@/api/supabaseClient";
import { useAuth } from "@/lib/AuthContext";
import Navbar from "@/components/store/Navbar";
import Footer from "@/components/store/Footer";
import CartDrawer from "@/components/store/CartDrawer";
import BottomNav from "@/components/store/BottomNav";
import ChatWidget from "@/components/chat/ChatWidget";

export default function StoreLayout() {
  const location = useLocation();
  const { user } = useAuth();
  const [cart, setCart] = useState([]);
  const [cartLoaded, setCartLoaded] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const cartRecordId = useRef(null);
  const firstRun = useRef(true);

  // Load the cart from the database for signed-in users; guests use in-memory state only.
  useEffect(() => {
    if (!user) {
      setCart([]);
      cartRecordId.current = null;
      setCartLoaded(true);
      firstRun.current = true;
      return;
    }
    setCartLoaded(false);
    supabase.from('cart').select('*').eq('user_id', user.id).limit(1)
      .then(({ data }) => {
        if (data && data.length) {
          setCart(data[0].items || []);
          cartRecordId.current = data[0].id;
        } else {
          setCart([]);
          cartRecordId.current = null;
        }
      })
      .catch((error) => {
        console.error('Error loading cart:', error);
        setCart([]);
      })
      .finally(() => {
        setCartLoaded(true);
        firstRun.current = true;
      });
  }, [user]);

  // Listen for cart clear event from payment page
  useEffect(() => {
    const handleCartClear = () => {
      console.log('Cart clear event received, clearing cart...');
      setCart([]);
      cartRecordId.current = null;
      
      // Also clear from database if logged in
      if (user) {
        supabase.from('cart').delete().eq('user_id', user.id)
          .then(() => console.log('Cart cleared from database'))
          .catch(err => console.error('Error clearing cart from database:', err));
      }
    };

    window.addEventListener('cartClear', handleCartClear);
    return () => window.removeEventListener('cartClear', handleCartClear);
  }, [user]);

  // Persist cart changes to the database (signed-in users only).
  useEffect(() => {
    if (!cartLoaded || !user) return;
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    (async () => {
      try {
        if (cartRecordId.current) {
          await supabase.from('cart').update({ items: cart }).eq('id', cartRecordId.current);
        } else if (cart.length > 0) {
          const { data } = await supabase.from('cart').insert({ user_id: user.id, items: cart }).select().single();
          cartRecordId.current = data.id;
        }
      } catch (error) {
        console.error('Error saving cart:', error);
      }
    })();
  }, [cart, cartLoaded, user]);

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(i => i.product_id === product.id);
      if (existing) {
        return prev.map(i => i.product_id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, {
        product_id: product.id,
        name: product.name,
        price: product.price,
        image_url: product.image_url,
        quantity: 1
      }];
    });
    setCartOpen(true);
  };

  const updateQty = (productId, qty) => {
    if (qty <= 0) {
      setCart(prev => prev.filter(i => i.product_id !== productId));
    } else {
      setCart(prev => prev.map(i => i.product_id === productId ? { ...i, quantity: qty } : i));
    }
  };

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(i => i.product_id !== productId));
  };

  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#051510]">
      <Navbar cartCount={cartCount} onCartClick={() => setCartOpen(true)} />
      <CartDrawer
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        items={cart}
        onUpdateQty={updateQty}
        onRemove={removeFromCart}
      />
      <main id="main-content" className="pt-16 pb-16 md:pb-0" style={{ paddingLeft: "env(safe-area-inset-left)", paddingRight: "env(safe-area-inset-right)" }} tabIndex={-1}>
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <Outlet context={{ cart, addToCart, setCart }} />
          </motion.div>
        </AnimatePresence>
      </main>
      <Footer />
      <BottomNav />
      <ChatWidget />
    </div>
  );
}