import { z } from "zod";
import { backendClient, json, requestId } from "../_lib/recruitment";

const schema = z.object({
  full_name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255).optional().or(z.literal("")),
  phone: z.string().trim().min(7).max(30),
  location: z.string().trim().max(150).optional(),
  age: z.number().int().min(16).max(100).nullable().optional(),
  education: z.string().trim().max(200).optional(),
  fitness_level: z.string().trim().max(100).optional(),
  prior_experience: z.string().trim().max(2000).optional(),
  program: z.string().trim().max(200).optional(),
  cohort: z.string().trim().max(100).optional(),
  source: z.string().trim().max(100).optional(),
  campaign: z.string().trim().max(150).optional(),
  attribution: z.record(z.string(), z.unknown()).optional(),
  notes: z.string().trim().max(5000).optional(),
});

export default async function handler(req: Request) {
  const rid = requestId();
  if (req.method !== "POST") return json({ error: "Method not allowed", request_id: rid }, 405);
  try {
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return json({ error: "Invalid application data", request_id: rid }, 400);

    const d = parsed.data;
    const supabase = backendClient();
    const { data, error } = await supabase
      .from("applications")
      .insert({
        full_name: d.full_name,
        email: d.email || null,
        phone: d.phone,
        location: d.location || null,
        age: d.age ?? null,
        education: d.education || null,
        fitness_level: d.fitness_level || null,
        prior_experience: d.prior_experience || null,
        program: d.program || null,
        cohort: d.cohort || null,
        source: d.source || "website",
        campaign: d.campaign || null,
        attribution: d.attribution || {},
        notes: d.notes || null,
        user_id: null,
      })
      .select("id,reference_number")
      .single();

    if (error) {
      console.error("[recruitment-api]", rid, error);
      return json({ error: "Could not create application", request_id: rid }, 500);
    }

    return json({ application: data, request_id: rid }, 201, {
      "x-recruitment-request-id": rid,
    });
  } catch (error) {
    console.error("[recruitment-api]", rid, error);
    return json({ error: "Recruitment API unavailable", request_id: rid }, 503);
  }
}
