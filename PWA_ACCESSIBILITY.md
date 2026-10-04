# PWA & Accessibility Documentation

## Overview

This document outlines the Progressive Web App (PWA) features and accessibility improvements implemented in the BennyCare/AETHER application.

---

## 1. Progressive Web App (PWA) Features

### 1.1 PWA Manifest

**Location:** `public/manifest.json`

The PWA manifest provides information about the application for installation on mobile devices.

**Features:**
- App name: "BennyCare - AETHER"
- Short name: "BennyCare"
- Theme color: `#22C55E` (green)
- Background color: `#051510` (dark green)
- Display mode: `standalone` (removes browser UI)
- Orientation: `portrait-primary`
- App shortcuts for quick access to Shop, Cart, and Profile
- Multiple icon sizes (72x72 to 512x512)

**Installation:**
Users can install the app on:
- **iOS**: Tap Share → Add to Home Screen
- **Android**: Browser will show "Add to Home Screen" banner
- **Desktop**: Chrome will show install icon in address bar

---

### 1.2 Service Worker

**Location:** `public/sw.js`

The service worker enables offline functionality and caching.

**Features:**
- **Cache Strategy:** Network-first with cache fallback
- **Cached Resources:** Main pages, JavaScript, CSS, images
- **Offline Support:** Custom offline page when network unavailable
- **Push Notifications:** Ready for future implementation
- **Auto-Update:** Checks for new versions and prompts user

**Cached Pages:**
- `/` (Home)
- `/shop`
- `/categories`
- `/about`
- `/login`
- `/register`
- `/manifest.json`

**Cache Expiration:**
- HTML/JS/CSS: Immediate refresh
- Images: 30 days
- API responses: 24 hours

---

### 1.3 Vite PWA Plugin

**Location:** `vite.config.js`

The Vite PWA plugin automatically generates the service worker and manifest during build.

**Configuration:**
```javascript
VitePWA({
  registerType: 'custom',
  includeAssets: ['offline.html'],
  manifest: { /* manifest config */ },
  workbox: {
    globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/chlfmkeplogbkornbwqc\.supabase\.co\/.*/i,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'supabase-api',
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 60 * 60 * 24 // 24 hours
          }
        }
      },
      {
        urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'images',
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
          }
        }
      }
    ]
  }
})
```

---

### 1.4 PWA Meta Tags

**Location:** `index.html`

Added comprehensive PWA meta tags for better mobile experience.

**Meta Tags:**
- `theme-color`: Sets browser UI color
- `apple-mobile-web-app-capable`: Enables full-screen on iOS
- `apple-mobile-web-app-status-bar-style`: iOS status bar style
- `mobile-web-app-capable`: Enables full-screen on Android
- `application-name`: App name for shortcuts
- `description`: SEO description
- `keywords`: SEO keywords

**Social Media Tags:**
- Open Graph tags for Facebook/LinkedIn
- Twitter Card tags for Twitter

**Apple Touch Icons:**
- Multiple icon sizes for different iOS devices

---

### 1.5 Service Worker Registration

**Location:** `src/main.jsx`

Service worker is registered on app initialization with callbacks for:
- **New Version Available:** Prompts user to update
- **Offline Ready:** Logs when app can work offline
- **Registration Success:** Logs successful registration
- **Registration Error:** Logs errors

---

## 2. Mobile-Specific Optimizations

### 2.1 Mobile Utilities

**Location:** `src/lib/mobileUtils.js`

Comprehensive mobile detection and optimization utilities.

**Functions:**

#### Device Detection
```javascript
isMobile() // Detects mobile device
isIOS() // Detects iOS device
isAndroid() // Detects Android device
getOrientation() // Returns 'portrait' or 'landscape'
```

#### Safe Area Support
```javascript
getSafeAreaInsets() // Returns safe area for notched devices
enableSafeAreaSupport() // Adds CSS variables for safe areas
```

#### Touch Optimizations
```javascript
preventPullToRefresh() // Prevents pull-to-refresh on mobile
ensureTouchTargets() // Ensures minimum 44x44px touch targets
hapticFeedback(type) // Provides haptic feedback
```

