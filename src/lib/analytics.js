// Simple analytics tracking utility
class Analytics {
  constructor() {
    this.events = [];
    this.sessionId = this.generateSessionId();
    this.userId = null;
  }

  generateSessionId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  setUserId(userId) {
    this.userId = userId;
  }

  track(event, properties = {}) {
    const eventData = {
      event,
      properties: {
        ...properties,
        sessionId: this.sessionId,
        userId: this.userId,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
      },
    };

    this.events.push(eventData);

    // In production, send to analytics service
    if (process.env.NODE_ENV === 'production') {
      this.sendToAnalytics(eventData);
    } else {
      console.log('Analytics:', eventData);
    }
  }

  sendToAnalytics(eventData) {
    // TODO: Integrate with analytics service (Google Analytics, Mixpanel, etc.)
    // Example for Google Analytics 4:
    // if (window.gtag) {
    //   window.gtag('event', eventData.event, eventData.properties);
    // }
  }

  // Page view tracking
  trackPageView() {
    this.track('page_view', {
      path: window.location.pathname,
      title: document.title,
    });
  }

  // User actions
  trackSignUp(method = 'email') {
    this.track('sign_up', { method });
  }

  trackLogin(method = 'email') {
    this.track('login', { method });
  }

  trackLogout() {
    this.track('logout');
  }

  trackProductView(productId, productName, category) {
    this.track('product_view', {
      product_id: productId,
      product_name: productName,
      category,
    });
  }

  trackAddToCart(productId, productName, price, quantity) {
    this.track('add_to_cart', {
      product_id: productId,
      product_name: productName,
      price,
      quantity,
      total: price * quantity,
    });
  }

  trackRemoveFromCart(productId, productName) {
    this.track('remove_from_cart', {
      product_id: productId,
      product_name: productName,
    });
  }

  trackInitiateCheckout(total, itemCount) {
    this.track('initiate_checkout', {
      total,
      item_count: itemCount,
    });
  }

  trackPurchase(orderId, total, itemCount, items) {
    this.track('purchase', {
      order_id: orderId,
      total,
      item_count: itemCount,
      items,
    });
  }

  trackSearch(query, resultCount) {
    this.track('search', {
      query,
      result_count: resultCount,
    });
  }

  trackAddToWishlist(productId, productName) {
    this.track('add_to_wishlist', {
      product_id: productId,
      product_name: productName,
    });
  }

  trackError(error, context) {
    this.track('error', {
      error_message: error.message,
      error_stack: error.stack,
      context,
    });
  }

  // Get all events (for debugging)
  getEvents() {
    return this.events;
  }

  // Clear events
  clearEvents() {
    this.events = [];
  }
}

// Create singleton instance
export const analytics = new Analytics();

// Auto-track page views
if (typeof window !== 'undefined') {
  // Track initial page view
  analytics.trackPageView();

  // Track page view on route changes
  let lastPath = window.location.pathname;
  const observer = new MutationObserver(() => {
    if (window.location.pathname !== lastPath) {
      lastPath = window.location.pathname;
      analytics.trackPageView();
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}
