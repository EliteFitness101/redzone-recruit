import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Shield, User, ChevronDown, Sprout } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { track } from "@/lib/analytics";

type NavItem = { to: string; label: string };

const links: NavItem[] = [
  { to: "/academy", label: "Academy" },
  { to: "/apply", label: "Recruitment" },
  { to: "/pricing", label: "Pricing" },
  { to: "/#testimonials", label: "Stories" },
  { to: "/#faq", label: "FAQ" },
  { to: "/contact", label: "Contact" },
];

const farmLinks: NavItem[] = [
  { to: "/recruit", label: "Farm Recruitment" },
  { to: "/admin/farm-command-center", label: "Farm Command Center" },
  { to: "/admin/farm-command-center/workforce", label: "Workforce" },
  { to: "/admin/farm-command-center/gaps", label: "Workforce Gaps" },
  { to: "/admin/farm-command-center/productivity", label: "Productivity" },
  { to: "/admin/farm-command-center/recruitment", label: "Recruitment Requests" },
  { to: "/admin/farm-command-center/candidates", label: "Candidates" },
  { to: "/admin/farm-command-center/placements", label: "Placements" },
  { to: "/admin/farm-command-center/performance", label: "Performance" },
  { to: "/admin/farm-command-center/actions", label: "Action Queue" },
  { to: "/admin/farm-command-center/reports", label: "Executive Reports" },
  { to: "/admin/farm-command-center/supervisor", label: "Supervisor Console" },
  { to: "/login?next=%2Fadmin%2Ffarm-command-center", label: "Client Login" },
];

type MenuPlacement = "below-right" | "below-left" | "above-right" | "above-left";

type PrimaryNavItem = NavItem | { kind: "farms" };

const getPlacement = (rect: DOMRect): MenuPlacement => {
  const menuWidth = 288;
  const menuHeight = Math.min(640, window.innerHeight - 32);
  const spaceRight = window.innerWidth - rect.right;
  const spaceLeft = rect.left;
  const below = window.innerHeight - rect.bottom;
  const above = rect.top;

  const horizontal: "left" | "right" =
    spaceRight >= menuWidth || spaceRight >= spaceLeft ? "right" : "left";
  const vertical: "below" | "above" =
    below >= menuHeight || below >= above ? "below" : "above";

  return `${vertical}-${horizontal}` as MenuPlacement;
};

const isActivePath = (to: string, pathname: string) =>
  to.split("?")[0].split("#")[0] === pathname;

const primaryNav: PrimaryNavItem[] = links.flatMap((item) =>
  item.to === "/#faq" ? [{ kind: "farms" as const }, item] : [item]
);

const NavLink = ({ item, pathname, mobile = false, onNavigate }: {
  item: NavItem;
  pathname: string;
  mobile?: boolean;
  onNavigate?: () => void;
}) => (
  <Link
    to={item.to}
    onClick={onNavigate}
    className={cn(
      mobile
        ? "block rounded-lg px-3 py-2 text-sm font-medium"
        : "text-sm font-medium",
      isActivePath(item.to, pathname)
        ? "text-gold"
        : "text-muted-foreground hover:text-gold transition-colors"
    )}
  >
    {item.label}
  </Link>
);

