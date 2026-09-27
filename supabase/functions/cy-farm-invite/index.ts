import { withSupabase } from "npm:@supabase/server";

const headers = {
  "Access-Control-Allow-Origin": "https://martial.resofit.fit",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

export default {
  fetch: withSupabase({ auth: "user" }, async (req, ctx) => {
    if (req.method === "OPTIONS") return new Response("ok", { headers });
    const actorId = ctx.userClaims?.sub;
    if (!actorId) return Response.json({ ok: false, error: "Authentication required." }, { status: 401, headers });

    const { data: adminRole } = await ctx.supabase.from("user_roles").select("role").eq("user_id", actorId).eq("role", "admin").maybeSingle();
    if (!adminRole) return Response.json({ ok: false, error: "Only authorized ResoFlex administrators can issue CY Farm invitations." }, { status: 403, headers });

    const body = await req.json().catch(() => ({}));
    const email = String(body.email || "").trim().toLowerCase();
    const accessRole = String(body.access_role || "client").trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return Response.json({ ok: false, error: "A valid email address is required." }, { status: 400, headers });
    if (!["owner", "client", "operations", "supervisor", "executive"].includes(accessRole)) return Response.json({ ok: false, error: "Invalid farm access role." }, { status: 400, headers });

    const { data: client, error: clientError } = await ctx.supabaseAdmin.from("farm_clients").select("id,name,code").eq("code", "CY").eq("status", "active").maybeSingle();
    if (clientError || !client) return Response.json({ ok: false, error: "CY Farm client tenant is not configured." }, { status: 500, headers });

    const { data: pending } = await ctx.supabaseAdmin.from("farm_invitations").select("id,status,expires_at").eq("client_id", client.id).ilike("email", email).in("status", ["pending", "sent"]).maybeSingle();
    if (pending && new Date(pending.expires_at) > new Date()) return Response.json({ ok: false, error: "A CY Farm invitation is already active for this email." }, { status: 409, headers });

    const { data: invitation, error: invitationError } = await ctx.supabaseAdmin.from("farm_invitations").insert({ client_id: client.id, email, access_role: accessRole, invited_by: actorId, status: "pending" }).select("id,expires_at").single();
    if (invitationError || !invitation) return Response.json({ ok: false, error: invitationError?.message || "Could not create invitation registry record." }, { status: 500, headers });

    const { data: invited, error: inviteError } = await ctx.supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      redirectTo: "https://martial.resofit.fit/cy-farm",
      data: { farm_client_code: "CY", farm_access_role: accessRole, invitation_id: invitation.id },
    });
    if (inviteError || !invited?.user) {
      await ctx.supabaseAdmin.from("farm_invitations").update({ status: "failed" }).eq("id", invitation.id);
      return Response.json({ ok: false, error: inviteError?.message || "Supabase invitation could not be sent." }, { status: 502, headers });
    }

    const { error: accessError } = await ctx.supabaseAdmin.from("farm_user_access").insert({ user_id: invited.user.id, client_id: client.id, access_role: accessRole, active: true });
    if (accessError) {
      await ctx.supabaseAdmin.from("farm_invitations").update({ status: "failed", auth_user_id: invited.user.id }).eq("id", invitation.id);
      return Response.json({ ok: false, error: "Invitation was created but tenant access binding failed; reconcile before resending." }, { status: 500, headers });
    }

    await ctx.supabaseAdmin.from("farm_invitations").update({ status: "sent", auth_user_id: invited.user.id }).eq("id", invitation.id);
    return Response.json({ ok: true, invitation_id: invitation.id, client_id: client.id, access_role: accessRole, email }, { headers });
  }),
};
