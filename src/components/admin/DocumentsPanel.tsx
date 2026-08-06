import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Download, Loader2, ShieldCheck, Upload } from "lucide-react";
import {
  DOC_TYPES,
  MAX_DOC_BYTES,
  getDocumentUrl,
  listDocuments,
  reviewDocument,
  uploadDocument,
  type ApplicantDocument,
} from "@/lib/recruitmentOps";

const selectCls =
  "mt-1.5 flex h-10 w-full rounded-md border border-input bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

export const DocumentsPanel = ({
  applicationId,
  canReview = false,
}: {
  applicationId: string;
  canReview?: boolean;
}) => {
  const [docs, setDocs] = useState<ApplicantDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [docType, setDocType] = useState<string>(DOC_TYPES[0]);
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = () =>
    listDocuments(applicationId)
      .then(setDocs)
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));

  useEffect(() => {
    setLoading(true);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicationId]);

  const onFile = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    setProgress(5);
    try {
      await uploadDocument({ applicationId, docType, file, onProgress: setProgress });
      toast.success(`${docType} uploaded`);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
      setProgress(0);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const open = async (doc: ApplicantDocument) => {
    try {
      const url = await getDocumentUrl(doc.file_path);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not open document");
    }
  };

  return (
    <div className="space-y-5 pt-4">
      <div className="glass rounded-xl p-4">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-2">
          <ShieldCheck className="h-3 w-3 text-gold" /> Secure upload — private storage, signed links only
        </div>
        <Label htmlFor="doc-type">Document type</Label>
        <select id="doc-type" className={selectCls} value={docType} onChange={(e) => setDocType(e.target.value)}>
          {DOC_TYPES.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <input
          ref={fileRef}
          id="doc-file"
          type="file"
          className="mt-3 block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-2 file:text-sm"
          accept=".pdf,.doc,.docx,image/*"
          disabled={busy}
          onChange={(e) => onFile(e.target.files?.[0])}
          aria-label="Choose document to upload"
        />
        <p className="text-[11px] text-muted-foreground mt-2">
          PDF, Word or image · max {Math.round(MAX_DOC_BYTES / 1024 / 1024)}MB
        </p>
        {busy && (
          <div className="mt-3 flex items-center gap-3">
            <Progress value={progress} className="h-2" />
            <Upload className="h-4 w-4 text-gold animate-pulse" />
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="animate-spin text-gold" /></div>
      ) : docs.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">No documents uploaded yet.</p>
      ) : (
        <ul className="space-y-2">
          {docs.map((d) => (
            <li key={d.id} className="glass rounded-xl p-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-medium truncate">{d.file_name}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {d.doc_type} · v{d.version} · {(d.size_bytes / 1024).toFixed(0)} KB ·{" "}
                    {new Date(d.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={d.status === "approved" ? "default" : d.status === "rejected" ? "destructive" : "secondary"}
                    className="text-[10px] uppercase"
                  >
                    {d.status}
                  </Badge>
                  <Button size="sm" variant="glass" onClick={() => open(d)}>
                    <Download /> View
                  </Button>
                </div>
              </div>
              {d.review_notes && <p className="text-xs text-muted-foreground mt-1">{d.review_notes}</p>}
              {canReview && d.status === "pending" && (
                <div className="flex gap-2 mt-2">
                  <Button
                    size="sm"
                    variant="gold"
                    onClick={async () => {
                      await reviewDocument(d.id, "approved");
                      toast.success("Document approved");
                      load();
                    }}
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={async () => {
                      const reason = window.prompt("Rejection reason");
                      if (!reason) return;
                      await reviewDocument(d.id, "rejected", reason);
                      toast.success("Document rejected");
                      load();
                    }}
                  >
                    Reject
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
