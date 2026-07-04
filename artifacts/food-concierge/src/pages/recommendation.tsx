import { useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useAppState } from "@/store/app-state";
import { useShuffleRecommendation } from "@workspace/api-client-react";
import { Shell } from "@/components/shell";
import { MapPin, Navigation, Shuffle, Star, MessageCircle, Utensils, Heart } from "lucide-react";
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
          <Skeleton className="h-12 w-1/2 rounded-xl" />
          <Skeleton className="h-[400px] w-full rounded-3xl" />
        </div>
      </Shell>
    );
  }

  const { restaurant, matchReason, moodInterpretation, alternativeIds } = lastResult;

  const handleShuffle = () => {
    if (!currentRequest) return;
    
    // Build exclude list based on previous results
    // We could store a history of current session exclusions, but for now we just exclude the current one
    const newRequest = {
      ...currentRequest,
      excludeRestaurantIds: [restaurant.id]
    };

    shuffleMutation.mutate({ data: newRequest }, {
      onSuccess: (result) => {
        setLastResult(result);
      },
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
        
        <div className="flex flex-col gap-2">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary font-bold text-sm w-fit border border-primary/20">
            <Star className="w-4 h-4 fill-primary text-primary" />
            <span>98% Match for your mood</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-foreground tracking-tight">
            You should go to <span className="text-primary">{restaurant.name}</span>
          </h1>
        </div>

        {/* AI Insight Box */}
        <div className="bg-secondary/20 border-2 border-secondary/50 rounded-3xl p-6 md:p-8 flex gap-4 md:gap-6 items-start relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <MessageCircle className="w-32 h-32" />
          </div>
          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shrink-0 text-primary-foreground z-10">
            <MessageCircle className="w-6 h-6" />
          </div>
          <div className="flex flex-col gap-3 z-10">
            <p className="text-foreground text-lg md:text-xl font-medium leading-relaxed">
              "{matchReason}"
            </p>
            <p className="text-muted-foreground text-sm font-bold">
              Based on: {moodInterpretation}
            </p>
          </div>
        </div>

        {/* Restaurant Card */}
        <div className="bg-card border-2 border-border rounded-3xl shadow-lg overflow-hidden flex flex-col md:flex-row group">
          <div className="h-64 md:h-auto md:w-2/5 bg-muted relative">
            {restaurant.photos && restaurant.photos.length > 0 ? (
              <img 
                src={restaurant.photos[0]} 
                alt={restaurant.name} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                <Utensils className="w-12 h-12 opacity-20" />
              </div>
            )}
            <div className="absolute top-4 right-4 bg-background/90 backdrop-blur-sm px-3 py-1 rounded-full font-bold text-sm flex items-center gap-1 shadow-sm">
              <Star className="w-4 h-4 fill-accent text-accent" />
              {restaurant.rating.toFixed(1)}
            </div>
          </div>
          
          <div className="p-6 md:p-8 flex-1 flex flex-col gap-6 justify-between">
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="text-3xl font-extrabold text-foreground">{restaurant.name}</h2>
                <div className="flex items-center gap-2 mt-2 text-muted-foreground font-medium">
                  <MapPin className="w-4 h-4" />
                  <span>{restaurant.area}</span>
                  <span>•</span>
                  <span>{restaurant.cuisine}</span>
                </div>
              </div>
              
              <p className="text-foreground font-medium leading-relaxed">
                {restaurant.description}
              </p>

              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-muted rounded-lg text-xs font-bold">{restaurant.budgetRange}</span>
                {restaurant.isHalal && (
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-lg text-xs font-bold">Halal</span>
                )}
                {restaurant.tags?.slice(0, 3).map((tag) => (
                  <span key={tag} className="px-3 py-1 border border-border rounded-lg text-xs font-bold text-muted-foreground">{tag}</span>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-border">
              <Link href={`/restaurant/${restaurant.id}`} className="flex-1 bg-foreground text-background text-center font-bold px-6 py-4 rounded-xl shadow-md hover:bg-foreground/90 transition-all hover:-translate-y-0.5">
                View Details
              </Link>
              <button 
                onClick={() => {
                  window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurant.name + ' ' + restaurant.address)}`, '_blank');
                }}
                className="w-14 shrink-0 bg-primary/10 text-primary flex items-center justify-center rounded-xl font-bold hover:bg-primary/20 transition-colors"
                title="Navigate"
              >
                <Navigation className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 bg-card p-4 rounded-2xl border border-border shadow-sm">
          <p className="text-muted-foreground font-medium text-sm text-center sm:text-left">
            Not feeling this one? Let's roll the dice again.
          </p>
          <div className="flex gap-3 w-full sm:w-auto">
            <button 
              onClick={handleShuffle}
              disabled={shuffleMutation.isPending}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-muted hover:bg-muted/80 text-foreground font-bold rounded-xl transition-colors disabled:opacity-50"
            >
              <Shuffle className={`w-5 h-5 ${shuffleMutation.isPending ? 'animate-spin' : ''}`} />
              <span>Shuffle</span>
            </button>
          </div>
        </div>

      </div>
    </Shell>
  );
}
