// Central site config — edit contact handles and analytics IDs here.
export const SITE = {
  name: "Martial X × RedZone Security",
  shortName: "Martial X",
  domain: "https://redzone-recruit.lovable.app",
  tagline: "Train Like A Warrior. Get Paid Like A Professional.",
  description:
    "Nigeria's premier combat fitness academy and licensed security recruitment pipeline. Train, certify and get deployed.",
};

// TODO: replace placeholders with real handles
export const CONTACT = {
  whatsappNumber: "2348000000000", // international format, no +
  telegramHandle: "MartialXBot",
  telegramGroup: "https://t.me/martialx",
  email: "recruit@resofit.fit",
  phone: "+2348000000000",
  instagram: "https://instagram.com/martialx",
  tiktok: "https://tiktok.com/@martialx",
  addressLagos: "Lagos, Nigeria",
};

export const waLink = (msg: string) =>
  `https://wa.me/${CONTACT.whatsappNumber}?text=${encodeURIComponent(msg)}`;

export const tgLink = () => `https://t.me/${CONTACT.telegramHandle}`;

// TODO: paste real IDs when ready
export const ANALYTICS = {
  ga4: "", // e.g. "G-XXXXXXX"
  metaPixel: "", // e.g. "1234567890"
  tiktokPixel: "", // e.g. "CXXXXXXXX"
};

export const TIERS = {
  basic: { id: "basic", name: "Basic Warrior", price: 1000, amountKobo: 100_000 },
  elite: { id: "elite", name: "Elite Security Track", price: 10_000, amountKobo: 1_000_000 },
  vip: { id: "vip", name: "VIP Fast Track", price: 30_000, amountKobo: 3_000_000 },
} as const;

export type TierId = keyof typeof TIERS;
