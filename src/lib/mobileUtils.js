/**
 * Mobile-specific utilities and optimizations
 */

// Detect if device is mobile
export const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// Detect if device is iOS
export const isIOS = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
};

// Detect if device is Android
export const isAndroid = () => {
  return /Android/.test(navigator.userAgent);
};

// Get safe area insets for notched devices
export const getSafeAreaInsets = () => {
  const style = getComputedStyle(document.documentElement);
  return {
    top: parseInt(style.getPropertyValue('--safe-area-inset-top') || '0'),
    right: parseInt(style.getPropertyValue('--safe-area-inset-right') || '0'),
    bottom: parseInt(style.getPropertyValue('--safe-area-inset-bottom') || '0'),
    left: parseInt(style.getPropertyValue('--safe-area-inset-left') || '0'),
  };
};

// Add safe area support
export const enableSafeAreaSupport = () => {
  const style = document.createElement('style');
  style.textContent = `
    :root {
      --safe-area-inset-top: env(safe-area-inset-top, 0px);
      --safe-area-inset-right: env(safe-area-inset-right, 0px);
      --safe-area-inset-bottom: env(safe-area-inset-bottom, 0px);
      --safe-area-inset-left: env(safe-area-inset-left, 0px);
    }
  `;
  document.head.appendChild(style);
};

// Prevent pull-to-refresh on mobile
export const preventPullToRefresh = () => {
  let startY = 0;
  let isPulling = false;

  document.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      startY = e.touches[0].clientY;
      isPulling = true;
    }
  }, { passive: true });

  document.addEventListener('touchmove', (e) => {
    if (isPulling && e.touches.length === 1) {
      const currentY = e.touches[0].clientY;
      const diff = currentY - startY;

      // Only prevent if at top of page and pulling down
      if (window.scrollY === 0 && diff > 0) {
        e.preventDefault();
      }
    }
  }, { passive: false });

  document.addEventListener('touchend', () => {
    isPulling = false;
  });
};

// Optimize touch targets (minimum 44x44px)
export const ensureTouchTargets = () => {
  const buttons = document.querySelectorAll('button, a, [role="button"]');
  buttons.forEach(btn => {
    const rect = btn.getBoundingClientRect();
    if (rect.width < 44 || rect.height < 44) {
      btn.style.minWidth = '44px';
      btn.style.minHeight = '44px';
      btn.style.display = 'inline-flex';
      btn.style.alignItems = 'center';
      btn.style.justifyContent = 'center';
    }
  });
};

// Add haptic feedback (for supported devices)
export const hapticFeedback = (type = 'light') => {
  if ('vibrate' in navigator) {
    switch (type) {
      case 'light':
        navigator.vibrate(10);
        break;
      case 'medium':
        navigator.vibrate(20);
        break;
      case 'heavy':
        navigator.vibrate(30);
        break;
      case 'success':
        navigator.vibrate([10, 50, 10]);
        break;
      case 'error':
        navigator.vibrate([20, 30, 20, 30, 20]);
        break;
      default:
        navigator.vibrate(10);
    }
  }
};

// Smooth scroll with hardware acceleration
export const smoothScrollTo = (element, offset = 0) => {
  const target = typeof element === 'string' ? document.querySelector(element) : element;
  if (target) {
    const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - offset;
    window.scrollTo({
      top: targetPosition,
      behavior: 'smooth'
    });
  }
};

// Debounce function for scroll events
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Throttle function for scroll events
export const throttle = (func, limit) => {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Detect viewport orientation
export const getOrientation = () => {
  return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
};

// Listen for orientation changes
export const onOrientationChange = (callback) => {
  window.addEventListener('orientationchange', callback);
  window.addEventListener('resize', callback);
  return () => {
    window.removeEventListener('orientationchange', callback);
    window.removeEventListener('resize', callback);
  };
};

// Enable hardware acceleration for animations
export const enableHardwareAcceleration = () => {
  const style = document.createElement('style');
  style.textContent = `
    .hardware-accelerated {
      transform: translateZ(0);
      backface-visibility: hidden;
      perspective: 1000px;
    }
  `;
  document.head.appendChild(style);
};

// Initialize all mobile optimizations
export const initMobileOptimizations = () => {
  if (isMobile()) {
    enableSafeAreaSupport();
    preventPullToRefresh();
    enableHardwareAcceleration();
    // Ensure touch targets after DOM is ready
    setTimeout(ensureTouchTargets, 100);
  }
};
