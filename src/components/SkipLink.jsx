import React from 'react';

/**
 * SkipLink component for keyboard users
 * Allows screen reader users to skip navigation and go directly to main content
 */
export default function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-[#22C55E] focus:text-[#051510] focus:rounded-lg focus:font-semibold focus:shadow-lg"
    >
      Skip to main content
    </a>
  );
}
