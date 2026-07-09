import { Link, useLocation } from "wouter";
import { Compass, Heart, History, User, UserCircle, PlusCircle } from "lucide-react";
import { ReactNode } from "react";

export function Shell({ children }: { children: ReactNode }) {
  const [location] = useLocation();

  const desktopNavItems = [
    { href: "/discover", icon: Compass, label: "Discover" },
    { href: "/favorites", icon: Heart, label: "Favourites" },
    { href: "/history", icon: History, label: "History" },
    { href: "/dashboard", icon: User, label: "Dashboard" },
  ];

  const mobileNavItems = [
    ...desktopNavItems,
    { href: "/add-restaurant", icon: PlusCircle, label: "Add" },
  ];

  return (
    <div className="min-h-[100dvh] flex flex-col md:flex-row">

      {/* ── Desktop Sidebar ─────────────────────────────────────────────── */}
      <aside
        className="hidden md:flex w-64 flex-col p-6 gap-8 shrink-0 bg-sidebar/60 border-r border-sidebar-border/50 sticky top-0 h-screen overflow-y-auto"
        style={{ backdropFilter: "blur(16px)" }}
      >
        {/* Logo */}
        <Link href="/discover" className="flex items-center gap-3 no-underline outline-none">
          <div className="w-10 h-10 rounded-xl bg-sidebar-primary flex items-center justify-center text-sidebar-primary-foreground shadow-lg border-2 border-white/50">
            <Compass className="w-5 h-5" />
          </div>
          <span className="font-display text-xl text-sidebar-foreground tracking-wide drop-shadow-sm">
            Food Concierge
          </span>
        </Link>

        {/* Nav links */}
        <nav className="flex flex-col gap-1.5 flex-1">
          {desktopNavItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-bold text-sm ${
                  isActive
                    ? "shadow-lg"
                    : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-white/10"
                }`}
                style={
                  isActive
                    ? {
                        background: "linear-gradient(to bottom, #FFEF4D, #FFD800)",
                        color: "hsl(220,45%,12%)",
                        border: "2px solid rgba(255,255,255,0.70)",
                        boxShadow: "0 4px 0 #B89200, 0 6px 14px rgba(0,0,0,0.22)",
                      }
                    : {}
                }
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Separator + Add Restaurant CTA */}
        <div className="flex flex-col gap-3 pt-4 border-t border-sidebar-border/40">
          <Link
            href="/add-restaurant"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-bold text-sm ${
              location === "/add-restaurant"
                ? "bg-white/20 text-sidebar-foreground"
                : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-white/10"
            }`}
          >
            <PlusCircle className="w-5 h-5" />
            <span>List a Restaurant</span>
          </Link>

          <Link
            href="/settings"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-bold text-sm ${
              location === "/settings"
                ? "bg-white/20 text-sidebar-foreground"
                : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-white/10"
            }`}
          >
            <UserCircle className="w-5 h-5" />
            <span>Preferences</span>
          </Link>
        </div>
      </aside>

      {/* ── Main content ────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-h-0 md:min-h-screen relative pb-20 md:pb-0">
        <div className="flex-1 overflow-y-auto p-4 md:p-8 hide-scrollbar">
          {children}
        </div>
      </main>

      {/* ── Mobile Bottom Nav ───────────────────────────────────────────── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 px-2 py-2 flex items-center justify-around z-50 bg-sidebar/80 border-t border-sidebar-border/40"
        style={{
          backdropFilter: "blur(16px)",
          paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))",
        }}
      >
        {mobileNavItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-0.5 p-1.5"
            >
              <div
                className="p-2 rounded-full transition-all duration-200"
                style={
                  isActive
                    ? {
                        background: "linear-gradient(to bottom, #FFEF4D, #FFD800)",
                        border: "2px solid rgba(255,255,255,0.70)",
                        boxShadow: "0 3px 0 #B89200",
                      }
                    : {}
                }
              >
                <item.icon
                  className={`w-4 h-4 ${isActive ? "" : "text-sidebar-foreground/50"}`}
                  style={isActive ? { color: "hsl(220,45%,12%)" } : {}}
                />
              </div>
              <span
                className={`text-[9px] font-bold ${
                  isActive ? "text-sidebar-primary" : "text-sidebar-foreground/50"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
