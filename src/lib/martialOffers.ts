import { supabase } from "@/integrations/supabase/client";

export type MartialOffer = {
  id: string;
  sku: string;
  name: string;
  desc: string;
  features: string[];
  cta: string;
  variant: "glass" | "hero" | "gold";
  featured?: boolean;
  price: number;
};

function buildOffer(row: { sku: string; title: string; variant_price: number; tags?: string[] | null }, index: number): MartialOffer | null {
  const price = Number(row.variant_price);
  if (!row.sku || !row.title || !Number.isFinite(price) || price <= 0) return null;

  const tags = Array.isArray(row.tags) ? row.tags.map((tag) => String(tag).toLowerCase()) : [];
  const featured = tags.includes("featured") || tags.includes("most-popular");
  const variants = ["glass", "hero", "gold"] as const;
  const variant = variants[index % variants.length];
  const features = tags
    .filter((tag) => tag !== "martial-x" && tag !== "security" && tag !== "training" && tag !== "digital" && tag !== "featured" && tag !== "most-popular")
    .slice(0, 5)
    .map((tag) => tag.replace(/[-_]+/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()));

  return {
    id: row.sku,
    sku: row.sku,
    name: row.title,
    desc: "Martial-X training and recruitment pathway.",
    features: features.length ? features : ["Structured training pathway", "Digital access", "Candidate support"],
    cta: "Continue",
    variant,
    featured,
    price,
  };
}

export async function fetchMartialOffers(): Promise<MartialOffer[]> {
  const { data, error } = await supabase
    .from("products")
    .select("sku,title,variant_price,tags")
    .eq("published", true)
    .contains("tags", ["martial-x"])
    .order("created_at", { ascending: true });

  if (error) throw error;

  return (data ?? [])
    .map((row, index) => buildOffer(row, index))
    .filter((offer): offer is MartialOffer => Boolean(offer));
}

export async function fetchMartialOffer(sku: string): Promise<MartialOffer | null> {
  const normalizedSku = String(sku || "").trim();
  if (!normalizedSku) return null;

  const { data, error } = await supabase
    .from("products")
    .select("sku,title,variant_price,tags")
    .eq("sku", normalizedSku)
    .eq("published", true)
    .contains("tags", ["martial-x"])
    .maybeSingle();

  if (error) throw error;
  return data ? buildOffer(data, 0) : null;
}
