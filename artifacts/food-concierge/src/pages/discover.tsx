import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useGetUserPreferences, useGetRecommendation } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, Users, User, Heart } from "lucide-react";
import { useAppState } from "@/store/app-state";
import { Shell } from "@/components/shell";
import { useToast } from "@/hooks/use-toast";

// ── Types ──────────────────────────────────────────────────────────────────

type DiningOccasion = "solo" | "date" | "family";
type Vibe = "Casual" | "Quiet" | "Romantic" | "Outdoor" | "Lively" | "Cozy";

const DINING_OCCASIONS: { value: DiningOccasion; label: string; icon: React.ElementType }[] = [
  { value: "solo", label: "Solo", icon: User },
  { value: "date", label: "Date", icon: Heart },
  { value: "family", label: "Family", icon: Users },
];

const VIBES: Vibe[] = ["Casual", "Quiet", "Romantic", "Outdoor", "Lively", "Cozy"];

const CUISINES = [
  "Malay", "Chinese", "Indian", "Mamak", "Japanese",
  "Korean", "Thai", "Western", "Italian", "Middle Eastern",
];

// ── Helpers ────────────────────────────────────────────────────────────────

function priceLabel(value: number): string {
  if (value <= 15) return `Up to RM${value}`;
  if (value <= 30) return `Up to RM${value}`;
  return "RM30 and above";
}

function priceToBudget(value: number): string {
  if (value <= 15) return "RM5-RM15";
  if (value <= 30) return "RM15-RM30";
  return "RM30+";
}

function distanceLabel(value: number): string {
  return `Within ${value} km`;
}

// ── Section wrapper ────────────────────────────────────────────────────────

