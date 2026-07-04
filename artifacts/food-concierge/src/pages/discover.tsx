import { useEffect } from "react";
import { useLocation } from "wouter";
import { useGetUserPreferences } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Sparkles, SlidersHorizontal, Navigation2, Flame } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { useGetRecommendation } from "@workspace/api-client-react";
import { useAppState } from "@/store/app-state";

const discoverSchema = z.object({
  mood: z.string().min(3, "Please tell us a bit more about how you're feeling."),
  budget: z.string().nullable().optional(),
  cuisine: z.string().nullable().optional(),
  atmosphere: z.string().nullable().optional(),
});

type DiscoverValues = z.infer<typeof discoverSchema>;

export default function Discover() {
  const [, setLocation] = useLocation();
  const { data: preferences, isLoading: prefsLoading } = useGetUserPreferences();
  const getRecommendation = useGetRecommendation();
  const { setCurrentRequest, setLastResult } = useAppState();

  const form = useForm<DiscoverValues>({
    resolver: zodResolver(discoverSchema),
    defaultValues: {
      mood: "",
      budget: null,
      cuisine: null,
      atmosphere: null,
    },
  });

  useEffect(() => {
    if (preferences && !preferences.onboardingCompleted) {
      setLocation("/onboarding");
    }
  }, [preferences, setLocation]);

  const onSubmit = (data: DiscoverValues) => {
    const requestData = {
      mood: data.mood,
      budget: data.budget || undefined,
      cuisine: data.cuisine || undefined,
      atmosphere: data.atmosphere || undefined,
    };
    
    setCurrentRequest(requestData);
    
    getRecommendation.mutate({ data: requestData }, {
      onSuccess: (result) => {
        setLastResult(result);
        setLocation("/recommendation");
      }
    });
  };

  if (prefsLoading) {
    return (
      <div className="flex flex-col gap-6 w-full max-w-2xl mx-auto mt-12 animate-in fade-in duration-500">
        <Skeleton className="h-12 w-3/4 rounded-xl" />
        <Skeleton className="h-64 w-full rounded-3xl" />
        <div className="flex gap-4">
          <Skeleton className="h-10 w-24 rounded-full" />
          <Skeleton className="h-10 w-24 rounded-full" />
          <Skeleton className="h-10 w-24 rounded-full" />
        </div>
      </div>
    );
  }

  const quickMoods = [
    "I need spicy comfort food after a long day",
    "A quiet cafe to read a book and chill",
    "Casual dinner with friends, lots of sharing",
    "Healthy, clean eating to reset",
  ];

  return (
    <div className="flex flex-col gap-8 w-full max-w-3xl mx-auto py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl md:text-5xl font-extrabold text-foreground tracking-tight">
          What are you craving?
        </h1>
        <p className="text-lg text-muted-foreground font-medium">
          Describe your vibe. Be as specific or as weird as you want.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-8">
          
          {/* Main Hero Input */}
          <FormField
            control={form.control}
            name="mood"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div className="relative group">
                    <div className="absolute inset-0 bg-primary/5 rounded-3xl blur-xl transition-all group-focus-within:bg-primary/20"></div>
                    <div className="relative bg-card border-2 border-border group-focus-within:border-primary/50 rounded-3xl overflow-hidden shadow-sm transition-all duration-300">
                      <textarea
                        {...field}
                        placeholder="e.g. I'm stressed from work and need some really good nasi lemak with extra sambal..."
                        className="w-full bg-transparent p-6 md:p-8 text-xl md:text-2xl font-medium text-foreground placeholder:text-muted-foreground outline-none resize-none min-h-[160px]"
                        data-testid="input-mood"
                      />
                      <div className="absolute bottom-4 right-4 md:bottom-6 md:right-6">
                        <button
                          type="submit"
                          disabled={getRecommendation.isPending}
                          className="bg-primary text-primary-foreground font-bold px-6 py-3 md:px-8 md:py-4 rounded-full shadow-lg hover:shadow-xl hover:bg-primary/90 transition-all flex items-center gap-2 hover:-translate-y-1 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed"
                          data-testid="button-submit-mood"
                        >
                          {getRecommendation.isPending ? (
                            <>
                              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                              <span>Finding match...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-5 h-5" />
                              <span>Find My Match</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </FormControl>
                <FormMessage className="text-destructive font-medium ml-4 mt-2" />
              </FormItem>
            )}
          />

          {/* Quick Moods */}
          <div className="flex flex-col gap-3">
            <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Try these out</span>
            <div className="flex flex-wrap gap-2">
              {quickMoods.map((mood) => (
                <button
                  key={mood}
                  type="button"
                  onClick={() => form.setValue("mood", mood)}
                  className="bg-card border border-border hover:border-primary/50 text-foreground text-sm font-medium px-4 py-2 rounded-xl transition-colors text-left"
                >
                  {mood}
                </button>
              ))}
            </div>
          </div>

          {/* Context Filters */}
          <div className="bg-card border border-border rounded-3xl p-6 shadow-sm flex flex-col gap-6">
            <div className="flex items-center gap-2 text-foreground font-bold pb-4 border-b border-border">
              <SlidersHorizontal className="w-5 h-5 text-primary" />
              <h3>Refine your context (Optional)</h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              <FormField
                control={form.control}
                name="budget"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Budget</label>
                    <select
                      {...field}
                      value={field.value || ""}
                      onChange={(e) => field.onChange(e.target.value || null)}
                      className="bg-muted border border-border text-foreground text-sm font-medium px-4 py-3 rounded-xl outline-none focus:border-primary/50"
                    >
                      <option value="">Any Budget</option>
                      <option value="RM5-RM15">RM5 - RM15</option>
                      <option value="RM15-RM30">RM15 - RM30</option>
                      <option value="RM30+">RM30+</option>
                    </select>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cuisine"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Cuisine Focus</label>
                    <select
                      {...field}
                      value={field.value || ""}
                      onChange={(e) => field.onChange(e.target.value || null)}
                      className="bg-muted border border-border text-foreground text-sm font-medium px-4 py-3 rounded-xl outline-none focus:border-primary/50"
                    >
                      <option value="">Anything goes</option>
                      <option value="Malaysian">Malaysian</option>
                      <option value="Japanese">Japanese</option>
                      <option value="Korean">Korean</option>
                      <option value="Western">Western</option>
                      <option value="Cafe">Cafe</option>
                    </select>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="atmosphere"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Vibe</label>
                    <select
                      {...field}
                      value={field.value || ""}
                      onChange={(e) => field.onChange(e.target.value || null)}
                      className="bg-muted border border-border text-foreground text-sm font-medium px-4 py-3 rounded-xl outline-none focus:border-primary/50"
                    >
                      <option value="">Don't care</option>
                      <option value="Quiet">Quiet</option>
                      <option value="Lively">Lively</option>
                      <option value="Cozy">Cozy</option>
                      <option value="Romantic">Romantic</option>
                    </select>
                  </FormItem>
                )}
              />
            </div>
          </div>

        </form>
      </Form>
    </div>
  );
}
