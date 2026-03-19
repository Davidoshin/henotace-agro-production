/**
 * Analytics utility functions for tracking e-commerce events
 * Supports Google Analytics 4, Google Ads, Meta (Facebook) Pixel, and TikTok Pixel
 */

// Type declarations for global analytics objects
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    fbq?: (...args: any[]) => void;
    ttq?: {
      track: (event: string, params?: any) => void;
      identify: (params: any) => void;
    };
    dataLayer?: any[];
  }
}

export interface AnalyticsConfig {
  google_analytics_id?: string;
  google_analytics_enabled?: boolean;
  google_ads_id?: string;
  google_ads_conversion_id?: string;
  google_ads_enabled?: boolean;
  facebook_pixel_id?: string;
  facebook_pixel_enabled?: boolean;
  tiktok_pixel_id?: string;
  tiktok_pixel_enabled?: boolean;
}

export interface ProductItem {
  id: string | number;
  name: string;
  price: number;
  quantity: number;
  category?: string;
}

/**
 * Track a page view event
 */
export function trackPageView(config: AnalyticsConfig, pageTitle?: string) {
  // Google Analytics 4
  if (config.google_analytics_enabled && config.google_analytics_id && window.gtag) {
    window.gtag('event', 'page_view', {
      page_title: pageTitle,
      page_location: window.location.href,
    });
  }

  // Meta Pixel (already tracks PageView on init, but can be called again for SPA navigation)
  if (config.facebook_pixel_enabled && config.facebook_pixel_id && window.fbq) {
    window.fbq('track', 'PageView');
  }

  // TikTok Pixel
  if (config.tiktok_pixel_enabled && config.tiktok_pixel_id && window.ttq) {
    window.ttq.track('ViewPage');
  }
}

/**
 * Track when a user views a product/content
 */
export function trackViewContent(config: AnalyticsConfig, product: ProductItem, currency: string = 'NGN') {
  // Google Analytics 4 - view_item
  if (config.google_analytics_enabled && config.google_analytics_id && window.gtag) {
    window.gtag('event', 'view_item', {
      currency: currency,
      value: product.price,
      items: [{
        item_id: product.id.toString(),
        item_name: product.name,
        price: product.price,
        quantity: 1,
        item_category: product.category,
      }]
    });
  }

  // Meta Pixel - ViewContent
  if (config.facebook_pixel_enabled && config.facebook_pixel_id && window.fbq) {
    window.fbq('track', 'ViewContent', {
      content_ids: [product.id.toString()],
      content_name: product.name,
      content_type: 'product',
      value: product.price,
      currency: currency,
    });
  }

  // TikTok Pixel - ViewContent
  if (config.tiktok_pixel_enabled && config.tiktok_pixel_id && window.ttq) {
    window.ttq.track('ViewContent', {
      content_id: product.id.toString(),
      content_name: product.name,
      content_type: 'product',
      value: product.price,
      currency: currency,
    });
  }
}

/**
 * Track when a user adds a product to cart
 */
export function trackAddToCart(config: AnalyticsConfig, product: ProductItem, currency: string = 'NGN') {
  // Google Analytics 4 - add_to_cart
  if (config.google_analytics_enabled && config.google_analytics_id && window.gtag) {
    window.gtag('event', 'add_to_cart', {
      currency: currency,
      value: product.price * product.quantity,
      items: [{
        item_id: product.id.toString(),
        item_name: product.name,
        price: product.price,
        quantity: product.quantity,
        item_category: product.category,
      }]
    });
  }

  // Meta Pixel - AddToCart
  if (config.facebook_pixel_enabled && config.facebook_pixel_id && window.fbq) {
    window.fbq('track', 'AddToCart', {
      content_ids: [product.id.toString()],
      content_name: product.name,
      content_type: 'product',
      value: product.price * product.quantity,
      currency: currency,
      num_items: product.quantity,
    });
  }

  // TikTok Pixel - AddToCart
  if (config.tiktok_pixel_enabled && config.tiktok_pixel_id && window.ttq) {
    window.ttq.track('AddToCart', {
      content_id: product.id.toString(),
      content_name: product.name,
      content_type: 'product',
      value: product.price * product.quantity,
      currency: currency,
      quantity: product.quantity,
    });
  }
}

/**
 * Track when a user initiates checkout
 */
