import React, { useState, useEffect } from "react";
import { X, Minus, Plus, ShoppingBag, Trash2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/api/supabaseClient";

export default function CartDrawer({ isOpen, onClose, items, onUpdateQty, onRemove }) {
  const [removingItems, setRemovingItems] = useState(new Set());
  const [productStock, setProductStock] = useState({});
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Fetch current stock for all products in cart
  useEffect(() => {
    if (items.length === 0) return;
    
    const fetchStock = async () => {
      const productIds = items.map(item => item.product_id);
      const { data, error } = await supabase
        .from('products')
        .select('id, stock')
        .in('id', productIds);
      
      if (!error && data) {
        const stockMap = {};
        data.forEach(p => stockMap[p.id] = p.stock);
        setProductStock(stockMap);
      }
    };
    
    fetchStock();
  }, [items]);

  if (!isOpen) return null;

  const handleRemove = (productId) => {
    setRemovingItems(prev => new Set([...prev, productId]));
    setTimeout(() => {
      onRemove(productId);
      setRemovingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
      toast.success('Item removed from cart');
    }, 300);
  };

  const handleUpdateQty = (productId, newQty) => {
    if (newQty < 1) {
      handleRemove(productId);
      return;
    }
    
    // Check stock availability using fresh data from database
    const availableStock = productStock[productId] || 0;
    if (newQty > availableStock) {
      toast.error(`Only ${availableStock} ${availableStock === 1 ? 'product' : 'products'} available`);
      return;
    }
    
    onUpdateQty(productId, newQty);
  };

  const handleClearCart = () => {
    items.forEach(item => onRemove(item.product_id));
    toast.success('Cart cleared');
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white dark:bg-[#071f15] z-50 shadow-2xl flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-[#E2F1E7] dark:border-[#22C55E]/10">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-[#22C55E]" />
            <h2 className="font-heading font-bold text-lg text-[#0A3D2E] dark:text-white">Your Cart</h2>
            <span className="text-xs bg-[#22C55E]/10 text-[#22C55E] px-2 py-1 rounded-full font-medium">
              {items.length} {items.length === 1 ? 'item' : 'items'}
            </span>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[#E2F1E7] dark:hover:bg-white/5 rounded-full transition-colors">
            <X className="w-5 h-5 text-[#0A3D2E] dark:text-white" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-20 h-20 bg-[#E2F1E7]/30 dark:bg-[#22C55E]/10 rounded-full flex items-center justify-center mb-4">
                <ShoppingBag className="w-10 h-10 text-[#22C55E]" />
              </div>
              <p className="text-[#0A3D2E]/50 dark:text-white/50 text-sm mb-2">Your cart is empty</p>
              <p className="text-xs text-[#0A3D2E]/30 dark:text-white/30 mb-4">Add some products to get started</p>
              <Button onClick={onClose} variant="outline" className="border-[#0A3D2E]/20 text-[#0A3D2E] dark:border-white/10 dark:text-white">
                Continue Shopping
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {items.map((item) => (
                <div 
                  key={item.product_id} 
                  className={`flex gap-4 p-4 rounded-xl bg-[#E2F1E7]/30 dark:bg-[#051510] border border-[#E2F1E7] dark:border-[#22C55E]/10 transition-all duration-300 ${
                    removingItems.has(item.product_id) ? 'opacity-50 scale-95' : ''
                  }`}
                >
                  {item.image_url && (
                    <img 
                      src={item.image_url} 
                      alt={item.name} 
                      className="w-20 h-20 rounded-lg object-cover border border-[#E2F1E7] dark:border-[#22C55E]/10"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm text-[#0A3D2E] dark:text-white truncate mb-1">{item.name}</h4>
                    <p className="text-sm font-bold text-[#22C55E] mb-2">₦{item.price.toFixed(2)}</p>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 bg-white dark:bg-[#071f15] rounded-lg px-2 py-1 border border-[#E2F1E7] dark:border-[#22C55E]/10">
                        <button
                          onClick={() => handleUpdateQty(item.product_id, item.quantity - 1)}
                          className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-[#E2F1E7] dark:hover:bg-white/5 transition-colors disabled:opacity-50"
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="w-3 h-3 text-[#0A3D2E] dark:text-white" />
                        </button>
                        <span className="text-sm font-medium w-6 text-center text-[#0A3D2E] dark:text-white">{item.quantity}</span>
                        <button
                          onClick={() => handleUpdateQty(item.product_id, item.quantity + 1)}
                          disabled={item.quantity >= (productStock[item.product_id] || 0)}
                          className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-[#E2F1E7] dark:hover:bg-white/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title={item.quantity >= (productStock[item.product_id] || 0) ? 'Maximum stock reached' : 'Increase quantity'}
                        >
                          <Plus className="w-3 h-3 text-[#0A3D2E] dark:text-white" />
                        </button>
                      </div>
                      <span className="text-xs text-[#0A3D2E]/50 dark:text-white/50">₦{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemove(item.product_id)}
                    className="self-start p-2 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors group"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4 text-red-400 group-hover:text-red-500" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="p-6 border-t border-[#E2F1E7] dark:border-[#22C55E]/10 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-[#0A3D2E]/60 dark:text-white/60">Subtotal</span>
              <span className="font-heading font-bold text-lg text-[#0A3D2E] dark:text-white">₦{total.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-[#0A3D2E]/50 dark:text-white/50">
              <Sparkles className="w-3 h-3" />
              <span>Shipping calculated at checkout</span>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleClearCart}
                variant="outline"
                className="flex-1 border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/30 dark:text-red-400 dark:hover:bg-red-900/20"
              >
                Clear Cart
              </Button>
              <Link to="/checkout" onClick={onClose} className="flex-1">
                <Button className="w-full bg-[#22C55E] text-[#051510] hover:bg-[#16a34a] font-semibold h-12 rounded-xl">
                  Checkout
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
}