function Section({ step, title, children }: { step: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <span
          className="w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center shrink-0 border-2 border-white/60"
          style={{
            background: "linear-gradient(to bottom, #FFEF4D, #FFD800)",
            color: "hsl(220,45%,12%)",
            boxShadow: "0 3px 0 #B89200",
          }}
        >
          {step}
        </span>
        <h2 className="text-base font-bold text-white tracking-tight drop-shadow-sm">{title}</h2>
      </div>
      {children}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export default function Discover() {
  const [, setLocation] = useLocation();
  const { data: preferences, isLoading: prefsLoading } = useGetUserPreferences();
  const getRecommendation = useGetRecommendation();
  const { setCurrentRequest, setLastResult } = useAppState();
  const { toast } = useToast();

  const [occasion, setOccasion] = useState<DiningOccasion | null>(null);
  const [vibe, setVibe] = useState<Vibe | null>(null);
  const [cuisine, setCuisine] = useState<string | null>(null);
  const [price, setPrice] = useState(30);
  const [distance, setDistance] = useState(10);

  useEffect(() => {
    if (preferences && !preferences.onboardingCompleted) {
      setLocation("/onboarding");
    }
  }, [preferences, setLocation]);

  const handleSubmit = () => {
    const parts: string[] = [];
    if (occasion === "solo") parts.push("solo meal");
    else if (occasion === "date") parts.push("date night");
    else if (occasion === "family") parts.push("family outing");
    if (vibe) parts.push(`${vibe.toLowerCase()} atmosphere`);
    if (cuisine) parts.push(`${cuisine} cuisine`);
    const mood = parts.length > 0
      ? `Looking for a ${parts.join(", ")}`
      : "Looking for a great meal";

    const requestData = {
      mood,
      budget: priceToBudget(price),
      distance,
      atmosphere: vibe ?? undefined,
      diningPreference: undefined,
    };

    setCurrentRequest(requestData);
    getRecommendation.mutate(
      { data: requestData },
      {
        onSuccess: (result) => {
          setLastResult(result);
          setLocation("/recommendation");
        },
        onError: () => {
          toast({
            title: "Couldn't find a match",
            description: "Something went wrong on our end. Please try again in a moment.",
            variant: "destructive",
          });
        },
      },
    );
  };

  if (prefsLoading) {
    return (
      <Shell>
        <div className="flex flex-col gap-8 w-full max-w-xl mx-auto mt-12 animate-in fade-in duration-500">
          <Skeleton className="h-10 w-2/3 rounded-xl bg-white/20" />
          <Skeleton className="h-32 w-full rounded-3xl bg-white/20" />
          <Skeleton className="h-32 w-full rounded-3xl bg-white/20" />
          <Skeleton className="h-24 w-full rounded-3xl bg-white/20" />
        </div>
      </Shell>
    );
  }

  /* Shared glass style for inactive selection buttons */
  const inactiveGlass = "rgba(255,255,255,0.14)";
  const inactiveBorder = "1.5px solid rgba(255,255,255,0.28)";

  return (
    <Shell>
      <div className="flex flex-col gap-10 w-full max-w-xl mx-auto py-10 animate-in fade-in slide-in-from-bottom-4 duration-500">

        {/* Header */}
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-4xl md:text-5xl text-white drop-shadow-lg">
            What are you craving?
          </h1>
          <p className="text-white/70 font-medium">
            Answer a few quick questions and we'll find your perfect match.
          </p>
        </div>

        {/* Q1 — Dining occasion */}
        <Section step={1} title="Dining occasion">
          <div className="flex gap-3">
            {DINING_OCCASIONS.map(({ value, label, icon: Icon }) => {
              const active = occasion === value;
              return (
                <button
                  key={value}
                  type="button"
                  data-testid={`occasion-${value}`}
                  onClick={() => setOccasion(active ? null : value)}
                  className="flex flex-1 flex-col items-center gap-2 py-5 rounded-2xl font-semibold text-sm transition-all duration-150"
                  style={
                    active
                      ? {
                          background: "linear-gradient(to bottom, #FFEF4D, #FFD800)",
                          border: "2.5px solid rgba(255,255,255,0.75)",
                          boxShadow: "0 5px 0 #B89200, 0 8px 16px rgba(0,0,0,0.22)",
                          color: "hsl(220,45%,12%)",
                          transform: "translateY(-1px)",
                        }
                      : {
                          background: inactiveGlass,
                          border: inactiveBorder,
                          color: "rgba(255,255,255,0.85)",
                          backdropFilter: "blur(8px)",
                        }
                  }
                >
                  <Icon className="w-6 h-6" strokeWidth={1.8} />
                  {label}
                </button>
              );
            })}
          </div>
        </Section>

        {/* Q2 — Vibe */}
        <Section step={2} title="Vibe">
          <div className="flex flex-wrap gap-2">
            {VIBES.map((v) => {
              const active = vibe === v;
              return (
                <button
                  key={v}
                  type="button"
                  data-testid={`vibe-${v.toLowerCase()}`}
                  onClick={() => setVibe(active ? null : v)}
                  className="px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-150"
                  style={
                    active
                      ? {
                          background: "linear-gradient(to bottom, #FFEF4D, #FFD800)",
                          border: "2.5px solid rgba(255,255,255,0.75)",
                          boxShadow: "0 4px 0 #B89200",
                          color: "hsl(220,45%,12%)",
                          transform: "translateY(-1px)",
                        }
                      : {
                          background: inactiveGlass,
                          border: inactiveBorder,
                          color: "rgba(255,255,255,0.85)",
                          backdropFilter: "blur(8px)",
                        }
                  }
                >
                  {v}
                </button>
              );
            })}
          </div>
        </Section>

        {/* Q3 — Cuisine (optional) */}
        <Section step={3} title="Any cuisine in mind? — optional">
          <div className="flex flex-wrap gap-2">
            {CUISINES.map((c) => {
              const active = cuisine === c;
              return (
                <button
                  key={c}
                  type="button"
                  data-testid={`cuisine-${c.toLowerCase().replace(/\s+/g, "-")}`}
                  onClick={() => setCuisine(active ? null : c)}
                  className="px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-150"
                  style={
                    active
                      ? {
                          background: "linear-gradient(to bottom, hsl(82,60%,52%), hsl(82,55%,42%))",
                          border: "2.5px solid rgba(255,255,255,0.75)",
                          boxShadow: "0 4px 0 hsl(82,60%,28%)",
                          color: "white",
                          transform: "translateY(-1px)",
                        }
                      : {
                          background: inactiveGlass,
                          border: inactiveBorder,
                          color: "rgba(255,255,255,0.85)",
                          backdropFilter: "blur(8px)",
                        }
                  }
                >
                  {c}
                </button>
              );
            })}
          </div>
        </Section>

        {/* Q4 — Price range */}
        <Section step={4} title="Price range">
          <div className="card-watercolor rounded-2xl px-6 py-5 flex flex-col gap-4 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground font-medium">Max budget per person</span>
              <span className="text-sm font-extrabold" style={{ color: "hsl(82,55%,35%)" }}>
                {priceLabel(price)}
              </span>
            </div>
            <input
              type="range"
              min={10}
              max={60}
              step={5}
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              data-testid="slider-price"
              className="w-full h-2 rounded-full cursor-pointer"
              style={{ accentColor: "hsl(52,100%,50%)" }}
            />
            <div className="flex justify-between text-xs text-muted-foreground font-bold">
              <span>RM10</span>
              <span>RM30</span>
              <span>RM60+</span>
            </div>
          </div>
        </Section>

        {/* Q5 — Maximum distance */}
        <Section step={5} title="Maximum distance">
          <div className="card-watercolor rounded-2xl px-6 py-5 flex flex-col gap-4 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground font-medium">How far are you willing to go?</span>
              <span className="text-sm font-extrabold" style={{ color: "hsl(82,55%,35%)" }}>
                {distanceLabel(distance)}
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={50}
              step={1}
              value={distance}
              onChange={(e) => setDistance(Number(e.target.value))}
              data-testid="slider-distance"
              className="w-full h-2 rounded-full cursor-pointer"
              style={{ accentColor: "hsl(52,100%,50%)" }}
            />
            <div className="flex justify-between text-xs text-muted-foreground font-bold">
              <span>1 km</span>
              <span>25 km</span>
              <span>50 km</span>
            </div>
          </div>
        </Section>

        {/* Submit */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={getRecommendation.isPending}
          data-testid="button-find-match"
          className="btn-glass-cta w-full py-4 rounded-2xl gap-2"
        >
          {getRecommendation.isPending ? (
            <>
              <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              Finding your match…
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Find My Match
            </>
          )}
        </button>

      </div>
    </Shell>
  );
}
