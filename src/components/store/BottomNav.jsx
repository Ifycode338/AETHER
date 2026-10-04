import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, ShoppingBag, User } from "lucide-react";

const items = [
  { to: "/", label: "Home", icon: Home },
  { to: "/shop", label: "Shop", icon: ShoppingBag },
  { to: "/profile", label: "Profile", icon: User },
];

export default function BottomNav() {
  const { pathname } = useLocation();

  const isActive = (to) => (to === "/" ? pathname === "/" : pathname.startsWith(to));

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 backdrop-blur-xl bg-white/90 dark:bg-[#051510]/90 border-t border-[#E2F1E7] dark:border-[#22C55E]/10 select-none"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-center justify-around h-16">
        {items.map(({ to, label, icon: Icon }) => {
          const active = isActive(to);
          return (
            <Link
              key={to}
              to={to}
              className="flex flex-col items-center justify-center gap-1 flex-1 h-full select-none"
            >
              <Icon
                className={`w-5 h-5 transition-colors ${active ? "text-[#22C55E]" : "text-[#0A3D2E]/40 dark:text-white/40"}`}
              />
              <span
                className={`text-[10px] font-medium transition-colors ${active ? "text-[#22C55E]" : "text-[#0A3D2E]/40 dark:text-white/40"}`}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}