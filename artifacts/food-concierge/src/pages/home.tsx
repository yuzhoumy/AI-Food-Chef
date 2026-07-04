import { Link } from "wouter";
import { Compass, Sparkles, MapPin, Zap, Heart } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-[100dvh] flex flex-col selection:bg-primary/30">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="px-6 py-5 flex justify-between items-center max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-primary flex items-center justify-center shadow-lg border-2 border-white/60">
            <Compass className="w-6 h-6 text-primary-foreground" />
          </div>
          <span className="font-display text-2xl text-white drop-shadow-sm tracking-wide">
            Food Concierge
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/sign-in"
            className="text-sm font-bold text-white/90 hover:text-white transition-colors px-4 py-2 rounded-full hover:bg-white/10"
          >
            Log In
          </Link>
          <Link href="/sign-up" className="btn-jelly text-sm px-5 py-2.5 rounded-full gap-1.5">
            Get Started
          </Link>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col max-w-6xl mx-auto w-full px-6 py-10 md:py-20">
        <div className="grid md:grid-cols-2 gap-12 md:gap-20 items-center">

          {/* Left: copy */}
          <div className="flex flex-col gap-6 md:gap-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-white font-bold text-sm w-fit">
              <Sparkles className="w-4 h-4 text-primary" />
              <span>Your local food companion</span>
            </div>

            <h1 className="font-display text-5xl md:text-7xl text-white leading-tight drop-shadow-lg">
              Don't know what to eat?{" "}
              <span className="text-primary" style={{ textShadow: "0 3px 0 rgba(0,0,0,0.20)" }}>
                Let's fix&nbsp;that.
              </span>
            </h1>

            <p className="text-lg md:text-xl text-white/80 font-medium max-w-lg leading-relaxed">
              Tell us how you're feeling, what you're craving, or where you're at.
              We'll find the perfect spot in Malaysia, instantly. No more scrolling
              through endless lists.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mt-2">
              <Link href="/sign-up" className="btn-jelly text-lg px-8 py-4 rounded-2xl gap-2">
                <Sparkles className="w-5 h-5" />
                Start Discovering
              </Link>
              <Link
                href="/sign-in"
                className="glass text-white text-center text-lg font-bold px-8 py-4 rounded-2xl hover:bg-white/25 transition-all"
              >
                I have an account
              </Link>
            </div>
          </div>

          {/* Right: chat preview card */}
          <div className="relative">
            {/* glow */}
            <div className="absolute inset-0 bg-primary/20 rounded-3xl blur-3xl transform rotate-3 scale-110 pointer-events-none" />

            {/* frame — thick semi-transparent blue border */}
            <div className="relative rounded-3xl p-1.5"
              style={{ background: "rgba(255,255,255,0.15)", border: "4px solid rgba(255,255,255,0.40)" }}>
              <div className="bg-card rounded-2xl p-6 md:p-8 shadow-2xl">
                <div className="flex flex-col gap-6">
                  {/* User message */}
                  <div className="flex gap-4 items-end">
                    <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center shrink-0 border-2 border-white/60 text-white">
                      <UserIcon />
                    </div>
                    <div className="bg-muted px-5 py-4 rounded-2xl rounded-bl-none text-card-foreground font-medium text-sm">
                      "I'm super stressed from work and just want some spicy comfort food. Nothing too fancy."
                    </div>
                  </div>

                  {/* AI reply */}
                  <div className="flex gap-4 items-end flex-row-reverse">
                    <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shrink-0 border-2 border-white/60 shadow-md text-primary-foreground">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <div
                      className="px-5 py-4 rounded-2xl rounded-br-none flex flex-col gap-3 max-w-[80%]"
                      style={{ background: "hsl(100,18%,90%)", border: "2px solid hsl(100,22%,74%)" }}
                    >
                      <p className="text-card-foreground font-medium text-sm">
                        I've got you. How about{" "}
                        <strong className="text-accent">Village Park Restaurant</strong>?
                      </p>
                      <div className="bg-white rounded-xl p-3 border border-card-border shadow-sm">
                        <h4 className="font-bold text-sm text-card-foreground">Village Park Restaurant</h4>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                          Their legendary Nasi Lemak Ayam Goreng is the ultimate spicy comfort food.
                        </p>
                        <div className="flex gap-2 mt-2">
                          <span className="text-[10px] font-bold px-2 py-1 rounded-md"
                            style={{ background: "hsl(100,18%,88%)", color: "hsl(100,30%,28%)" }}>
                            RM15–RM30
                          </span>
                          <span className="text-[10px] font-bold px-2 py-1 bg-primary/20 rounded-md text-primary-foreground"
                            style={{ color: "hsl(220,45%,12%)" }}>
                            Spicy 🌶
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Feature cards ──────────────────────────────────────────────────── */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-6">
          <FeatureCard
            icon={Zap}
            title="Instant Decisions"
            description="Skip the 30-minute debate. Get one highly curated recommendation based on your exact mood."
            iconClass="bg-primary text-primary-foreground"
          />
          <FeatureCard
            icon={MapPin}
            title="Hyper-Local Context"
            description="Built for Malaysia. We understand local cravings, halal preferences, and real budget ranges."
            iconClass="bg-accent text-accent-foreground"
          />
          <FeatureCard
            icon={Heart}
            title="Learns Your Taste"
            description="The more you use it, the better it gets. We remember your allergies, favourite cuisines, and go-to spots."
            iconClass="bg-secondary text-secondary-foreground"
          />
        </div>
      </main>
    </div>
  );
}

function UserIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z"
        fill="white"
      />
    </svg>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
  iconClass,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  iconClass: string;
}) {
  return (
    <div className="card-watercolor rounded-3xl p-7 shadow-xl flex flex-col gap-4 hover:shadow-2xl transition-all hover:-translate-y-1 duration-200">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-md ${iconClass}`}>
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="text-xl font-bold text-card-foreground">{title}</h3>
      <p className="text-muted-foreground font-medium leading-relaxed text-sm">{description}</p>
    </div>
  );
}
