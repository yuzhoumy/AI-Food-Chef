import { useParams } from "wouter";
import { useGetRestaurant, useListFavorites, useAddFavorite, useRemoveFavorite } from "@workspace/api-client-react";
import { Shell } from "@/components/shell";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Star, Clock, Heart, Navigation, Share, Info, ChefHat, CheckCircle2, Flame, Leaf, Utensils } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { getListFavoritesQueryKey } from "@workspace/api-client-react";

export default function RestaurantDetail() {
  const params = useParams();
  const id = Number(params.id);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: restaurant, isLoading } = useGetRestaurant(id, { query: { enabled: !!id, queryKey: ["/api/restaurants", id] } });
  const { data: favorites } = useListFavorites();
  const addFavorite = useAddFavorite();
  const removeFavorite = useRemoveFavorite();

  const isFavorited = favorites?.some((f) => f.restaurant.id === id);

  const handleToggleFavorite = () => {
    if (isFavorited) {
      removeFavorite.mutate({ restaurantId: id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListFavoritesQueryKey() });
          toast({ description: "Removed from favourites." });
        },
      });
    } else {
      addFavorite.mutate({ data: { restaurantId: id } }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListFavoritesQueryKey() });
          toast({ description: "Added to favourites! ❤️" });
        },
      });
    }
  };

  const handleShare = async () => {
    if (navigator.share && restaurant) {
      try {
        await navigator.share({ title: restaurant.name, text: `Check out ${restaurant.name} on Food Concierge!`, url: window.location.href });
      } catch {
        /* user canceled */
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({ description: "Link copied to clipboard!" });
    }
  };

  if (isLoading || !restaurant) {
    return (
      <Shell>
        <div className="flex flex-col gap-6 animate-pulse">
          <Skeleton className="h-[300px] md:h-[400px] w-full rounded-3xl bg-white/20" />
          <Skeleton className="h-12 w-2/3 rounded-xl bg-white/20" />
          <div className="flex gap-4">
            <Skeleton className="h-24 w-full rounded-2xl bg-white/20" />
            <Skeleton className="h-24 w-full rounded-2xl bg-white/20" />
          </div>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="flex flex-col gap-8 max-w-5xl mx-auto animate-in fade-in duration-500 pb-12">

        {/* ── Hero Banner ─────────────────────────────────────────────────── */}
        <div className="relative h-[300px] md:h-[450px] w-full rounded-3xl overflow-hidden shadow-2xl group"
          style={{ border: "2.5px solid rgba(255,255,255,0.40)" }}>
          {restaurant.photos && restaurant.photos.length > 0 ? (
            <img
              src={restaurant.photos[0]}
              alt={restaurant.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, hsl(100,18%,88%) 0%, hsl(38,55%,94%) 100%)" }}
            >
              <ChefHat className="w-24 h-24 text-card-foreground/20" />
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6 md:p-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="flex flex-col gap-3 text-white">
                <div className="flex items-center gap-3 flex-wrap">
                  <span
                    className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
                    style={{
                      background: "linear-gradient(to right, #FFEF4D, #FFD800)",
                      color: "hsl(220,45%,12%)",
                      border: "1.5px solid rgba(255,255,255,0.60)",
                    }}
                  >
                    {restaurant.cuisine}
                  </span>
                  {restaurant.isOpenNow ? (
                    <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                      Open Now
                    </span>
                  ) : (
                    <span className="bg-destructive text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                      Closed
                    </span>
                  )}
                </div>
                <h1 className="font-display text-4xl md:text-6xl drop-shadow-md">{restaurant.name}</h1>
                <div className="flex items-center gap-4 text-white/90 font-medium">
                  <div className="flex items-center gap-1">
                    <Star className="w-5 h-5 fill-primary text-primary" />
                    <span className="font-bold text-lg">{restaurant.rating.toFixed(1)}</span>
                    <span className="text-sm">({restaurant.reviewCount})</span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-5 h-5" />
                    <span>{restaurant.area}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleToggleFavorite}
                  className="w-14 h-14 rounded-full backdrop-blur-md flex items-center justify-center transition-all border-2"
                  style={isFavorited
                    ? { background: "linear-gradient(to bottom, #FFEF4D, #FFD800)", borderColor: "rgba(255,255,255,0.70)", boxShadow: "0 4px 0 #B89200", color: "hsl(220,45%,12%)" }
                    : { background: "rgba(255,255,255,0.20)", borderColor: "rgba(255,255,255,0.40)", color: "white" }}
                >
                  <Heart className={`w-6 h-6 ${isFavorited ? "fill-current" : ""}`} />
                </button>
                <button
                  onClick={handleShare}
                  className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md text-white border-2 border-white/40 flex items-center justify-center transition-all hover:bg-white/30"
                >
                  <Share className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Content Grid ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Main info */}
          <div className="md:col-span-2 flex flex-col gap-6">
            <section
              className="rounded-3xl p-6 md:p-8 shadow-lg"
              style={{
                background: "linear-gradient(135deg, hsl(38,55%,96%) 0%, hsl(100,18%,90%) 100%)",
                border: "2px solid hsl(100,22%,74%)",
              }}
            >
              <h3 className="text-2xl font-bold text-card-foreground mb-4">About</h3>
              <p className="text-muted-foreground font-medium text-lg leading-relaxed">
                {restaurant.description}
              </p>

              <div className="flex flex-wrap gap-2 mt-6 pt-6" style={{ borderTop: "1.5px solid hsl(100,22%,82%)" }}>
                {restaurant.isHalal && (
                  <div
                    className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm"
                    style={{ background: "hsl(142,60%,92%)", color: "hsl(142,50%,28%)", border: "1.5px solid hsl(142,50%,75%)" }}
                  >
                    <CheckCircle2 className="w-4 h-4" /> Halal
                  </div>
                )}
                {restaurant.isVegetarianFriendly && (
                  <div
                    className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm"
                    style={{ background: "hsl(100,30%,90%)", color: "hsl(100,40%,28%)", border: "1.5px solid hsl(100,30%,72%)" }}
                  >
                    <Leaf className="w-4 h-4" /> Vegetarian Options
                  </div>
                )}
                {restaurant.tags?.map((tag) => (
                  <div
                    key={tag}
                    className="px-4 py-2 rounded-xl font-bold text-sm"
                    style={{ background: "hsl(100,18%,86%)", color: "hsl(100,25%,30%)", border: "1.5px solid hsl(100,22%,74%)" }}
                  >
                    {tag}
                  </div>
                ))}
              </div>
            </section>

            {restaurant.popularDishes && restaurant.popularDishes.length > 0 && (
              <section
                className="rounded-3xl p-6 md:p-8 shadow-lg"
                style={{
                  background: "linear-gradient(135deg, hsl(38,55%,96%) 0%, hsl(100,18%,90%) 100%)",
                  border: "2px solid hsl(100,22%,74%)",
                }}
              >
                <h3 className="text-2xl font-bold text-card-foreground mb-6 flex items-center gap-2">
                  <Flame className="w-6 h-6 text-primary" style={{ filter: "drop-shadow(0 2px 0 #B89200)" }} />
                  Must Try Dishes
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {restaurant.popularDishes.map((dish) => (
                    <div
                      key={dish}
                      className="flex items-center gap-4 p-4 rounded-2xl"
                      style={{ background: "rgba(255,255,255,0.65)", border: "1.5px solid hsl(100,22%,80%)" }}
                    >
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm"
                        style={{ background: "linear-gradient(to bottom, #FFEF4D, #FFD800)", border: "2px solid rgba(255,255,255,0.70)" }}
                      >
                        <Utensils className="w-5 h-5" style={{ color: "hsl(220,45%,12%)" }} />
                      </div>
                      <span className="font-bold text-card-foreground">{dish}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <div className="flex flex-col gap-6">
            <section
              className="rounded-3xl p-6 shadow-lg flex flex-col gap-6"
              style={{
                background: "linear-gradient(135deg, hsl(38,55%,96%) 0%, hsl(100,18%,90%) 100%)",
                border: "2px solid hsl(100,22%,74%)",
              }}
            >
              <button
                onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurant.name + " " + restaurant.address)}`, "_blank")}
                className="btn-jelly w-full font-bold py-4 rounded-xl gap-2"
              >
                <Navigation className="w-5 h-5" /> Get Directions
              </button>

              <div className="flex flex-col gap-4">
                {[
                  { icon: MapPin, label: "Address", value: restaurant.address },
                  { icon: Clock, label: "Hours", value: restaurant.openingHours },
                  { icon: Info, label: "Pricing", value: `${restaurant.budgetRange} per pax` },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-start gap-4">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: "hsl(100,18%,85%)", color: "hsl(100,30%,32%)" }}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{label}</span>
                      <span className="font-medium text-card-foreground mt-1 leading-snug">{value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </Shell>
  );
}
