import { useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useAppState } from "@/store/app-state";
import { useShuffleRecommendation } from "@workspace/api-client-react";
import { Shell } from "@/components/shell";
import { MapPin, Navigation, Shuffle, Star, MessageCircle, Utensils, Heart, Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

export default function Recommendation() {
  const [, setLocation] = useLocation();
  const { currentRequest, lastResult, setLastResult } = useAppState();
  const shuffleMutation = useShuffleRecommendation();
  const { toast } = useToast();

  useEffect(() => {
    if (!lastResult && !currentRequest) {
      setLocation("/discover");
    }
  }, [lastResult, currentRequest, setLocation]);

  if (!lastResult) {
    return (
      <Shell>
        <div className="flex flex-col gap-6 animate-pulse">
          <Skeleton className="h-12 w-1/2 rounded-xl bg-white/20" />
          <Skeleton className="h-[400px] w-full rounded-3xl bg-white/20" />
        </div>
      </Shell>
    );
  }

  const { restaurant, matchReason, moodInterpretation, alternativeIds } = lastResult;

  const handleShuffle = () => {
    if (!currentRequest) return;
    const newRequest = { ...currentRequest, excludeRestaurantIds: [restaurant.id] };
    shuffleMutation.mutate({ data: newRequest }, {
      onSuccess: (result) => { setLastResult(result); },
      onError: () => {
        toast({
          title: "Couldn't shuffle",
          description: "We might be out of fresh options for this exact mood.",
          variant: "destructive"
        });
      }
    });
  };

  return (
    <Shell>
      <div className="flex flex-col gap-8 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">

        {/* Match badge + title */}
        <div className="flex flex-col gap-2">
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full font-bold text-sm w-fit"
            style={{
              background: "linear-gradient(to right, hsl(52,100%,54%), hsl(82,52%,44%))",
              color: "hsl(220,45%,12%)",
              border: "2px solid rgba(255,255,255,0.60)",
              boxShadow: "0 3px 0 #B89200",
            }}
          >
            <Star className="w-4 h-4 fill-current" />
            <span>Perfect match for your mood</span>
          </div>
          <h1 className="font-display text-4xl md:text-5xl text-white drop-shadow-lg">
            You should go to{" "}
            <span className="text-primary" style={{ textShadow: "0 3px 0 rgba(0,0,0,0.18)" }}>
              {restaurant.name}
            </span>
          </h1>
        </div>

        {/* AI Insight Box — watercolor style */}
        <div
          className="rounded-3xl p-6 md:p-8 flex gap-4 md:gap-6 items-start relative overflow-hidden shadow-xl"
          style={{
            background: "linear-gradient(135deg, hsl(38,55%,96%) 0%, hsl(100,18%,90%) 100%)",
            border: "2px solid hsl(100,22%,74%)",
          }}
        >
          <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
            <MessageCircle className="w-32 h-32 text-card-foreground" />
          </div>
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 z-10 border-2 border-white/60 shadow-md"
            style={{ background: "linear-gradient(to bottom, hsl(82,60%,52%), hsl(82,52%,38%))" }}
          >
            <MessageCircle className="w-6 h-6 text-white" />
          </div>
          <div className="flex flex-col gap-3 z-10">
            <p className="text-card-foreground text-lg md:text-xl font-medium leading-relaxed">
              "{matchReason}"
            </p>
            <p className="text-muted-foreground text-sm font-bold">
              Based on: {moodInterpretation}
            </p>
          </div>
        </div>

        {/* Restaurant Card — watercolor */}
        <div
          className="rounded-3xl shadow-xl overflow-hidden flex flex-col md:flex-row group"
          style={{
            background: "linear-gradient(135deg, hsl(38,55%,96%) 0%, hsl(100,18%,90%) 100%)",
            border: "2.5px solid hsl(100,22%,74%)",
          }}
        >
          {/* Photo */}
          <div className="h-64 md:h-auto md:w-2/5 relative overflow-hidden"
            style={{ background: "hsl(100,18%,88%)" }}>
            {restaurant.photos && restaurant.photos.length > 0 ? (
              <img
                src={restaurant.photos[0]}
                alt={restaurant.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Utensils className="w-12 h-12 opacity-20 text-card-foreground" />
              </div>
            )}
            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full font-bold text-sm flex items-center gap-1 shadow-sm text-card-foreground">
              <Star className="w-4 h-4 fill-primary text-primary" />
              {restaurant.rating.toFixed(1)}
            </div>
          </div>

          {/* Info */}
          <div className="p-6 md:p-8 flex-1 flex flex-col gap-6 justify-between">
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="text-3xl font-extrabold text-card-foreground">{restaurant.name}</h2>
                <div className="flex items-center gap-2 mt-2 text-muted-foreground font-medium">
                  <MapPin className="w-4 h-4" />
                  <span>{restaurant.area}</span>
                  <span>•</span>
                  <span>{restaurant.cuisine}</span>
                </div>
              </div>

              <p className="text-card-foreground font-medium leading-relaxed">
                {restaurant.description}
              </p>

              <div className="flex flex-wrap gap-2">
                <span
                  className="px-3 py-1 rounded-lg text-xs font-bold"
                  style={{ background: "hsl(100,18%,85%)", color: "hsl(100,30%,28%)" }}
                >
                  {restaurant.budgetRange}
                </span>
                {restaurant.isHalal && (
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-lg text-xs font-bold">Halal ✓</span>
                )}
                {restaurant.tags?.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 rounded-lg text-xs font-bold"
                    style={{ background: "hsl(100,18%,88%)", color: "hsl(100,25%,30%)" }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4" style={{ borderTop: "1.5px solid hsl(100,22%,80%)" }}>
              <Link
                href={`/restaurant/${restaurant.id}`}
                className="flex-1 btn-jelly text-center font-bold px-6 py-3.5 rounded-xl text-sm gap-2"
              >
                <Sparkles className="w-4 h-4" />
                View Details
              </Link>
              <button
                onClick={() => {
                  window.open(
                    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurant.name + " " + restaurant.address)}`,
                    "_blank"
                  );
                }}
                className="w-14 shrink-0 flex items-center justify-center rounded-xl font-bold transition-all hover:-translate-y-0.5"
                title="Navigate"
                style={{
                  background: "linear-gradient(to bottom, hsl(82,60%,52%), hsl(82,52%,38%))",
                  border: "2px solid rgba(255,255,255,0.60)",
                  boxShadow: "0 4px 0 hsl(82,60%,28%)",
                  color: "white",
                }}
              >
                <Navigation className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Shuffle bar */}
        <div
          className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl shadow-lg"
          style={{
            background: "rgba(255,255,255,0.15)",
            backdropFilter: "blur(12px)",
            border: "1.5px solid rgba(255,255,255,0.28)",
          }}
        >
          <p className="text-white/80 font-medium text-sm text-center sm:text-left">
            Not feeling this one? Let's roll the dice again.
          </p>
          <button
            onClick={handleShuffle}
            disabled={shuffleMutation.isPending}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all hover:-translate-y-0.5 disabled:opacity-50"
            style={{
              background: "rgba(255,255,255,0.20)",
              border: "1.5px solid rgba(255,255,255,0.40)",
              color: "white",
            }}
          >
            <Shuffle className={`w-5 h-5 ${shuffleMutation.isPending ? "animate-spin" : ""}`} />
            Shuffle
          </button>
        </div>

      </div>
    </Shell>
  );
}
