// Captures and persists paid-traffic attribution so it can be stored with every lead.
const KEY = "mx_attribution";

export interface Attribution {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  gclid?: string;
  rsid?: string;
  funnel_origin?: string;
  landing_page?: string;
  referrer?: string;
  captured_at?: string;
}

const FIELDS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "gclid",
  "rsid",
  "funnel_origin",
] as const;

export function captureAttribution(search: string): Attribution {
  try {
    const params = new URLSearchParams(search);
    const found: Attribution = {};
    FIELDS.forEach((f) => {
      const v = params.get(f);
      if (v) found[f] = v.slice(0, 120);
    });
    if (Object.keys(found).length === 0) return getAttribution();
    found.landing_page = window.location.pathname;
    found.referrer = document.referrer?.slice(0, 200) || undefined;
    found.captured_at = new Date().toISOString();
    localStorage.setItem(KEY, JSON.stringify(found));
    return found;
  } catch {
    return {};
  }
}

export function getAttribution(): Attribution {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}");
  } catch {
    return {};
  }
}
