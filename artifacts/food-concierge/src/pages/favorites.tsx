import { Shell } from "@/components/shell";
import { useListFavorites } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Heart, MapPin, Star, Utensils } from "lucide-react";

export default function Favorites() {
  const { data: favorites, isLoading } = useListFavorites();

  return (
    <Shell>
      <div className="flex flex-col gap-8 max-w-5xl mx-auto py-8">
        
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl md:text-5xl font-extrabold text-foreground tracking-tight flex items-center gap-3">
            <Heart className="w-10 h-10 text-primary fill-primary" />
            Your Saved Spots
          </h1>
          <p className="text-lg text-muted-foreground font-medium">
            The places you loved or want to try later.
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex flex-col gap-4 animate-pulse">
                <Skeleton className="h-48 w-full rounded-2xl" />
                <Skeleton className="h-6 w-3/4 rounded-lg" />
                <Skeleton className="h-4 w-1/2 rounded-lg" />
              </div>
            ))}
          </div>
        ) : favorites && favorites.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((fav) => (
              <Link 
                key={fav.id} 
                href={`/restaurant/${fav.restaurant.id}`}
                className="bg-card border border-border rounded-3xl overflow-hidden hover:border-primary/50 hover:shadow-md transition-all group flex flex-col"
              >
                <div className="h-48 bg-muted relative overflow-hidden">
                  {fav.restaurant.photos && fav.restaurant.photos[0] ? (
                    <img 
                      src={fav.restaurant.photos[0]} 
                      alt={fav.restaurant.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Utensils className="w-8 h-8 text-muted-foreground/30" />
                    </div>
                  )}
                  <div className="absolute top-3 right-3 bg-background/90 backdrop-blur-sm px-2 py-1 rounded-full font-bold text-xs flex items-center gap-1">
                    <Star className="w-3 h-3 fill-accent text-accent" />
                    {fav.restaurant.rating.toFixed(1)}
                  </div>
                </div>
                
                <div className="p-5 flex flex-col gap-2 flex-1">
                  <h3 className="font-bold text-xl text-foreground line-clamp-1">{fav.restaurant.name}</h3>
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <MapPin className="w-4 h-4 shrink-0" />
                    <span className="line-clamp-1">{fav.restaurant.area}</span>
                  </div>
                  <div className="mt-auto pt-4 flex gap-2">
                    <span className="text-xs font-bold px-2 py-1 bg-muted rounded-md">{fav.restaurant.cuisine}</span>
                    <span className="text-xs font-bold px-2 py-1 bg-muted rounded-md">{fav.restaurant.budgetRange}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-12 bg-card border-2 border-dashed border-border rounded-3xl mt-8">
            <Heart className="w-16 h-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-2xl font-bold text-foreground mb-2">No favorites yet</h3>
            <p className="text-muted-foreground font-medium mb-6">Hit the heart icon on any restaurant to save it here.</p>
            <Link href="/discover" className="bg-primary text-primary-foreground font-bold px-6 py-3 rounded-full hover:bg-primary/90 transition-colors">
              Find some spots
            </Link>
          </div>
        )}
      </div>
    </Shell>
  );
}
