import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Award, Loader2, ShieldCheck, Printer } from "lucide-react";

export default function CertificatePage() {
  const { code = "" } = useParams();
  const [cert, setCert] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    supabase.from("certificates").select("*").eq("certificate_code", code).maybeSingle()
      .then(({ data }) => { setCert(data); setLoading(false); });
  }, [code]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="animate-spin text-gold" /></div>;
  if (!cert) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background text-center p-6">
      <SEO title="Certificate not found" path={`/certificate/${code}`} />
      <h1 className="font-display text-3xl font-bold">Certificate not found</h1>
      <p className="text-muted-foreground">This code does not match any issued certificate.</p>
      <Button asChild variant="gold"><Link to="/academy">Back to Academy</Link></Button>
    </div>
  );

  const revoked = !!cert.revoked_at;
  return (
    <div className="min-h-screen bg-background text-foreground p-6 print:p-0 print:bg-white">
      <SEO title={`Certificate ${cert.certificate_code}`} path={`/certificate/${code}`} />
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6 print:hidden">
          <Link to="/academy" className="text-xs uppercase tracking-widest text-gold">← Academy</Link>
          <Button variant="glass" size="sm" onClick={() => window.print()}><Printer className="h-4 w-4" /> Print / Save PDF</Button>
        </div>
        <div className="glass-strong rounded-3xl border-2 border-gold/40 p-10 md:p-16 relative print:border-black print:bg-white print:text-black">
          <div className="absolute inset-0 pointer-events-none opacity-10 flex items-center justify-center">
            <Award className="w-96 h-96 text-gold" />
          </div>
          <div className="relative text-center">
            <div className="text-xs uppercase tracking-[0.5em] text-gold">Martial X Academy · RedZone Security</div>
            <h1 className="font-display text-3xl md:text-5xl font-bold mt-6">Certificate of Completion</h1>
            <p className="mt-8 text-muted-foreground print:text-gray-700">This certifies that</p>
            <div className="font-display text-3xl md:text-4xl font-bold mt-2 text-gradient-gold print:text-black">{cert.recipient_name}</div>
            <p className="mt-6 text-muted-foreground print:text-gray-700">has successfully completed the course</p>
            <div className="font-display text-xl md:text-2xl font-bold mt-2">{cert.course_title}</div>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-8 text-sm">
              <div><div className="text-[10px] uppercase tracking-widest text-muted-foreground">Issued</div><div>{new Date(cert.issued_at).toLocaleDateString()}</div></div>
              <div><div className="text-[10px] uppercase tracking-widest text-muted-foreground">Certificate ID</div><div className="font-tactical">{cert.certificate_code}</div></div>
            </div>
            {revoked && <div className="mt-6 text-destructive uppercase tracking-widest text-sm">Revoked on {new Date(cert.revoked_at).toLocaleDateString()}</div>}
            <div className="mt-10 flex items-center justify-center gap-2 text-xs text-muted-foreground print:text-gray-700">
              <ShieldCheck className="h-4 w-4 text-gold" /> Verify at /certificate/{cert.certificate_code}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
