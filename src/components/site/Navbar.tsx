import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Shield, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { track } from "@/lib/analytics";

const links = [
  { to: "/academy", label: "Academy" },
  { to: "/apply", label: "Recruitment" },
  { to: "/pricing", label: "Pricing" },
  { to: "/#testimonials", label: "Stories" },
  { to: "/#faq", label: "FAQ" },
  { to: "/contact", label: "Contact" },
];

export const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { session } = useAuth();
  const loc = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [loc.pathname]);

  return (
    <header className={cn("fixed top-0 inset-x-0 z-50 transition-all duration-500", scrolled ? "py-2" : "py-4")}>
      <div className="container">
        <nav className={cn("flex items-center justify-between rounded-2xl px-4 md:px-6 py-3 transition-all duration-500", scrolled ? "glass-strong" : "glass")}>
          <Link to="/" className="flex items-center gap-2 group" aria-label="Martial X home">
            <div className="relative h-9 w-9 rounded-lg bg-gradient-red flex items-center justify-center shadow-red">
              <Shield className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
            </div>
            <div className="leading-tight">
              <div className="font-display font-bold text-base tracking-wider">
                MARTIAL <span className="text-gradient-gold">X</span>
              </div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">× RedZone Security</div>
            </div>
          </Link>

          <ul className="hidden lg:flex items-center gap-8">
            {links.map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="text-sm font-medium text-muted-foreground hover:text-gold transition-colors">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="hidden lg:flex items-center gap-3">
            {session ? (
              <Button variant="glass" size="sm" asChild>
                <Link to="/dashboard"><User className="h-4 w-4" /> Dashboard</Link>
              </Button>
            ) : (
              <Button variant="glass" size="sm" asChild>
                <Link to="/login" onClick={() => track("cta_click", { source: "nav_signin" })}>Sign In</Link>
              </Button>
            )}
            <Button variant="hero" size="sm" asChild>
              <Link to="/pricing" onClick={() => track("cta_click", { source: "nav_train" })}>Start Training</Link>
            </Button>
          </div>

          <button className="lg:hidden p-2 text-foreground" onClick={() => setOpen(v => !v)} aria-label="Toggle menu" aria-expanded={open}>
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </nav>

        {open && (
          <div className="lg:hidden mt-2 glass-strong rounded-2xl p-4 animate-fade-in">
            <ul className="flex flex-col gap-1">
              {links.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="block px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-gold">
                    {l.label}
                  </Link>
                </li>
              ))}
              {session && (
                <li><Link to="/dashboard" className="block px-3 py-2 rounded-lg text-sm text-gold">Dashboard</Link></li>
              )}
            </ul>
            <div className="grid grid-cols-2 gap-2 mt-3">
              <Button variant="glass" size="sm" asChild>
                <Link to={session ? "/dashboard" : "/login"}>{session ? "Account" : "Sign In"}</Link>
              </Button>
              <Button variant="hero" size="sm" asChild>
                <Link to="/pricing">Train</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
