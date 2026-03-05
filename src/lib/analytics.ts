import { supabase } from '@/integrations/supabase/client';

export const trackEvent = (eventName: string, properties?: Record<string, any>) => {
  // Push to Google Analytics if available
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', eventName, properties);
  }

  // Log to database for internal analytics (fire-and-forget)
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
