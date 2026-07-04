import { Shell } from "@/components/shell";
import { useGetDashboard } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { User, Target, Heart, UtensilsCrossed } from "lucide-react";

export default function Dashboard() {
  const { data: dashboard, isLoading } = useGetDashboard();

  if (isLoading || !dashboard) {
    return (
      <Shell>
        <div className="flex flex-col gap-8 animate-pulse p-4">
          <Skeleton className="h-12 w-64 rounded-xl" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <Skeleton className="h-32 rounded-3xl" />
            <Skeleton className="h-32 rounded-3xl" />
            <Skeleton className="h-32 rounded-3xl" />
          </div>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="flex flex-col gap-10 max-w-5xl mx-auto py-8 animate-in fade-in duration-500">
        
        <div className="flex items-center gap-4 glass-dark rounded-3xl p-5">
          <div className="w-16 h-16 rounded-full bg-white/20 text-white flex items-center justify-center overflow-hidden shrink-0 border-2 border-white/30">
            <User className="w-8 h-8" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">
              Hello, Foodie!
            </h1>
            <p className="text-white/90 font-medium">Here's your taste profile at a glance.</p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          <div className="bg-card border-2 border-border rounded-3xl p-6 shadow-sm flex flex-col gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Recommendations</p>
              <p className="text-4xl font-extrabold text-foreground mt-1">{dashboard.totalRecommendations}</p>
            </div>
          </div>
          
          <div className="bg-card border-2 border-border rounded-3xl p-6 shadow-sm flex flex-col gap-4">
            <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center text-destructive">
              <Heart className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Favorites</p>
              <p className="text-4xl font-extrabold text-foreground mt-1">{dashboard.totalFavorites}</p>
            </div>
          </div>

          <div className="bg-card border-2 border-border rounded-3xl p-6 shadow-sm flex flex-col gap-4 sm:col-span-2 md:col-span-1">
            <div className="w-12 h-12 rounded-2xl bg-accent/20 flex items-center justify-center text-accent-foreground">
              <UtensilsCrossed className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Top Cuisine</p>
              <p className="text-3xl font-extrabold text-foreground mt-1 line-clamp-1">
                {dashboard.topCuisines?.[0]?.cuisine || "None yet"}
              </p>
            </div>
          </div>
        </div>

        {/* Top Cuisines Chart (Simple Bars) */}
        {dashboard.topCuisines && dashboard.topCuisines.length > 0 && (
          <div className="bg-card border border-border rounded-3xl p-8 shadow-sm">
            <h3 className="text-xl font-bold text-foreground mb-6">Your Taste Composition</h3>
            <div className="flex flex-col gap-5">
              {dashboard.topCuisines.slice(0, 5).map((item, index) => {
                const max = dashboard.topCuisines[0].count;
                const percentage = (item.count / max) * 100;
                return (
                  <div key={item.cuisine} className="flex items-center gap-4">
                    <div className="w-32 font-bold text-sm text-foreground shrink-0">{item.cuisine}</div>
                    <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${index === 0 ? 'bg-primary' : 'bg-secondary'}`} 
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <div className="w-8 text-right font-bold text-sm text-muted-foreground">{item.count}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </Shell>
  );
}
