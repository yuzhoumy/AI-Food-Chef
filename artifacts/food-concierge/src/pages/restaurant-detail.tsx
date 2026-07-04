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

  const { data: restaurant, isLoading } = useGetRestaurant(id, { query: { enabled: !!id, queryKey: ['/api/restaurants', id] } });
  const { data: favorites } = useListFavorites();
  const addFavorite = useAddFavorite();
  const removeFavorite = useRemoveFavorite();

  const isFavorited = favorites?.some(f => f.restaurant.id === id);

  const handleToggleFavorite = () => {
    if (isFavorited) {
      removeFavorite.mutate({ restaurantId: id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListFavoritesQueryKey() });
          toast({ description: "Removed from favorites." });
        }
      });
    } else {
      addFavorite.mutate({ data: { restaurantId: id } }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListFavoritesQueryKey() });
          toast({ description: "Added to favorites! ❤️" });
        }
      });
    }
  };

  const handleShare = async () => {
    if (navigator.share && restaurant) {
      try {
        await navigator.share({
          title: restaurant.name,
          text: `Check out ${restaurant.name} on AI Food Concierge!`,
          url: window.location.href,
        });
      } catch (err) {
        // user canceled or unsupported
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
          <Skeleton className="h-[300px] md:h-[400px] w-full rounded-3xl" />
          <Skeleton className="h-12 w-2/3 rounded-xl" />
          <div className="flex gap-4">
            <Skeleton className="h-24 w-full rounded-2xl" />
            <Skeleton className="h-24 w-full rounded-2xl" />
          </div>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="flex flex-col gap-8 max-w-5xl mx-auto animate-in fade-in duration-500 pb-12">
        
        {/* Header Banner */}
        <div className="relative h-[300px] md:h-[450px] w-full rounded-3xl overflow-hidden shadow-lg group">
          {restaurant.photos && restaurant.photos.length > 0 ? (
            <img 
              src={restaurant.photos[0]} 
              alt={restaurant.name} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <ChefHat className="w-24 h-24 text-muted-foreground/30" />
            </div>
          )}
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6 md:p-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="flex flex-col gap-3 text-white">
                <div className="flex items-center gap-3">
                  <span className="bg-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                    {restaurant.cuisine}
                  </span>
                  {restaurant.isOpenNow ? (
                    <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                      Open Now
                    </span>
                  ) : (
                    <span className="bg-destructive text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                      Closed
                    </span>
                  )}
                </div>
                <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight drop-shadow-md">
                  {restaurant.name}
                </h1>
                <div className="flex items-center gap-4 text-white/90 font-medium">
                  <div className="flex items-center gap-1">
                    <Star className="w-5 h-5 fill-accent text-accent" />
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
                  className={`w-14 h-14 rounded-full backdrop-blur-md flex items-center justify-center transition-all ${
                    isFavorited ? 'bg-primary text-white shadow-lg' : 'bg-white/20 text-white hover:bg-white/30 border border-white/30'
                  }`}
                >
                  <Heart className={`w-6 h-6 ${isFavorited ? 'fill-current' : ''}`} />
                </button>
                <button 
                  onClick={handleShare}
                  className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md text-white hover:bg-white/30 border border-white/30 flex items-center justify-center transition-all"
                >
                  <Share className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Main Info */}
          <div className="md:col-span-2 flex flex-col gap-8">
            <section className="bg-card border border-border rounded-3xl p-6 md:p-8 shadow-sm">
              <h3 className="text-2xl font-bold text-foreground mb-4">About</h3>
              <p className="text-muted-foreground font-medium text-lg leading-relaxed">
                {restaurant.description}
              </p>
              
              <div className="flex flex-wrap gap-2 mt-6 pt-6 border-t border-border">
                {restaurant.isHalal && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-700 rounded-xl font-bold text-sm border border-green-500/20">
                    <CheckCircle2 className="w-4 h-4" /> Halal
                  </div>
                )}
                {restaurant.isVegetarianFriendly && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-700 rounded-xl font-bold text-sm border border-emerald-500/20">
                    <Leaf className="w-4 h-4" /> Vegetarian Options
                  </div>
                )}
                {restaurant.tags?.map(tag => (
                  <div key={tag} className="px-4 py-2 bg-muted text-muted-foreground rounded-xl font-bold text-sm border border-border">
                    {tag}
                  </div>
                ))}
              </div>
            </section>

            {restaurant.popularDishes && restaurant.popularDishes.length > 0 && (
              <section className="bg-card border border-border rounded-3xl p-6 md:p-8 shadow-sm">
                <h3 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
                  <Flame className="w-6 h-6 text-primary" /> Must Try Dishes
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {restaurant.popularDishes.map(dish => (
                    <div key={dish} className="flex items-center gap-4 p-4 rounded-2xl bg-muted/50 border border-border">
                      <div className="w-10 h-10 rounded-full bg-card shadow-sm flex items-center justify-center shrink-0">
                        <Utensils className="w-5 h-5 text-primary" />
                      </div>
                      <span className="font-bold text-foreground">{dish}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar Sidebar */}
          <div className="flex flex-col gap-6">
            <section className="bg-card border border-border rounded-3xl p-6 shadow-sm flex flex-col gap-6">
              
              <button 
                onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurant.name + ' ' + restaurant.address)}`, '_blank')}
                className="w-full bg-foreground text-background font-bold py-4 rounded-xl shadow-md hover:bg-foreground/90 transition-all flex items-center justify-center gap-2"
              >
                <Navigation className="w-5 h-5" /> Get Directions
              </button>

              <div className="flex flex-col gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Address</span>
                    <span className="font-medium text-foreground mt-1 leading-snug">{restaurant.address}</span>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Hours</span>
                    <span className="font-medium text-foreground mt-1 leading-snug">{restaurant.openingHours}</span>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <Info className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Pricing</span>
                    <span className="font-medium text-foreground mt-1">{restaurant.budgetRange} per pax</span>
                  </div>
                </div>
              </div>

            </section>
          </div>

        </div>
      </div>
    </Shell>
  );
}
