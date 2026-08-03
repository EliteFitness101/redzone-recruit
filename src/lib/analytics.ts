// Unified analytics dispatcher — GA4 + Meta Pixel + TikTok Pixel.
// Fires safely whether or not the pixels are loaded.
import { ANALYTICS } from "@/config/site";

type EventName =
  | "cta_click"
  | "checkout_start"
  | "payment_success"
  | "payment_failed"
  | "referral_signup"
  | "whatsapp_click"
  | "telegram_click"
  | "phone_click"
  | "email_click"
  | "application_start"
  | "application_submit"
  | "view_content"
  | "call_click"
  | "signup"
  | "login";

type Params = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
    ttq?: { track: (event: string, params?: Params) => void };
    dataLayer?: unknown[];
  }
}

export function track(event: EventName, params: Params = {}) {
  try {
    if (typeof window === "undefined") return;
    // GA4
    window.gtag?.("event", event, params);
    // Meta Pixel — map key events to standard events
    const metaEvent =
      event === "payment_success"
        ? "Purchase"
        : event === "checkout_start"
        ? "InitiateCheckout"
        : event === "signup"
        ? "CompleteRegistration"
        : event === "application_submit"
        ? "Lead"
        : event === "view_content"
        ? "ViewContent"
        : event === "application_start"
        ? "InitiateCheckout"
        : "CustomEvent";
    window.fbq?.("track", metaEvent, params);
    // TikTok Pixel
    const ttEvent =
      event === "payment_success"
        ? "CompletePayment"
        : event === "checkout_start"
        ? "InitiateCheckout"
        : event === "signup"
        ? "CompleteRegistration"
        : event === "application_submit"
        ? "SubmitForm"
        : event === "view_content"
        ? "ViewContent"
        : "ClickButton";
    window.ttq?.track(ttEvent, params);
    // Console breadcrumb in dev
    if (import.meta.env.DEV) console.debug("[analytics]", event, params);
  } catch {
    /* never throw from analytics */
  }
}

export function initAnalytics() {
  if (typeof window === "undefined") return;
  const { ga4, metaPixel, tiktokPixel } = ANALYTICS;

  if (ga4 && !document.getElementById("ga4-script")) {
    const s = document.createElement("script");
    s.id = "ga4-script";
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${ga4}`;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function (...args: unknown[]) {
      window.dataLayer!.push(args);
    };
    window.gtag("js", new Date());
    window.gtag("config", ga4);
  }
  if (metaPixel && !window.fbq) {
    /* eslint-disable */
    (function (f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
      if (f.fbq) return;
      n = f.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n;
      n.push = n; n.loaded = !0; n.version = "2.0"; n.queue = [];
      t = b.createElement(e); t.async = !0; t.src = v;
      s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
    })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
    /* eslint-enable */
    window.fbq!("init", metaPixel);
    window.fbq!("track", "PageView");
  }
  if (tiktokPixel && !window.ttq) {
    /* eslint-disable */
    (function (w: any, d: any, t: any) {
      w.TiktokAnalyticsObject = t; var ttq = w[t] = w[t] || [];
      ttq.methods = ["page", "track", "identify", "instances", "debug", "on", "off", "once", "ready", "alias", "group", "enableCookie", "disableCookie"];
      ttq.setAndDefer = function (t: any, e: any) { t[e] = function () { t.push([e].concat(Array.prototype.slice.call(arguments, 0))); }; };
      for (var i = 0; i < ttq.methods.length; i++) ttq.setAndDefer(ttq, ttq.methods[i]);
      ttq.instance = function (t: any) { for (var e = ttq._i[t] || [], n = 0; n < ttq.methods.length; n++) ttq.setAndDefer(e, ttq.methods[n]); return e; };
      ttq.load = function (e: any) {
        var n = "https://analytics.tiktok.com/i18n/pixel/events.js"; ttq._i = ttq._i || {}; ttq._i[e] = []; ttq._i[e]._u = n; ttq._t = ttq._t || {}; ttq._t[e] = +new Date(); ttq._o = ttq._o || {}; ttq._o[e] = {};
        var o = d.createElement("script"); o.type = "text/javascript"; o.async = !0; o.src = n + "?sdkid=" + e + "&lib=" + t;
        var a = d.getElementsByTagName("script")[0]; a.parentNode.insertBefore(o, a);
      };
      ttq.load(tiktokPixel); ttq.page();
    })(window, document, "ttq");
    /* eslint-enable */
  }
}