export function trackInitiateCheckout(config: AnalyticsConfig, items: ProductItem[], totalValue: number, currency: string = 'NGN') {
  // Google Analytics 4 - begin_checkout
  if (config.google_analytics_enabled && config.google_analytics_id && window.gtag) {
    window.gtag('event', 'begin_checkout', {
      currency: currency,
      value: totalValue,
      items: items.map(item => ({
        item_id: item.id.toString(),
        item_name: item.name,
        price: item.price,
        quantity: item.quantity,
        item_category: item.category,
      }))
    });
  }

  // Meta Pixel - InitiateCheckout
  if (config.facebook_pixel_enabled && config.facebook_pixel_id && window.fbq) {
    window.fbq('track', 'InitiateCheckout', {
      content_ids: items.map(item => item.id.toString()),
      content_type: 'product',
      value: totalValue,
      currency: currency,
      num_items: items.reduce((sum, item) => sum + item.quantity, 0),
    });
  }

  // TikTok Pixel - InitiateCheckout
  if (config.tiktok_pixel_enabled && config.tiktok_pixel_id && window.ttq) {
    window.ttq.track('InitiateCheckout', {
      contents: items.map(item => ({
        content_id: item.id.toString(),
        content_name: item.name,
        price: item.price,
        quantity: item.quantity,
      })),
      value: totalValue,
      currency: currency,
    });
  }
}

/**
 * Track a successful purchase/conversion
 */
export function trackPurchase(
  config: AnalyticsConfig, 
  transactionId: string, 
  items: ProductItem[], 
  totalValue: number, 
  currency: string = 'NGN'
) {
  // Google Analytics 4 - purchase
  if (config.google_analytics_enabled && config.google_analytics_id && window.gtag) {
    window.gtag('event', 'purchase', {
      transaction_id: transactionId,
      currency: currency,
      value: totalValue,
      items: items.map(item => ({
        item_id: item.id.toString(),
        item_name: item.name,
        price: item.price,
        quantity: item.quantity,
        item_category: item.category,
      }))
    });
  }

  // Google Ads Conversion
  if (config.google_ads_enabled && config.google_ads_id && window.gtag) {
    window.gtag('event', 'conversion', {
      send_to: config.google_ads_conversion_id 
        ? `${config.google_ads_id}/${config.google_ads_conversion_id}`
        : config.google_ads_id,
      transaction_id: transactionId,
      value: totalValue,
      currency: currency,
    });
  }

  // Meta Pixel - Purchase
  if (config.facebook_pixel_enabled && config.facebook_pixel_id && window.fbq) {
    window.fbq('track', 'Purchase', {
      content_ids: items.map(item => item.id.toString()),
      content_type: 'product',
      value: totalValue,
      currency: currency,
      num_items: items.reduce((sum, item) => sum + item.quantity, 0),
    });
  }

  // TikTok Pixel - CompletePayment
  if (config.tiktok_pixel_enabled && config.tiktok_pixel_id && window.ttq) {
    window.ttq.track('CompletePayment', {
      contents: items.map(item => ({
        content_id: item.id.toString(),
        content_name: item.name,
        price: item.price,
        quantity: item.quantity,
      })),
      value: totalValue,
      currency: currency,
    });
  }
}

/**
 * Track a lead/signup event
 */
export function trackLead(config: AnalyticsConfig, leadType: string = 'signup') {
  // Google Analytics 4 - generate_lead
  if (config.google_analytics_enabled && config.google_analytics_id && window.gtag) {
    window.gtag('event', 'generate_lead', {
      lead_type: leadType,
    });
  }

  // Meta Pixel - Lead
  if (config.facebook_pixel_enabled && config.facebook_pixel_id && window.fbq) {
    window.fbq('track', 'Lead', {
      lead_type: leadType,
    });
  }

  // TikTok Pixel - SubmitForm (closest equivalent)
  if (config.tiktok_pixel_enabled && config.tiktok_pixel_id && window.ttq) {
    window.ttq.track('SubmitForm', {
      form_type: leadType,
    });
  }
}

/**
 * Track a search event
 */
export function trackSearch(config: AnalyticsConfig, searchTerm: string) {
  // Google Analytics 4 - search
  if (config.google_analytics_enabled && config.google_analytics_id && window.gtag) {
    window.gtag('event', 'search', {
      search_term: searchTerm,
    });
  }

  // Meta Pixel - Search
  if (config.facebook_pixel_enabled && config.facebook_pixel_id && window.fbq) {
    window.fbq('track', 'Search', {
      search_string: searchTerm,
    });
  }

  // TikTok Pixel - Search
  if (config.tiktok_pixel_enabled && config.tiktok_pixel_id && window.ttq) {
    window.ttq.track('Search', {
      query: searchTerm,
    });
  }
}
