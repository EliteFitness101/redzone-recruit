// Shared ResoFit ecosystem attribution.
// Attribution is non-authentication data and is mirrored to a first-party
// parent-domain cookie so links between resofit.fit subdomains retain source.

const KEY = "mx_attribution";
const COOKIE_KEY = "resofit_attribution_v2";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 90;

export interface Attribution {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  gclid?: string;
  ttclid?: string;
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
  "ttclid",
  "rsid",
  "funnel_origin",
] as const;

function readSharedCookie(): Attribution {
  if (typeof document === "undefined") return {};
  try {
    const prefix = `${COOKIE_KEY}=`;
    const raw = document.cookie.split("; ").find((item) => item.startsWith(prefix))?.slice(prefix.length);
    return raw ? (JSON.parse(decodeURIComponent(raw)) as Attribution) : {};
  } catch {
    return {};
  }
}

function writeSharedCookie(value: Attribution) {
  if (typeof document === "undefined") return;
  try {
    document.cookie = `${COOKIE_KEY}=${encodeURIComponent(JSON.stringify(value))}; Max-Age=${COOKIE_MAX_AGE}; Path=/; Domain=.resofit.fit; Secure; SameSite=Lax`;
  } catch {
    /* cookie unavailable */
  }
}

export function captureAttribution(search: string): Attribution {
  try {
    const params = new URLSearchParams(search);
    const shared = readSharedCookie();
    const stored = (() => {
      try { return JSON.parse(localStorage.getItem(KEY) || "{}") as Attribution; } catch { return {}; }
    })();
    const found: Attribution = { ...shared, ...stored };
    FIELDS.forEach((f) => {
      const v = params.get(f);
      if (v) found[f] = v.slice(0, 120);
    });
    if (Object.keys(found).length === 0) return {};
    if (typeof window !== "undefined") {
      found.landing_page = params.toString() ? window.location.pathname : found.landing_page;
      found.referrer = document.referrer?.slice(0, 200) || found.referrer;
      found.captured_at = found.captured_at ?? new Date().toISOString();
      localStorage.setItem(KEY, JSON.stringify(found));
      writeSharedCookie(found);
    }
    return found;
  } catch {
    return {};
  }
}

export function getAttribution(): Attribution {
  try {
    const shared = readSharedCookie();
    if (Object.keys(shared).length) return shared;
    return JSON.parse(localStorage.getItem(KEY) || "{}");
  } catch {
    return {};
  }
}
