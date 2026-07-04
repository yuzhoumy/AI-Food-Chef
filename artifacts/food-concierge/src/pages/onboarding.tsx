import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useGetUserPreferences, useUpdatePreferences } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, ChevronRight, Utensils, Leaf, Flame, CreditCard, ShoppingBag, Coffee } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Step = 1 | 2 | 3 | 4;

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { data: preferences, isLoading: prefsLoading } = useGetUserPreferences();
  const updatePreferences = useUpdatePreferences();

  const [step, setStep] = useState<Step>(1);
  const [formData, setFormData] = useState({
    isHalal: false as boolean | null,
    isVegetarian: false as boolean | null,
    spiceLevel: "medium",
    budgetRange: "RM15-RM30",
    diningPreference: "dine-in",
    favoriteCuisines: [] as string[],
  });

  useEffect(() => {
    if (preferences) {
      if (preferences.onboardingCompleted) {
        setLocation("/discover");
      } else {
        setFormData({
          isHalal: preferences.isHalal ?? false,
          isVegetarian: preferences.isVegetarian ?? false,
          spiceLevel: preferences.spiceLevel ?? "medium",
          budgetRange: preferences.budgetRange ?? "RM15-RM30",
          diningPreference: preferences.diningPreference ?? "dine-in",
          favoriteCuisines: preferences.favoriteCuisines || [],
        });
      }
    }
  }, [preferences, setLocation]);

  const handleNext = () => {
    if (step < 4) {
      setStep((s) => (s + 1) as Step);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    updatePreferences.mutate(
      {
        data: {
          ...formData,
          onboardingCompleted: true,
        },
      },
      {
        onSuccess: () => {
          toast({
            title: "Preferences saved!",
            description: "We're ready to find your next meal.",
          });
          setLocation("/discover");
        },
        onError: () => {
          toast({
            title: "Oops!",
            description: "Something went wrong saving your preferences.",
            variant: "destructive",
          });
        },
      }
    );
  };

  const toggleCuisine = (cuisine: string) => {
    setFormData((prev) => {
      const exists = prev.favoriteCuisines.includes(cuisine);
      if (exists) {
        return { ...prev, favoriteCuisines: prev.favoriteCuisines.filter((c) => c !== cuisine) };
      }
      return { ...prev, favoriteCuisines: [...prev.favoriteCuisines, cuisine] };
    });
  };

  if (prefsLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[100dvh] bg-background p-6">
        <Skeleton className="h-8 w-64 rounded-full mb-8" />
        <Skeleton className="h-64 w-full max-w-md rounded-3xl" />
      </div>
    );
  }

  const cuisines = ["Malaysian", "Western", "Japanese", "Korean", "Chinese", "Indian", "Middle Eastern", "Cafe"];

  return (
    <div className="flex flex-col min-h-[100dvh] bg-background">
      {/* Progress bar */}
      <div className="w-full h-2 bg-muted">
        <div 
          className="h-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${(step / 4) * 100}%` }}
        ></div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 w-full max-w-2xl mx-auto">
        <div className="w-full bg-card border-2 border-border rounded-3xl p-8 md:p-12 shadow-xl relative overflow-hidden">
          
          {step === 1 && (
            <div className="animate-in slide-in-from-right-8 fade-in duration-300 flex flex-col gap-8">
              <div className="flex flex-col gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2">
                  <Leaf className="w-6 h-6" />
                </div>
                <h2 className="text-3xl font-extrabold text-foreground">Dietary Basics</h2>
                <p className="text-muted-foreground font-medium text-lg">Let's make sure we only show what you can eat.</p>
              </div>

              <div className="flex flex-col gap-4">
                <label className="flex items-center justify-between p-5 rounded-2xl border-2 cursor-pointer transition-all hover:bg-muted/50 data-[state=on]:border-primary data-[state=on]:bg-primary/5" data-state={formData.isHalal ? "on" : "off"}>
                  <div className="flex flex-col">
                    <span className="font-bold text-lg">Halal Only</span>
                    <span className="text-muted-foreground text-sm font-medium">Show only halal-certified or Muslim-owned spots</span>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${formData.isHalal ? "bg-primary border-primary" : "border-muted-foreground"}`}>
                    {formData.isHalal && <Check className="w-4 h-4 text-white" />}
                  </div>
                  <input type="checkbox" className="hidden" checked={formData.isHalal || false} onChange={(e) => setFormData({ ...formData, isHalal: e.target.checked })} />
                </label>

                <label className="flex items-center justify-between p-5 rounded-2xl border-2 cursor-pointer transition-all hover:bg-muted/50 data-[state=on]:border-primary data-[state=on]:bg-primary/5" data-state={formData.isVegetarian ? "on" : "off"}>
                  <div className="flex flex-col">
                    <span className="font-bold text-lg">Vegetarian</span>
                    <span className="text-muted-foreground text-sm font-medium">Show spots with good vegetarian options</span>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${formData.isVegetarian ? "bg-primary border-primary" : "border-muted-foreground"}`}>
                    {formData.isVegetarian && <Check className="w-4 h-4 text-white" />}
                  </div>
                  <input type="checkbox" className="hidden" checked={formData.isVegetarian || false} onChange={(e) => setFormData({ ...formData, isVegetarian: e.target.checked })} />
                </label>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-in slide-in-from-right-8 fade-in duration-300 flex flex-col gap-8">
              <div className="flex flex-col gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2">
                  <Flame className="w-6 h-6" />
                </div>
                <h2 className="text-3xl font-extrabold text-foreground">Spice Tolerance</h2>
                <p className="text-muted-foreground font-medium text-lg">How much heat can you handle?</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { id: "mild", label: "Mild", desc: "No spice, please" },
                  { id: "medium", label: "Medium", desc: "A little kick" },
                  { id: "spicy", label: "Spicy", desc: "Bring the heat" },
                ].map((level) => (
                  <button
                    key={level.id}
                    onClick={() => setFormData({ ...formData, spiceLevel: level.id })}
                    className={`flex flex-col items-center text-center p-6 rounded-2xl border-2 transition-all ${
                      formData.spiceLevel === level.id
                        ? "border-primary bg-primary/5 text-foreground"
                        : "border-border bg-card text-muted-foreground hover:border-primary/30"
                    }`}
                  >
                    <span className="font-bold text-xl mb-1">{level.label}</span>
                    <span className="text-sm font-medium opacity-80">{level.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="animate-in slide-in-from-right-8 fade-in duration-300 flex flex-col gap-8">
              <div className="flex flex-col gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2">
                  <Utensils className="w-6 h-6" />
                </div>
                <h2 className="text-3xl font-extrabold text-foreground">Favorite Cuisines</h2>
                <p className="text-muted-foreground font-medium text-lg">Pick a few you usually gravitate towards.</p>
              </div>

              <div className="flex flex-wrap gap-3">
                {cuisines.map((cuisine) => {
                  const isSelected = formData.favoriteCuisines.includes(cuisine);
                  return (
                    <button
                      key={cuisine}
                      onClick={() => toggleCuisine(cuisine)}
                      className={`px-5 py-3 rounded-full border-2 font-bold text-sm transition-all ${
                        isSelected
                          ? "border-primary bg-primary text-primary-foreground shadow-md"
                          : "border-border bg-card text-muted-foreground hover:border-primary/50"
                      }`}
                    >
                      {cuisine}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="animate-in slide-in-from-right-8 fade-in duration-300 flex flex-col gap-8">
              <div className="flex flex-col gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2">
                  <CreditCard className="w-6 h-6" />
                </div>
                <h2 className="text-3xl font-extrabold text-foreground">Standard Budget</h2>
                <p className="text-muted-foreground font-medium text-lg">What's your usual spend for a casual meal?</p>
              </div>

              <div className="flex flex-col gap-4">
                {[
                  { id: "RM5-RM15", label: "RM5 - RM15", desc: "Kopitiam, Mamak, Street Food" },
                  { id: "RM15-RM30", label: "RM15 - RM30", desc: "Casual Dining, Cafes" },
                  { id: "RM30+", label: "RM30+", desc: "Premium Restaurants, Fine Dining" },
                ].map((budget) => (
                  <label
                    key={budget.id}
                    className="flex items-center p-5 rounded-2xl border-2 cursor-pointer transition-all hover:bg-muted/50 data-[state=on]:border-primary data-[state=on]:bg-primary/5"
                    data-state={formData.budgetRange === budget.id ? "on" : "off"}
                  >
                    <input
                      type="radio"
                      name="budget"
                      className="hidden"
                      checked={formData.budgetRange === budget.id}
                      onChange={() => setFormData({ ...formData, budgetRange: budget.id })}
                    />
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mr-4 transition-colors ${formData.budgetRange === budget.id ? "border-primary" : "border-muted-foreground"}`}>
                      {formData.budgetRange === budget.id && <div className="w-3 h-3 bg-primary rounded-full"></div>}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-lg">{budget.label}</span>
                      <span className="text-muted-foreground text-sm font-medium">{budget.desc}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="mt-12 flex justify-between items-center pt-6 border-t border-border">
            {step > 1 ? (
              <button
                onClick={() => setStep((s) => (s - 1) as Step)}
                className="text-muted-foreground font-bold hover:text-foreground px-4 py-2 transition-colors"
              >
                Back
              </button>
            ) : <div></div>}

            <button
              onClick={handleNext}
              disabled={updatePreferences.isPending}
              className="bg-foreground text-background font-bold px-8 py-4 rounded-full shadow-lg hover:shadow-xl hover:bg-foreground/90 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {updatePreferences.isPending ? "Saving..." : step === 4 ? "Complete Setup" : "Next Step"}
              {!updatePreferences.isPending && step < 4 && <ChevronRight className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