#### Performance
```javascript
debounce(func, wait) // Debounces functions
throttle(func, limit) // Throttles functions
smoothScrollTo(element, offset) // Smooth scroll with offset
enableHardwareAcceleration() // Enables GPU acceleration
```

---

### 2.2 Mobile CSS Utilities

**Location:** `src/index.css`

Added mobile-specific CSS utility classes.

**Safe Area Classes:**
```css
.safe-top /* Top safe area padding */
.safe-bottom /* Bottom safe area padding */
.safe-left /* Left safe area padding */
.safe-right /* Right safe area padding */
.safe-all /* All safe area padding */
```

**Touch Target Classes:**
```css
.touch-target /* Minimum 44x44px touch target */
```

**Hardware Acceleration:**
```css
.hardware-accelerated /* GPU-accelerated animations */
```

**Mobile-Only Styles:**
```css
.mobile-padding /* 16px horizontal padding on mobile */
.mobile-gap /* 12px gap on mobile */
.mobile-text-sm /* 14px text on mobile */
.mobile-text-xs /* 12px text on mobile */
```

**Scroll Snap:**
```css
.scroll-snap-x /* Horizontal scroll snap */
.scroll-snap-y /* Vertical scroll snap */
.snap-start /* Snap to start */
.snap-center /* Snap to center */
.snap-end /* Snap to end */
```

**Hide Scrollbar:**
```css
.hide-scrollbar /* Hides scrollbar while allowing scroll */
```

**Orientation-Specific:**
```css
.landscape-compact /* Compact layout in landscape */
```

**Platform-Specific:**
```css
.ios-fix /* iOS-specific fixes */
.android-fix /* Android-specific fixes */
```

---

### 2.3 Mobile Initialization

**Location:** `src/main.jsx`

Mobile optimizations are initialized on app startup:
```javascript
initMobileOptimizations()
```

This automatically:
- Enables safe area support
- Prevents pull-to-refresh
- Enables hardware acceleration
- Ensures touch targets are properly sized

---

## 3. Accessibility Improvements

### 3.1 ARIA Labels and Roles

**Location:** Multiple components

Added comprehensive ARIA labels for screen reader support.

**Navbar Component:**
- `role="navigation"` and `aria-label="Main navigation"`
- `role="menubar"` for navigation menu
- `role="menuitem"` for each link
- `aria-label` for cart button with item count
- `aria-label` for user profile and logout buttons
- `aria-expanded` for mobile menu toggle
- `aria-controls="mobile-menu"` for mobile menu

**ProductCard Component:**
- `aria-label` for add to cart button
- `aria-label` for wishlist toggle button
- Dynamic labels based on state

**StoreLayout Component:**
- `id="main-content"` for skip link target
- `tabIndex={-1}` for programmatic focus

---

### 3.2 Skip Link

**Location:** `src/components/SkipLink.jsx`

Allows keyboard users to skip navigation and go directly to main content.

**Features:**
- Hidden by default (`sr-only` class)
- Visible on focus
- Links to `#main-content`
- Positioned at top-left corner
- High contrast for visibility

**Usage:**
Automatically included in `App.jsx` at the top of the page.

---

### 3.3 Live Announcer

**Location:** `src/components/LiveAnnouncer.jsx`

Announces important state changes to screen reader users.

**Features:**
- `role="status"` for polite announcements
- `aria-live="polite"` for non-interruptive announcements
- `aria-atomic="true"` for complete message reading
- Auto-clear after announcement (configurable)
- Hook for easy usage: `useLiveAnnouncer()`

**Usage Example:**
```javascript
const { announce } = useLiveAnnouncer();
announce('Order placed successfully');
```

---

### 3.4 Keyboard Navigation Utilities

**Location:** `src/lib/keyboardUtils.js`

Comprehensive keyboard navigation support.

**Functions:**

#### Keyboard Event Handling
```javascript
handleKeyboardNav(event, actions)
// Handles: Enter, Space, Escape, Arrows, Home, End, PageUp, PageDown
```

