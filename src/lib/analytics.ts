import { supabase } from '@/integrations/supabase/client';
import { hasAnalyticsConsent } from '@/components/CookieConsent';

export const trackEvent = (eventName: string, properties?: Record<string, any>) => {
  // Only send to external analytics if user consented
  if (hasAnalyticsConsent()) {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', eventName, properties);
    }
  }

  // Internal analytics are essential for service operation (always log)
  try {
    supabase.auth.getUser().then(({ data: { user } }) => {
      supabase
        .from('analytics_events')
        .insert({
          event_name: eventName,
          event_properties: properties || {},
          page_url: window.location.pathname,
          user_id: user?.id || null,
        } as any)
        .then(() => {});
    });
  } catch {
    // Silent fail — analytics should never break the app
  }
};
