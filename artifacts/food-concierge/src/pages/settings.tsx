import { useEffect } from "react";
import { Shell } from "@/components/shell";
import { useGetUserPreferences, useUpdatePreferences } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useForm, useWatch } from "react-hook-form";
import { Settings, Save, Leaf, Flame, AlertTriangle } from "lucide-react";
import { SectionCard } from "@/components/section-card";

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

type FormValues = {
  isHalal: boolean;
  isVegetarian: boolean;
  spiceLevel: string;
  allergies: string[];
};

export default function SettingsPage() {
  const { data: preferences, isLoading } = useGetUserPreferences();
  const updatePreferences = useUpdatePreferences();
  const { toast } = useToast();

  const form = useForm<FormValues>({
    defaultValues: {
      isHalal: false,
      isVegetarian: false,
      spiceLevel: "medium",
      allergies: [],
    },
  });

  const isHalal = useWatch({ control: form.control, name: "isHalal" });
  const isVegetarian = useWatch({ control: form.control, name: "isVegetarian" });
  const spiceLevel = useWatch({ control: form.control, name: "spiceLevel" });
  const allergies = useWatch({ control: form.control, name: "allergies" }) ?? [];

  useEffect(() => {
    if (preferences) {
      form.reset({
        isHalal: preferences.isHalal ?? false,
        isVegetarian: preferences.isVegetarian ?? false,
        spiceLevel: preferences.spiceLevel ?? "medium",
        allergies: preferences.allergies ?? [],
      });
    }
  }, [preferences, form]);

  const toggleAllergen = (allergen: string) => {
    const current = form.getValues("allergies") ?? [];
    form.setValue(
      "allergies",
      current.includes(allergen) ? current.filter((a) => a !== allergen) : [...current, allergen],
      { shouldDirty: true },
    );
  };

  const onSubmit = (data: FormValues) => {
    updatePreferences.mutate({ data }, {
      onSuccess: () => toast({ title: "Settings updated", description: "Your preferences have been saved." }),
      onError: () => toast({ title: "Oops!", description: "Something went wrong.", variant: "destructive" }),
    });
  };

  if (isLoading) {
    return (
      <Shell>
        <div className="flex flex-col gap-6 max-w-2xl mx-auto py-8 animate-pulse">
          <Skeleton className="h-12 w-48 rounded-xl" />
          <Skeleton className="h-48 w-full rounded-3xl" />
          <Skeleton className="h-48 w-full rounded-3xl" />
          <Skeleton className="h-48 w-full rounded-3xl" />
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="flex flex-col gap-8 max-w-2xl mx-auto py-8">

        {/* Header */}
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight flex items-center gap-3">
            <Settings className="w-8 h-8 text-primary" />
            Preferences
          </h1>
          <p className="text-white/70 font-medium">Your dietary rules — applied to every recommendation.</p>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6">

          {/* Dietary needs */}
          <SectionCard icon={Leaf} title="Dietary needs">
            <div className="flex flex-col gap-4">
              {[
                { key: "isHalal" as const, label: "Halal only", description: "Only show restaurants that are halal-certified" },
                { key: "isVegetarian" as const, label: "Vegetarian / vegan", description: "Only show restaurants with vegetarian options" },
              ].map(({ key, label, description }) => {
                const checked = key === "isHalal" ? isHalal : isVegetarian;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => form.setValue(key, !checked, { shouldDirty: true })}
                    className={`flex items-start gap-4 p-4 rounded-2xl border-2 text-left transition-all ${
                      checked ? "border-primary bg-primary/10" : "border-white/30 hover:border-white/50 hover:bg-white/10"
                    }`}
                  >
                    <div className={`w-5 h-5 mt-0.5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                      checked ? "border-primary bg-primary" : "border-white/40"
                    }`}>
                      {checked && <div className="w-2 h-2 bg-white rounded-full" />}
                    </div>
                    <div>
                      <div className="font-bold text-foreground">{label}</div>
                      <div className="text-sm text-white/70">{description}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </SectionCard>

          {/* Spice level */}
          <SectionCard icon={Flame} title="Spice tolerance">
            <div className="flex gap-2 flex-wrap">
              {["mild", "medium", "spicy", "extra-spicy"].map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => form.setValue("spiceLevel", level, { shouldDirty: true })}
                  className={`px-5 py-2.5 rounded-full border-2 font-semibold text-sm capitalize transition-all ${
                    spiceLevel === level
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-white/30 text-white/80 hover:border-white/50 hover:bg-white/10"
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </SectionCard>

          {/* Allergies */}
          <SectionCard icon={AlertTriangle} title="Allergies">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-white/70">
                {allergies.length === 0 ? "None selected" : `${allergies.length} selected`}
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {COMMON_ALLERGENS.map((allergen) => {
                const selected = allergies.includes(allergen);
                return (
                  <button
                    key={allergen}
                    type="button"
                    onClick={() => toggleAllergen(allergen)}
                    className={`px-4 py-2 rounded-full border-2 font-semibold text-sm transition-all ${
                      selected
                        ? "border-destructive bg-destructive/10 text-destructive"
                        : "border-white/30 text-white/80 hover:border-white/50 hover:bg-white/10"
                    }`}
                  >
                    {allergen}
                  </button>
                );
              })}
            </div>
          </SectionCard>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={!form.formState.isDirty || updatePreferences.isPending}
              className="bg-foreground text-background font-bold px-8 py-4 rounded-full shadow-lg hover:shadow-xl hover:bg-foreground/90 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-5 h-5" />
              {updatePreferences.isPending ? "Saving..." : "Save Changes"}
            </button>
          </div>

        </form>
      </div>
    </Shell>
  );
}
