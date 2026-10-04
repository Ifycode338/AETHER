import React, { useState, useEffect } from "react";
import { Check, ChevronDown } from "lucide-react";
import { supabase } from "@/api/supabaseClient";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

export default function CategorySelect({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCategories = async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true });
      if (error) console.error('Error loading categories:', error);
      else setCategories(data || []);
      setLoading(false);
    };
    loadCategories();
  }, []);

  const selected = categories.find((c) => c.name.toLowerCase() === value);

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <button
          type="button"
          className="w-full px-4 py-3 rounded-xl bg-[#051510] border border-[#22C55E]/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#22C55E] flex items-center justify-between select-none"
        >
          <span>{selected?.name || (loading ? "Loading..." : "Select category")}</span>
          <ChevronDown className="w-4 h-4 text-white/40" />
        </button>
      </DrawerTrigger>
      <DrawerContent className="bg-[#071f15] border-[#22C55E]/10">
        <DrawerHeader className="text-left">
          <DrawerTitle className="text-white">Select Category</DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-8 space-y-2">
          {loading ? (
            <div className="text-center text-white/40 text-sm py-4">Loading categories...</div>
          ) : categories.length === 0 ? (
            <div className="text-center text-white/40 text-sm py-4">
              No categories yet. Add categories in the admin panel.
            </div>
          ) : (
            categories.map((cat) => {
              const active = cat.name.toLowerCase() === value;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    onChange(cat.name.toLowerCase());
                    setOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-colors select-none ${
                    active
                      ? "bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30"
                      : "text-white/70 border border-transparent hover:bg-white/5"
                  }`}
                >
                  <span>{cat.name}</span>
                  {active && <Check className="w-4 h-4" />}
                </button>
              );
            })
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}