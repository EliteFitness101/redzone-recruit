// Central site config — edit contact handles and analytics IDs here.
export const SITE = {
  name: "Martial X × RedZone Security",
  shortName: "Martial X",
  domain: "https://martial.resofit.fit",
  tagline: "Train Like A Warrior. Get Paid Like A Professional.",
  description:
    "Nigeria's premier combat fitness academy and licensed security recruitment pipeline. Train, certify and get deployed.",
};

export const CONTACT = {
  whatsappNumber: "2348132255842", // international format, no +
  telegramHandle: "EliteNGRecruitBot",
  telegramGroup: "https://t.me/EliteNGRecruitBot",
  email: "recruit@resofit.fit",
  phone: "+2348132255842",
  instagram: "https://instagram.com/martialx",
  tiktok: "https://tiktok.com/@martialx",
  addressLagos: "Lagos, Nigeria",
};

export const waLink = (msg: string) =>
  `https://wa.me/${CONTACT.whatsappNumber}?text=${encodeURIComponent(msg)}`;

export const tgLink = () => `https://t.me/${CONTACT.telegramHandle}`;

// Public analytics IDs are injected at build time from Vercel environment variables.
// No tracking identifier is committed to source control.
export const ANALYTICS = {
  ga4: import.meta.env.VITE_GA4_MEASUREMENT_ID ?? "",
  metaPixel: import.meta.env.VITE_META_PIXEL_ID ?? "",
  tiktokPixel: import.meta.env.VITE_TIKTOK_PIXEL_ID ?? "",
};

export const TIERS = {
  basic: { id: "basic", name: "Basic Warrior", price: 1000, amountKobo: 100_000 },
  elite: { id: "elite", name: "Elite Security Track", price: 10_000, amountKobo: 1_000_000 },
  vip: { id: "vip", name: "VIP Fast Track", price: 30_000, amountKobo: 3_000_000 },
} as const;

export type TierId = keyof typeof TIERS;
