import { supabase } from "@/integrations/supabase/client";

export const MARTIAL_OFFER_DEFS = {
  basic: {
    id: "basic",
    sku: "MX-BASIC-WARRIOR",
    name: "Basic Warrior",
    desc: "Foundation combat fitness & discipline.",
    features: ["4-week core program", "Basic combat conditioning", "Telegram community access", "Digital workbook"],
    cta: "Start Basic",
    variant: "glass" as const,
  },
  elite: {
    id: "elite",
    sku: "MX-ELITE-SECURITY",
    name: "Elite Security Track",
    desc: "Full recruitment-ready track with placement priority.",
    features: ["12-week elite program", "Tactical & defensive modules", "RedZone vetting fast pass", "Certificate of completion", "Priority job placement"],
    cta: "Go Elite",
    variant: "hero" as const,
    featured: true,
  },
  vip: {
    id: "vip",
    sku: "MX-VIP-FAST",
    name: "VIP Fast Track",
    desc: "1-on-1 coaching, accelerated deployment.",
    features: ["6-week intensive", "Personal coach & mentor", "Close-protection module", "Guaranteed deployment interview", "Lifetime alumni network"],
    cta: "Claim VIP",
    variant: "gold" as const,
  },
} as const;

export type MartialOfferId = keyof typeof MARTIAL_OFFER_DEFS;
export type MartialOffer = (typeof MARTIAL_OFFER_DEFS)[MartialOfferId] & {
  price: number;
};

export async function fetchMartialOffers(): Promise<MartialOffer[]> {
  const skus = Object.values(MARTIAL_OFFER_DEFS).map((offer) => offer.sku);
  const { data, error } = await supabase
    .from("products")
    .select("sku,title,variant_price,published")
    .in("sku", skus)
    .eq("published", true);

  if (error) throw error;

  const bySku = new Map((data ?? []).map((row) => [row.sku, row]));
  return (Object.keys(MARTIAL_OFFER_DEFS) as MartialOfferId[])
    .map((id) => {
      const def = MARTIAL_OFFER_DEFS[id];
      const row = bySku.get(def.sku);
      const price = Number(row?.variant_price);
      if (!row || !Number.isFinite(price) || price <= 0) return null;
      return { ...def, name: row.title || def.name, price };
    })
    .filter((offer): offer is MartialOffer => Boolean(offer));
}

export async function fetchMartialOffer(id: MartialOfferId): Promise<MartialOffer | null> {
  const def = MARTIAL_OFFER_DEFS[id];
  const { data, error } = await supabase
    .from("products")
    .select("sku,title,variant_price,published")
    .eq("sku", def.sku)
    .eq("published", true)
    .maybeSingle();

  if (error) throw error;
  const price = Number(data?.variant_price);
  if (!data || !Number.isFinite(price) || price <= 0) return null;
  return { ...def, name: data.title || def.name, price };
}
