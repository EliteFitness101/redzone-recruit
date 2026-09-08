import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { ShieldCheck, Printer } from "lucide-react";

type VerificationStatus = "Registered" | "Under Verification" | "Verified" | "Selected" | "Deployed";

const STATUS_COPY: Record<VerificationStatus, string> = {
  Registered: "Profile received. Verification has not been completed.",
  "Under Verification": "Profile is being reviewed. No verification outcome has been issued.",
  Verified: "Required verification checks have been completed and recorded.",
  Selected: "Candidate has been selected for the stated pathway.",
  Deployed: "Candidate has been formally assigned to a deployment record.",
};

const field = "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-amber-400/60";

export default function MartialVerification() {
  const [name, setName] = useState("");
  const [id, setId] = useState("");
  const [state, setState] = useState("Abia State");
  const [lga, setLga] = useState("");
  const [track, setTrack] = useState("Tactical Fitness & Event Protocol");
  const [status, setStatus] = useState<VerificationStatus>("Registered");
  const [verificationDate, setVerificationDate] = useState("");
  const [evidenceRef, setEvidenceRef] = useState("");

  const statusText = useMemo(() => STATUS_COPY[status], [status]);

  return (
    <div className="min-h-screen bg-[#090909] text-white print:bg-white print:text-black">
      <SEO title="Martial-X Verification Profile" path="/verification" noindex description="Internal Martial-X candidate verification profile and print export." />
      <div className="mx-auto max-w-6xl px-5 py-8">
        <div className="mb-6 flex items-center justify-between gap-4 print:hidden">
          <Link to="/" className="text-sm text-amber-400">← Martial-X</Link>
          <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-full bg-amber-400 px-5 py-2.5 font-semibold text-black">
            <Printer className="h-4 w-4" /> Print / Save PDF
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-6 print:hidden">
            <p className="text-xs uppercase tracking-[0.25em] text-amber-400">Verification control</p>
            <h1 className="mt-3 text-2xl font-semibold">Candidate profile</h1>
            <p className="mt-2 text-sm leading-6 text-white/55">Only supplied evidence is displayed as verified. Empty evidence never becomes a positive claim.</p>
            <div className="mt-6 space-y-4">
              <label className="block text-sm">Full name<input className={field} value={name} onChange={(e) => setName(e.target.value)} placeholder="Candidate name" /></label>
              <label className="block text-sm">Document control ID<input className={field} value={id} onChange={(e) => setId(e.target.value)} placeholder="MX-2026-AB-0001" /></label>
              <label className="block text-sm">State<input className={field} value={state} onChange={(e) => setState(e.target.value)} /></label>
              <label className="block text-sm">LGA / Ward<input className={field} value={lga} onChange={(e) => setLga(e.target.value)} placeholder="LGA / Ward" /></label>
              <label className="block text-sm">Track<select className={field} value={track} onChange={(e) => setTrack(e.target.value)}><option>Tactical Fitness & Event Protocol</option><option>Industrial Fabrication & Steel Welding</option><option>Field Sales & Distribution</option><option>Facility Operations & Redzone Security</option></select></label>
              <label className="block text-sm">Status<select className={field} value={status} onChange={(e) => setStatus(e.target.value as VerificationStatus)}>{Object.keys(STATUS_COPY).map((item) => <option key={item}>{item}</option>)}</select></label>
              <label className="block text-sm">Verification date<input type="date" className={field} value={verificationDate} onChange={(e) => setVerificationDate(e.target.value)} /></label>
              <label className="block text-sm">Evidence / record reference<input className={field} value={evidenceRef} onChange={(e) => setEvidenceRef(e.target.value)} placeholder="Optional internal reference" /></label>
            </div>
          </section>

          <article className="rounded-3xl border-2 border-amber-400/30 bg-[#111] p-7 md:p-12 print:border-black print:bg-white">
            <div className="flex items-start justify-between gap-6 border-b border-white/10 pb-7 print:border-black">
              <div><p className="text-xs uppercase tracking-[0.4em] text-amber-400 print:text-black">MARTIAL-X™</p><h2 className="mt-3 text-3xl font-bold">Candidate Verification Profile</h2><p className="mt-2 text-sm text-white/50 print:text-gray-600">Sovereign Industrial & Performance System</p></div>
              <ShieldCheck className="h-10 w-10 text-amber-400 print:text-black" />
            </div>

            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              <div><p className="text-xs uppercase tracking-widest text-white/40 print:text-gray-500">Candidate</p><p className="mt-1 text-xl font-semibold">{name || "Not supplied"}</p></div>
              <div><p className="text-xs uppercase tracking-widest text-white/40 print:text-gray-500">Control ID</p><p className="mt-1 font-mono">{id || "Not supplied"}</p></div>
              <div><p className="text-xs uppercase tracking-widest text-white/40 print:text-gray-500">Location</p><p className="mt-1">{[lga, state].filter(Boolean).join(" · ") || "Not supplied"}</p></div>
              <div><p className="text-xs uppercase tracking-widest text-white/40 print:text-gray-500">Track</p><p className="mt-1">{track}</p></div>
            </div>

            <div className="mt-8 rounded-2xl border border-amber-400/20 bg-amber-400/[0.05] p-5 print:border-black print:bg-gray-100">
              <p className="text-xs uppercase tracking-widest text-amber-400 print:text-black">Current status</p>
              <p className="mt-2 text-2xl font-bold">{status}</p>
              <p className="mt-2 text-sm leading-6 text-white/60 print:text-gray-700">{statusText}</p>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 p-5 print:border-gray-300"><p className="text-xs uppercase tracking-widest text-white/40 print:text-gray-500">Verification date</p><p className="mt-2">{verificationDate || "Not recorded"}</p></div>
              <div className="rounded-2xl border border-white/10 p-5 print:border-gray-300"><p className="text-xs uppercase tracking-widest text-white/40 print:text-gray-500">Evidence reference</p><p className="mt-2 font-mono">{evidenceRef || "Not recorded"}</p></div>
            </div>

            <div className="mt-8 border-t border-white/10 pt-6 text-sm leading-6 text-white/50 print:border-gray-300 print:text-gray-700">
              This document reflects the status entered in the Martial-X verification control. Registration alone is not employment, selection, deployment, NIN verification, physical screening clearance, or any other verification outcome.
            </div>
            <div className="mt-5 text-xs text-white/35 print:text-gray-500">Portal: martial.resofit.fit · Print export generated locally in the browser.</div>
          </article>
        </div>
      </div>
    </div>
  );
}
