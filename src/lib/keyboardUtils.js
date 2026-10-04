/**
 * Keyboard navigation utilities
 * Improves accessibility for keyboard-only users
 */

// Handle keyboard navigation patterns
export const handleKeyboardNav = (event, actions) => {
  const { key } = event;

  switch (key) {
    case 'Enter':
    case ' ':
      if (actions.onSelect) {
        event.preventDefault();
        actions.onSelect();
      }
      break;
    case 'Escape':
      if (actions.onEscape) {
        event.preventDefault();
        actions.onEscape();
      }
      break;
    case 'ArrowUp':
      if (actions.onUp) {
        event.preventDefault();
        actions.onUp();
      }
      break;
    case 'ArrowDown':
      if (actions.onDown) {
        event.preventDefault();
        actions.onDown();
      }
      break;
    case 'ArrowLeft':
      if (actions.onLeft) {
        event.preventDefault();
        actions.onLeft();
      }
      break;
    case 'ArrowRight':
      if (actions.onRight) {
        event.preventDefault();
        actions.onRight();
      }
      break;
    case 'Home':
      if (actions.onHome) {
        event.preventDefault();
        actions.onHome();
      }
      break;
    case 'End':
      if (actions.onEnd) {
        event.preventDefault();
        actions.onEnd();
      }
      break;
    case 'PageUp':
      if (actions.onPageUp) {
        event.preventDefault();
        actions.onPageUp();
      }
      break;
    case 'PageDown':
      if (actions.onPageDown) {
        event.preventDefault();
        actions.onPageDown();
      }
      break;
    default:
      break;
  }
};

// Trap focus within a modal or dialog
export const trapFocus = (containerRef) => {
  const focusableElements = containerRef.current?.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );

  if (!focusableElements || focusableElements.length === 0) return;

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  const handleTab = (e) => {
    if (e.key === 'Tab') {
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    }
  };

  document.addEventListener('keydown', handleTab);

  // Focus first element
  firstElement.focus();

  // Return cleanup function
  return () => {
    document.removeEventListener('keydown', handleTab);
  };
};

// Restore focus to previous element
export const restoreFocus = (previousActiveElement) => {
  if (previousActiveElement) {
    previousActiveElement.focus();
  }
};

// Get all focusable elements
export const getFocusableElements = (container) => {
  return container.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
};

// Set focus to first focusable element
export const setFocusToFirst = (container) => {
  const focusableElements = getFocusableElements(container);
  if (focusableElements.length > 0) {
    focusableElements[0].focus();
  }
};

// Set focus to last focusable element
export const setFocusToLast = (container) => {
  const focusableElements = getFocusableElements(container);
  if (focusableElements.length > 0) {
    focusableElements[focusableElements.length - 1].focus();
  }
};

// Check if element is focusable
export const isFocusable = (element) => {
  if (!element) return false;

  const focusableTags = ['BUTTON', 'INPUT', 'SELECT', 'TEXTAREA', 'A'];
  const isFocusableTag = focusableTags.includes(element.tagName);
  const hasTabIndex = element.hasAttribute('tabindex');

  if (isFocusableTag || hasTabIndex) {
    const isDisabled = element.disabled;
    const isHidden = element.hidden || element.style.display === 'none';
    const isHiddenByAria = element.getAttribute('aria-hidden') === 'true';

    return !isDisabled && !isHidden && !isHiddenByAria;
  }

  return false;
};

// Add visible focus styles for keyboard users
export const addKeyboardFocusStyles = () => {
  const style = document.createElement('style');
  style.textContent = `
    /* Show focus outline only for keyboard navigation */
    *:focus {
      outline: 2px solid #22C55E;
      outline-offset: 2px;
    }

    /* Hide focus outline for mouse users */
    *:focus:not(:focus-visible) {
      outline: none;
    }

    /* Show focus outline for keyboard users */
    *:focus-visible {
      outline: 2px solid #22C55E;
      outline-offset: 2px;
    }

    /* Skip to main content link */
    .skip-link {
      position: absolute;
      top: -40px;
      left: 0;
      background: #22C55E;
      color: #051510;
      padding: 8px;
      z-index: 100;
      transition: top 0.3s;
    }

    .skip-link:focus {
      top: 0;
    }
  `;
  document.head.appendChild(style);
};

// Detect if user is navigating with keyboard
export const isKeyboardUser = () => {
  let lastInputType = null;

  document.addEventListener('keydown', () => {
    lastInputType = 'keyboard';
  });

  document.addEventListener('mousedown', () => {
    lastInputType = 'mouse';
  });

  document.addEventListener('touchstart', () => {
    lastInputType = 'touch';
  });

  return () => lastInputType === 'keyboard';
};

// Initialize keyboard navigation improvements
export const initKeyboardNavigation = () => {
  addKeyboardFocusStyles();
};
