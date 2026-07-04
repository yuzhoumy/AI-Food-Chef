import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useGetUserPreferences, useUpdatePreferences } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, ChevronRight, Leaf, Flame, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Step = 1 | 2 | 3;

const COMMON_ALLERGENS = [
  "Peanuts",
  "Tree Nuts",
  "Shellfish",
  "Seafood",
  "Dairy",
  "Eggs",
  "Gluten",
  "Soy",
  "Sesame",
  "Msg",
];

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { data: preferences, isLoading: prefsLoading } = useGetUserPreferences();
  const updatePreferences = useUpdatePreferences();

  const [step, setStep] = useState<Step>(1);
  const [formData, setFormData] = useState({
    isHalal: false as boolean,
    isVegetarian: false as boolean,
    spiceLevel: "medium" as string,
    allergies: [] as string[],
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
          allergies: preferences.allergies ?? [],
        });
      }
    }
  }, [preferences, setLocation]);

  const handleNext = () => {
    if (step < 3) {
      setStep((s) => (s + 1) as Step);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    updatePreferences.mutate(
      { data: { ...formData, onboardingCompleted: true } },
      {
        onSuccess: () => {
          toast({ title: "Preferences saved!", description: "We're ready to find your next meal." });
          setLocation("/discover");
        },
        onError: () => {
          toast({ title: "Oops!", description: "Something went wrong saving your preferences.", variant: "destructive" });
        },
      },
    );
  };

  const toggleAllergen = (allergen: string) => {
    setFormData((prev) => ({
      ...prev,
      allergies: prev.allergies.includes(allergen)
        ? prev.allergies.filter((a) => a !== allergen)
        : [...prev.allergies, allergen],
    }));
  };

  if (prefsLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[100dvh] bg-background p-6">
        <Skeleton className="h-8 w-64 rounded-full mb-8" />
        <Skeleton className="h-64 w-full max-w-md rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[100dvh] bg-background">
      {/* Progress bar */}
      <div className="w-full h-2 bg-muted">
        <div
          className="h-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${(step / 3) * 100}%` }}
        />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 w-full max-w-2xl mx-auto">
        <div className="w-full bg-card border-2 border-border rounded-3xl p-8 md:p-12 shadow-xl">

          {/* Step 1 — Dietary needs */}
          {step === 1 && (
            <div className="animate-in slide-in-from-right-8 fade-in duration-300 flex flex-col gap-8">
              <div className="flex flex-col gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2">
                  <Leaf className="w-6 h-6" />
                </div>
                <h2 className="text-3xl font-extrabold text-foreground">Dietary Needs</h2>
                <p className="text-muted-foreground font-medium text-lg">Let's make sure we only show what you can eat.</p>
              </div>

              <div className="flex flex-col gap-4">
                {[
                  { key: "isHalal" as const, label: "Halal Only", desc: "Show only halal-certified or Muslim-owned spots" },
                  { key: "isVegetarian" as const, label: "Vegetarian", desc: "Show spots with good vegetarian options" },
                ].map(({ key, label, desc }) => (
                  <label
                    key={key}
                    className="flex items-center justify-between p-5 rounded-2xl border-2 cursor-pointer transition-all hover:bg-muted/50 data-[state=on]:border-primary data-[state=on]:bg-primary/5"
                    data-state={formData[key] ? "on" : "off"}
                    data-testid={`toggle-${key}`}
                  >
                    <div className="flex flex-col">
                      <span className="font-bold text-lg">{label}</span>
                      <span className="text-muted-foreground text-sm font-medium">{desc}</span>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${formData[key] ? "bg-primary border-primary" : "border-muted-foreground"}`}>
                      {formData[key] && <Check className="w-4 h-4 text-white" />}
                    </div>
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={formData[key]}
                      onChange={(e) => setFormData({ ...formData, [key]: e.target.checked })}
                    />
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Step 2 — Spice tolerance */}
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
                    type="button"
                    data-testid={`spice-${level.id}`}
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

          {/* Step 3 — Allergies */}
          {step === 3 && (
            <div className="animate-in slide-in-from-right-8 fade-in duration-300 flex flex-col gap-8">
              <div className="flex flex-col gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <h2 className="text-3xl font-extrabold text-foreground">Allergies</h2>
                <p className="text-muted-foreground font-medium text-lg">
                  Select anything you need to avoid. We'll keep it in mind every time.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                {COMMON_ALLERGENS.map((allergen) => {
                  const selected = formData.allergies.includes(allergen);
                  return (
                    <button
                      key={allergen}
                      type="button"
                      data-testid={`allergen-${allergen.toLowerCase().replace(/\s+/g, "-")}`}
                      onClick={() => toggleAllergen(allergen)}
                      className={`px-5 py-3 rounded-full border-2 font-bold text-sm transition-all ${
                        selected
                          ? "border-destructive bg-destructive/10 text-destructive"
                          : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
                      }`}
                    >
                      {allergen}
                    </button>
                  );
                })}
              </div>

              {formData.allergies.length === 0 && (
                <p className="text-sm text-muted-foreground font-medium">
                  Nothing selected — we'll assume no restrictions.
                </p>
              )}
            </div>
          )}

          {/* Footer nav */}
          <div className="mt-12 flex justify-between items-center pt-6 border-t border-border">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep((s) => (s - 1) as Step)}
                className="text-muted-foreground font-bold hover:text-foreground px-4 py-2 transition-colors"
              >
                Back
              </button>
            ) : (
              <div />
            )}

            <button
              type="button"
              onClick={handleNext}
              disabled={updatePreferences.isPending}
              className="bg-foreground text-background font-bold px-8 py-4 rounded-full shadow-lg hover:shadow-xl hover:bg-foreground/90 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {updatePreferences.isPending
                ? "Saving..."
                : step === 3
                ? "Complete Setup"
                : "Next Step"}
              {!updatePreferences.isPending && step < 3 && <ChevronRight className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