#### Focus Management
```javascript
trapFocus(containerRef) // Traps focus within modal
restoreFocus(previousElement) // Restores focus to previous element
getFocusableElements(container) // Gets all focusable elements
setFocusToFirst(container) // Focuses first element
setFocusToLast(container) // Focuses last element
isFocusable(element) // Checks if element is focusable
```

#### Focus Styles
```javascript
addKeyboardFocusStyles() // Adds visible focus styles
isKeyboardUser() // Detects keyboard navigation
```

---

### 3.5 Keyboard Focus Styles

**Location:** `src/lib/keyboardUtils.js`

Added comprehensive focus styles for keyboard users.

**Features:**
- Visible focus outline for keyboard users
- Hidden focus outline for mouse users
- Uses `:focus-visible` for keyboard-only focus
- Green focus color (`#22C55E`) to match brand
- 2px outline with 2px offset

**CSS:**
```css
*:focus {
  outline: 2px solid #22C55E;
  outline-offset: 2px;
}

*:focus:not(:focus-visible) {
  outline: none;
}

*:focus-visible {
  outline: 2px solid #22C55E;
  outline-offset: 2px;
}
```

---

### 3.6 Keyboard Navigation Initialization

**Location:** `src/main.jsx`

Keyboard navigation improvements are initialized on app startup:
```javascript
initKeyboardNavigation()
```

This automatically:
- Adds visible focus styles
- Enables keyboard detection
- Improves focus management

---

## 4. Testing Guidelines

### 4.1 PWA Testing

#### Test PWA Installation:
1. Open app in Chrome on Android
2. Look for "Add to Home Screen" banner
3. Tap to install
4. Verify app launches without browser UI
5. Test offline functionality

#### Test on iOS:
1. Open app in Safari on iOS
2. Tap Share button
3. Select "Add to Home Screen"
4. Verify app launches as native app
5. Test safe area insets on notched devices

#### Test Offline Mode:
1. Install PWA
2. Turn off network connection
3. Navigate through app
4. Verify cached pages load
5. Verify offline page appears for uncached content
6. Turn on network and verify updates

#### Test Service Worker:
1. Open DevTools → Application → Service Workers
2. Verify service worker is active
3. Update content and reload
4. Verify service worker detects update
5. Accept update and verify new version loads

---

### 4.2 Accessibility Testing

#### Test Keyboard Navigation:
1. Navigate using Tab key
2. Verify focus moves logically
3. Verify focus outline is visible
4. Test Enter/Space to activate buttons
5. Test Escape to close modals
6. Test Arrow keys for menus
7. Verify skip link works (press Tab on page load)

#### Test Screen Reader:
1. Enable screen reader (NVDA, JAWS, VoiceOver, TalkBack)
2. Navigate through app
3. Verify all interactive elements are announced
4. Verify ARIA labels are read correctly
5. Verify dynamic content announcements work
6. Test live regions for state changes
7. Verify form error messages are announced

#### Test Touch Targets:
1. Open app on mobile device
2. Verify all buttons are at least 44x44px
3. Test tap targets on small screens
4. Verify no accidental taps
5. Test touch feedback

#### Test Color Contrast:
1. Use contrast checker tool
2. Verify all text meets WCAG AA standards (4.5:1)
3. Verify large text meets AAA standards (7:1)
4. Test in both light and dark modes
5. Verify focus indicators have sufficient contrast

#### Test with Screen Magnification:
1. Zoom to 200%
2. Verify content remains readable
3. Verify layout doesn't break
4. Test keyboard navigation with zoom
5. Verify touch targets remain usable

---

## 5. WCAG Compliance

### 5.1 Level A (Must Support)

✅ **Perceivable:**
- Text alternatives for non-text content (images have alt text)
- Captions provided for audio content (when implemented)
- Content can be presented in different ways (responsive design)
- Content is easier to see and hear (color contrast, font sizes)

✅ **Operable:**
- All functionality available from keyboard
- No keyboard traps
- Enough time to read and use content
- No seizures or physical reactions
- Navigable (skip links, headings, landmarks)

