import { Link } from "wouter";
import {
  Compass,
  Search,
  ListChecks,
  Leaf,
  Heart,
  UtensilsCrossed,
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-[100dvh] flex flex-col selection:bg-primary/30">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="px-6 py-5 flex justify-between items-center max-w-6xl mx-auto w-full">
        <Link href="/" className="flex items-center gap-3 no-underline outline-none">
          <div className="w-11 h-11 rounded-2xl bg-primary flex items-center justify-center shadow-lg border-2 border-white/60">
            <Compass className="w-6 h-6 text-primary-foreground" />
          </div>
          <span className="font-display text-2xl text-white drop-shadow-sm tracking-wide">
            Food Concierge
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/add-restaurant"
            className="text-sm font-bold text-white/90 hover:text-white transition-colors px-4 py-2 rounded-full hover:bg-white/10"
          >
            List a Restaurant
          </Link>
          <Link href="/discover" className="btn-jelly text-sm px-5 py-2.5 rounded-full gap-1.5">
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
              <UtensilsCrossed className="w-4 h-4 text-primary" />
              <span>Survey-based restaurant finder</span>
            </div>

            <h1 className="font-display text-5xl md:text-7xl text-white leading-tight drop-shadow-lg">
              Don't know what to eat?{" "}
              <span
                className="text-primary"
                style={{ textShadow: "0 3px 0 rgba(0,0,0,0.20)" }}
              >
                Let's fix&nbsp;that.
              </span>
            </h1>

            <p className="text-lg md:text-xl text-white/80 font-medium max-w-lg leading-relaxed">
              Answer a few quick questions about dining occasion, vibe, cuisine,
              budget, and distance. We'll filter through Malaysia's best
              restaurants and recommend the perfect spot for you.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mt-2">
              <Link href="/discover" className="btn-jelly text-lg px-8 py-4 rounded-2xl gap-2">
                <Search className="w-5 h-5" />
                Find a Restaurant
              </Link>
              <Link
                href="/add-restaurant"
                className="glass text-white text-center text-lg font-bold px-8 py-4 rounded-2xl hover:bg-white/25 transition-all"
              >
                List a Restaurant
              </Link>
            </div>
          </div>

          {/* Right: how it works card */}
          <div className="relative">
            {/* glow */}
            <div className="absolute inset-0 bg-primary/20 rounded-3xl blur-3xl transform rotate-3 scale-110 pointer-events-none" />

            {/* frame — thick semi-transparent blue border */}
            <div
              className="relative rounded-3xl p-1.5"
              style={{
                background: "rgba(255,255,255,0.15)",
                border: "4px solid rgba(255,255,255,0.40)",
              }}
            >
              <div className="bg-card rounded-2xl p-6 md:p-8 shadow-2xl">
                <h3 className="font-bold text-lg text-card-foreground mb-5">
                  How it works
                </h3>
                <div className="flex flex-col gap-4">
                  <Step
                    number={1}
                    title="Answer the survey"
                    desc="Pick occasion, vibe, cuisine, budget, and distance."
                  />
                  <Step
                    number={2}
                    title="Set your preferences"
                    desc="Halal, vegetarian, spice level, and allergies are saved in Settings / Preferences."
                  />
                  <Step
                    number={3}
                    title="Get matched"
                    desc="We filter the best restaurants for you."
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Feature cards ──────────────────────────────────────────────────── */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-6">
          <FeatureCard
            icon={ListChecks}
            title="Survey-Based Matching"
            description="Pick occasion, vibe, cuisine, budget, and distance. We narrow the list to the best fits."
            iconClass="bg-primary text-primary-foreground"
          />
          <FeatureCard
            icon={Leaf}
            title="Dietary Preferences"
            description="Set halal, vegetarian, spice tolerance, and allergies once. We apply them to every recommendation."
            iconClass="bg-accent text-accent-foreground"
          />
          <FeatureCard
            icon={Heart}
            title="History & Favorites"
            description="Save restaurants you love and revisit your past recommendations in Favorites and History."
            iconClass="bg-secondary text-secondary-foreground"
          />
        </div>
      </main>
    </div>
  );
}

function Step({
  number,
  title,
  desc,
}: {
  number: number;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm shrink-0 border-2 border-white/60">
        {number}
      </div>
      <div>
        <h4 className="font-bold text-card-foreground">{title}</h4>
        <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
      </div>
    </div>
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
      <div
        className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-md ${iconClass}`}
      >
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="text-xl font-bold text-card-foreground">{title}</h3>
      <p className="text-muted-foreground font-medium leading-relaxed text-sm">
        {description}
      </p>
    </div>
  );
}