export const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [farmsOpen, setFarmsOpen] = useState(false);
  const [placement, setPlacement] = useState<MenuPlacement>("below-right");
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({});
  const farmsCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const farmsRef = useRef<HTMLLIElement>(null);
  const { session, roles } = useAuth();
  const isAdmin = roles.includes("admin");
  const loc = useLocation();

  const cancelFarmsClose = () => {
    if (farmsCloseTimer.current) {
      clearTimeout(farmsCloseTimer.current);
      farmsCloseTimer.current = null;
    }
  };

  const closeFarmsSoon = () => {
    cancelFarmsClose();
    farmsCloseTimer.current = setTimeout(() => setFarmsOpen(false), 160);
  };

  const updateMenuPosition = () => {
    const el = farmsRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const nextPlacement = getPlacement(rect);
    setPlacement(nextPlacement);

    const menuWidth = 288;
    const menuHeight = Math.min(640, window.innerHeight - 32);
    const gap = 8;
    const top =
      nextPlacement.startsWith("below")
        ? Math.min(window.innerHeight - menuHeight - 16, rect.bottom + gap)
        : Math.max(16, rect.top - menuHeight - gap);
    const left =
      nextPlacement.endsWith("right")
        ? Math.min(window.innerWidth - menuWidth - 16, Math.max(16, rect.right - menuWidth))
        : Math.max(16, Math.min(window.innerWidth - menuWidth - 16, rect.left));

    setMenuStyle({ top, left, width: menuWidth, maxHeight: menuHeight });
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", updateMenuPosition);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", updateMenuPosition);
    };
  }, []);

  useEffect(() => {
    setOpen(false);
    setFarmsOpen(false);
    cancelFarmsClose();
  }, [loc.pathname]);

  useEffect(() => () => cancelFarmsClose(), []);

  useEffect(() => {
    if (!farmsOpen) return;
    updateMenuPosition();
  }, [farmsOpen]);

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
            {primaryNav.map((item, index) =>
              "kind" in item ? (
                <li
                  key={item.kind + index}
                  ref={farmsRef}
                  className="shrink-0"
                  onMouseEnter={() => { cancelFarmsClose(); setFarmsOpen(true); updateMenuPosition(); }}
                  onMouseLeave={closeFarmsSoon}
                >
                  <button
                    type="button"
                    className={cn(
                      "inline-flex items-center gap-1.5 text-sm font-medium transition-colors",
                      farmsOpen ? "text-gold" : "text-muted-foreground hover:text-gold"
                    )}
                    aria-haspopup="menu"
                    aria-expanded={farmsOpen}
                    onFocus={() => { cancelFarmsClose(); setFarmsOpen(true); updateMenuPosition(); }}
                    onClick={() => {
                      cancelFarmsClose();
                      setFarmsOpen(v => !v);
                      updateMenuPosition();
                    }}
                  >
                    <Sprout className="h-4 w-4" /> Farms
                    <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", farmsOpen && "rotate-180")} />
                  </button>
                </li>
              ) : (
                <li key={item.to} className="shrink-0">
                  <NavLink item={item} pathname={loc.pathname} />
                </li>
              )
            )}
          </ul>

          <div className="hidden lg:flex items-center gap-3">
            {session ? (
              <Button variant="glass" size="sm" asChild>
                <Link to={isAdmin ? "/admin" : "/dashboard"}><User className="h-4 w-4" /> {isAdmin ? "Admin" : "Dashboard"}</Link>
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

        {farmsOpen && (
          <div
            role="menu"
            className={cn(
              "fixed rounded-2xl border border-white/10 bg-background/95 backdrop-blur-xl p-2 shadow-2xl overflow-y-auto",
              "animate-fade-in"
            )}
            style={menuStyle}
            onMouseEnter={cancelFarmsClose}
            onMouseLeave={closeFarmsSoon}
          >
            <div className="px-3 py-2 text-[11px] uppercase tracking-wider text-muted-foreground">CY Farm</div>
            {farmLinks.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                role="menuitem"
                onClick={() => setFarmsOpen(false)}
                className="block rounded-xl px-3 py-2.5 text-sm hover:bg-secondary hover:text-gold"
              >
                {item.label}
              </Link>
            ))}
          </div>
        )}

        {open && (
          <div className="lg:hidden mt-2 glass-strong rounded-2xl p-4 animate-fade-in">
            <ul className="flex flex-col gap-1">
              {primaryNav.map((item, index) =>
                "kind" in item ? (
                  <li key={item.kind + index} className="rounded-xl border border-white/10 bg-white/[.02]">
                    <button
                      type="button"
                      className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-sm font-semibold text-gold"
                      aria-expanded={farmsOpen}
                      onClick={() => setFarmsOpen(v => !v)}
                    >
                      <span className="flex items-center gap-2"><Sprout className="h-4 w-4" /> Farms</span>
                      <ChevronDown className={cn("h-4 w-4 transition-transform", farmsOpen && "rotate-180")} />
                    </button>
                    {farmsOpen && (
                      <div className="border-t border-white/10 px-2 py-2">
                        {farmLinks.map((farmItem) => (
                          <NavLink
                            key={farmItem.to}
                            item={farmItem}
                            pathname={loc.pathname}
                            mobile
                            onNavigate={() => { setOpen(false); setFarmsOpen(false); }}
                          />
                        ))}
                      </div>
                    )}
                  </li>
                ) : (
                  <li key={item.to}>
                    <NavLink item={item} pathname={loc.pathname} mobile onNavigate={() => setOpen(false)} />
                  </li>
                )
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
