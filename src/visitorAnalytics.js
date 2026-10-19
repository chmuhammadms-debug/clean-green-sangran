import { useEffect } from 'react';
import { supabase } from './supabase';

let previous = { page: '', at: 0 };
let memoryVisitor;
const ID_KEY = 'cgs-visitor-id';
function visitorId() {
  try {
    let id = localStorage.getItem(ID_KEY);
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id || '')) {
      id = crypto.randomUUID();
      localStorage.setItem(ID_KEY, id);
    }
    return id;
  } catch { return memoryVisitor ||= crypto.randomUUID(); }
}
function sourceBucket() {
  try {
    const host = new URL(document.referrer).hostname.toLowerCase();
    if (host === location.hostname) return 'direct';
    if (/(^|\.)google\.[a-z.]+$/.test(host)) return 'google';
    if (/(^|\.)(facebook\.com|fb\.com)$/.test(host)) return 'facebook';
    if (/(^|\.)instagram\.com$/.test(host)) return 'instagram';
    return 'other';
  } catch { return 'direct'; }
}

// Track page categories only: never URLs, search terms, names, email, GPS or IP.
export function useVisitorAnalytics(page) {
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        if (navigator.doNotTrack === '1' || navigator.globalPrivacyControl === true) return;
        if (/admin|public-preview/.test(location.hash)) return;
        if (!['cleangreensangran.com','www.cleangreensangran.com'].includes(location.hostname)) return;
        const { data, error } = await supabase.auth.getSession();
        // Exclude signed-in sessions (including admin previews) from visitor totals.
        if (cancelled || error || data.session) return;
        const now = Date.now();
        if (previous.page === page && now - previous.at < 1500) return;
        previous = { page, at: now };
        await supabase.from('site_analytics_events').insert({
          id: crypto.randomUUID(), visitor_id: visitorId(), page, source: sourceBucket(),
        });
      } catch { /* Analytics must never interrupt the public website. */ }
    }, 300);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [page]);
}
