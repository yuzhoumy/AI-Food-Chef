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
          <h1 className="font-display text-4xl md:text-5xl text-white drop-shadow-lg flex items-center gap-3">
            <Heart className="w-9 h-9 text-primary drop-shadow-md" style={{ filter: "drop-shadow(0 3px 0 #B89200)" }} />
            Your Saved Spots
          </h1>
          <p className="text-white/70 font-medium text-lg">
            The places you loved or want to try later.
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex flex-col gap-4 animate-pulse">
                <Skeleton className="h-48 w-full rounded-2xl bg-white/20" />
                <Skeleton className="h-6 w-3/4 rounded-lg bg-white/20" />
                <Skeleton className="h-4 w-1/2 rounded-lg bg-white/20" />
              </div>
            ))}
          </div>
        ) : favorites && favorites.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((fav) => (
              <Link
                key={fav.id}
                href={`/restaurant/${fav.restaurant.id}`}
                className="rounded-3xl overflow-hidden hover:shadow-2xl transition-all duration-200 hover:-translate-y-1 group flex flex-col shadow-xl"
                style={{
                  background: "linear-gradient(145deg, hsl(38,55%,96%) 0%, hsl(100,18%,90%) 100%)",
                  border: "2px solid hsl(100,22%,74%)",
                }}
              >
                <div className="h-48 relative overflow-hidden"
                  style={{ background: "hsl(100,18%,87%)" }}>
                  {fav.restaurant.photos && fav.restaurant.photos[0] ? (
                    <img
                      src={fav.restaurant.photos[0]}
                      alt={fav.restaurant.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Utensils className="w-8 h-8 opacity-20 text-card-foreground" />
                    </div>
                  )}
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full font-bold text-xs flex items-center gap-1 shadow-sm text-card-foreground">
                    <Star className="w-3 h-3 fill-primary text-primary" />
                    {fav.restaurant.rating.toFixed(1)}
                  </div>
                </div>

                <div className="p-5 flex flex-col gap-2 flex-1">
                  <h3 className="font-bold text-xl text-card-foreground line-clamp-1">{fav.restaurant.name}</h3>
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <MapPin className="w-4 h-4 shrink-0" />
                    <span className="line-clamp-1">{fav.restaurant.area}</span>
                  </div>
                  <div className="mt-auto pt-3 flex gap-2" style={{ borderTop: "1px solid hsl(100,22%,82%)" }}>
                    <span
                      className="text-xs font-bold px-2 py-1 rounded-md"
                      style={{ background: "hsl(100,18%,85%)", color: "hsl(100,30%,28%)" }}
                    >
                      {fav.restaurant.cuisine}
                    </span>
                    <span
                      className="text-xs font-bold px-2 py-1 rounded-md"
                      style={{ background: "hsl(52,100%,90%)", color: "hsl(52,80%,28%)" }}
                    >
                      {fav.restaurant.budgetRange}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div
            className="flex flex-col items-center justify-center text-center p-12 rounded-3xl mt-8"
            style={{
              background: "rgba(255,255,255,0.14)",
              border: "2px dashed rgba(255,255,255,0.35)",
              backdropFilter: "blur(8px)",
            }}
          >
            <Heart className="w-16 h-16 mb-4 opacity-40 text-primary" />
            <h3 className="text-2xl font-bold text-white mb-2">No favourites yet</h3>
            <p className="text-white/65 font-medium mb-6">Hit the heart icon on any restaurant to save it here.</p>
            <Link
              href="/discover"
              className="btn-jelly px-6 py-3 rounded-full text-sm"
            >
              Find some spots
            </Link>
          </div>
        )}
      </div>
    </Shell>
  );
}
