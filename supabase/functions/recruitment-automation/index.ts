// Recruitment automation orchestrator.
// Runs the post-submission workflow for an application:
//  - applicant confirmation email (via Make)
//  - recruiter + admin notifications (in-app)
//  - Make automation trigger
//  - ChatB2K orchestration event
//  - CRM activity creation
//  - follow-up communication sequence enqueue
// Every step is recorded in automation_runs with an idempotency key so retries are safe.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const MAKE_WEBHOOK = 'https://hook.eu1.make.com/p0c26asklninfrxhp2sw6nkdjjb19a89';
const CHATB2K_WEBHOOK = Deno.env.get('CHATB2K_WEBHOOK_URL') ?? '';

type Step = {
  workflow: string;
  channel: string;
  run: (payload: Record<string, unknown>) => Promise<unknown>;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } },
  );

  try {
    const body = await req.json().catch(() => ({}));
    const applicationId = String(body?.application_id ?? '');
    const retryOnly = Boolean(body?.retry_failed);
    if (!applicationId || !/^[0-9a-f-]{36}$/i.test(applicationId)) {
      return json({ error: 'application_id (uuid) is required' }, 400);
    }

    const { data: app, error: appErr } = await admin
      .from('applications')
      .select('*')
      .eq('id', applicationId)
      .maybeSingle();
    if (appErr) throw appErr;
    if (!app) return json({ error: 'application not found' }, 404);

    const payload = {
      application_id: app.id,
      reference_number: app.reference_number,
      full_name: app.full_name,
      email: app.email,
      phone: app.phone,
      location: app.location,
      program: app.program,
      cohort: app.cohort,
      stage: app.stage,
      source: app.source,
      campaign: app.campaign,
      attribution: app.attribution,
      created_at: app.created_at,
    };

    const post = (url: string, event: string) => async (p: Record<string, unknown>) => {
      if (!url) return { skipped: true, reason: 'webhook not configured' };
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event, data: p }),
      });
      const text = await res.text();
      if (!res.ok) throw new Error(`[${res.status}] ${text.slice(0, 400)}`);
      return { status: res.status, body: text.slice(0, 400) };
    };

    const steps: Step[] = [
      {
        workflow: 'applicant_confirmation_email',
        channel: 'email',
        run: post(MAKE_WEBHOOK, 'application.confirmation_email'),
      },
      {
        workflow: 'staff_notification',
        channel: 'in_app',
        run: async (p) => {
          const rows: Record<string, unknown>[] = [{
            audience: 'admin',
            type: 'application_automation',
            title: 'New application processed',
            body: `${p.full_name} — ${p.reference_number}`,
            link: `/admin/applications?app=${p.application_id}`,
            metadata: { application_id: p.application_id },
          }];
          if (app.assigned_recruiter) {
            rows.push({
              audience: 'recruiter',
              recipient: app.assigned_recruiter,
              type: 'application_assigned',
              title: 'Application assigned to you',
              body: `${p.full_name} — ${p.reference_number}`,
              link: `/admin/applications?app=${p.application_id}`,
              metadata: { application_id: p.application_id },
            });
          }
          const { error } = await admin.from('notifications').insert(rows);
          if (error) throw error;
          return { inserted: rows.length };
        },
      },
      { workflow: 'make_automation', channel: 'webhook', run: post(MAKE_WEBHOOK, 'application.created') },
      { workflow: 'chatb2k_orchestration', channel: 'webhook', run: post(CHATB2K_WEBHOOK, 'application.created') },
      {
        workflow: 'crm_activity',
        channel: 'internal',
        run: async (p) => {
          const { error } = await admin.from('application_activity').insert({
            application_id: p.application_id,
            event: 'crm_activity_created',
            notes: 'CRM record synchronised',
            metadata: { reference: p.reference_number },
          });
          if (error) throw error;
          return { created: true };
        },
      },
      {
        workflow: 'follow_up_sequence',
        channel: 'sequence',
        run: post(MAKE_WEBHOOK, 'application.follow_up_sequence'),
      },
    ];

    const results: Record<string, string> = {};

    for (const step of steps) {
      const key = `${step.workflow}:${applicationId}`;
      const { data: existing } = await admin
        .from('automation_runs')
        .select('id, status, attempts')
        .eq('idempotency_key', key)
        .maybeSingle();

      if (existing?.status === 'success') {
        results[step.workflow] = 'already_succeeded';
        continue;
      }
      if (retryOnly && !existing) {
        results[step.workflow] = 'skipped';
        continue;
      }

      const attempts = (existing?.attempts ?? 0) + 1;
      if (!existing) {
        await admin.from('automation_runs').insert({
          application_id: applicationId,
          workflow: step.workflow,
          channel: step.channel,
          idempotency_key: key,
          status: 'running',
          attempts,
          payload,
        });
      } else {
        await admin.from('automation_runs')
          .update({ status: 'running', attempts })
          .eq('id', existing.id);
      }

      try {
        const response = await step.run(payload);
        await admin.from('automation_runs')
          .update({ status: 'success', response, last_error: null })
          .eq('idempotency_key', key);
        results[step.workflow] = 'success';
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        console.error(`automation ${step.workflow} failed:`, message);
        await admin.from('automation_runs')
          .update({ status: attempts >= 3 ? 'failed' : 'retry_pending', last_error: message })
          .eq('idempotency_key', key);
        results[step.workflow] = `failed: ${message.slice(0, 120)}`;
      }
    }

    return json({ ok: true, reference_number: app.reference_number, results });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error('recruitment-automation error:', message);
    return json({ error: message }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
