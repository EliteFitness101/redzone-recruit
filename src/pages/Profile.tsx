import { useEffect, useState } from "react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { SEO } from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle().then(({ data }) => setProfile(data));
  }, [user]);

  const save = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user || saving) return;
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const { error } = await supabase.from("profiles").update({
      full_name: String(fd.get("full_name") ?? "").slice(0, 80),
      phone: String(fd.get("phone") ?? "").slice(0, 20),
      location: String(fd.get("location") ?? "").slice(0, 80),
    }).eq("id", user.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Profile updated");
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO title="Profile" path="/profile" noindex />
      <Navbar />
      <main className="pt-28 pb-24 container max-w-2xl">
        <h1 className="font-display text-4xl font-bold mb-6">Profile</h1>
        <form onSubmit={save} className="glass-strong rounded-3xl p-8 space-y-4">
          <div>
            <Label>Email</Label>
            <Input value={user?.email ?? ""} disabled className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="p-name">Full name</Label>
            <Input id="p-name" name="full_name" defaultValue={profile?.full_name ?? ""} className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="p-phone">Phone</Label>
            <Input id="p-phone" name="phone" defaultValue={profile?.phone ?? ""} className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="p-loc">Location</Label>
            <Input id="p-loc" name="location" defaultValue={profile?.location ?? ""} className="mt-1.5" />
          </div>
          <Button type="submit" variant="hero" size="lg" disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
        </form>
      </main>
      <Footer />
    </div>
  );
}