✅ **Understandable:**
- Text is readable and understandable
- Content appears and operates in predictable ways
- Input assistance helps avoid and correct mistakes

✅ **Robust:**
- Compatible with current and future user agents
- Compatible with assistive technologies

### 5.2 Level AA (Should Support)

✅ **Enhanced Perceivable:**
- Color contrast ratios meet standards
- Text can be resized without assistive technology
- Images of text avoided (except decoration)
- High contrast mode support

✅ **Enhanced Operable:**
- No focus content on input focus
- Consistent navigation
- Context-sensitive help
- Error identification and suggestions

✅ **Enhanced Understandable:**
- Language of page identified
- Unusual words defined
- Abbreviations explained
- Consistent identification
- Error prevention

### 5.3 Level AAA (Nice to Have)

⚠️ **Not Fully Implemented:**
- Sign language interpretation
- Extended audio descriptions
- High contrast color palette (beyond AA)
- Text spacing customization
- Background sounds can be paused

---

## 6. Performance Considerations

### 6.1 PWA Performance

**Service Worker Caching:**
- Reduces network requests
- Faster page loads
- Offline functionality
- Lower data usage

**Image Optimization:**
- Cache-first strategy for images
- 30-day cache expiration
- Lazy loading with LazyImage component
- WebP format support (when available)

**Code Splitting:**
- React.lazy for route-based splitting
- Suspense for loading states
- Reduced initial bundle size

---

### 6.2 Mobile Performance

**Hardware Acceleration:**
- GPU-accelerated animations
- Reduced main thread blocking
- Smoother transitions

**Touch Optimizations:**
- Reduced tap delay
- Proper touch target sizing
- Tap highlight removal
- Pull-to-refresh prevention

**Memory Management:**
- Debounced scroll handlers
- Throttled resize handlers
- Cleanup of event listeners
- Subscription cleanup

---

## 7. Browser Support

### 7.1 PWA Support

**Fully Supported:**
- Chrome (Desktop & Android)
- Edge (Desktop & Android)
- Safari (iOS 11.3+)
- Samsung Internet

**Limited Support:**
- Firefox (Desktop only, no Android PWA)
- Opera (Desktop only)

**Not Supported:**
- Internet Explorer
- Old mobile browsers

### 7.2 Accessibility Support

**Screen Readers:**
- NVDA (Windows)
- JAWS (Windows)
- VoiceOver (macOS & iOS)
- TalkBack (Android)
- Orca (Linux)

**Keyboard Navigation:**
- All modern browsers
- Requires focus management implementation

---

## 8. Future Enhancements

### 8.1 PWA Enhancements

- **Push Notifications:** Order status updates, promotions
- **Background Sync:** Sync orders when back online
- **Periodic Sync:** Refresh data periodically
- **File System API:** Save files locally
- **Share Target:** Receive shared content
- **Badge API:** Show unread count on app icon

### 8.2 Accessibility Enhancements

- **Live Region Expansion:** More dynamic content announcements
- **Focus Trap in Modals:** Automatic focus management
- **Error Boundaries:** Screen reader-friendly error messages
- **Form Validation:** Accessible error messages
- **Color Blind Support:** Alternative indicators
- **Reduced Motion:** Respect user preferences
- **High Contrast Mode:** Full support

### 8.3 Mobile Enhancements

- **Touch ID/Face ID:** Biometric authentication
- **Haptic Feedback:** More tactile feedback
- **Gesture Navigation:** Swipe gestures
- **Offline Forms:** Save forms for later submission
- **Push Notifications:** Real-time updates
- **App Shortcuts:** More quick actions

---

## 9. Resources

### PWA Resources:
- [PWA Best Practices](https://web.dev/pwa/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [Workbox](https://developers.google.com/web/tools/workbox)

### Accessibility Resources:
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Accessibility Checklist](https://webaim.org/standards/wcag/checklist)
- [a11y Project](https://www.a11yproject.com/)

### Testing Tools:
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [WAVE](https://wave.webaim.org/)
- [Colour Contrast Analyzer](https://www.tpgi.com/color-contrast-checker/)
