import { Link, useLocation } from "wouter";
import { Home, Compass, Heart, History, User, UserCircle } from "lucide-react";
import { ReactNode } from "react";

export function Shell({ children }: { children: ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { href: "/discover", icon: Compass, label: "Discover" },
    { href: "/favorites", icon: Heart, label: "Favorites" },
    { href: "/history", icon: History, label: "History" },
    { href: "/dashboard", icon: User, label: "Dashboard" },
  ];

  return (
    <div className="min-h-[100dvh] flex flex-col md:flex-row bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-card p-6 gap-8">
        <Link href="/discover" className="flex items-center gap-3 no-underline outline-none">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-sm">
            <Compass className="w-6 h-6" />
          </div>
          <span className="font-bold text-xl text-foreground tracking-tight">Concierge</span>
        </Link>

        <nav className="flex flex-col gap-2 flex-1">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="pt-4 border-t border-border mt-auto">
          <Link
            href="/settings"
            className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <UserCircle className="w-5 h-5" />
            <span>Preferences</span>
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col max-w-5xl mx-auto w-full min-h-0 md:min-h-screen relative pb-20 md:pb-0">
        <div className="flex-1 overflow-y-auto p-4 md:p-8 hide-scrollbar">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border px-6 py-3 flex items-center justify-between z-50 pb-[env(safe-area-inset-bottom,16px)]">
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 p-2 ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <div className={`p-1.5 rounded-full transition-colors ${isActive ? "bg-primary/10" : ""}`}>
                <item.icon className={`w-6 h-6 ${isActive ? "fill-primary/20" : ""}`} />
              </div>
              <span className="text-[10px] font-semibold">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
