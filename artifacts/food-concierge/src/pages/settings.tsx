import { useEffect } from "react";
import { Shell } from "@/components/shell";
import { useGetUserPreferences, useUpdatePreferences } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useForm, useWatch } from "react-hook-form";
import { Settings, Save, Check } from "lucide-react";
import { useClerk } from "@clerk/react";

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
  const { signOut } = useClerk();

  const form = useForm<FormValues>({
    defaultValues: {
      isHalal: false,
      isVegetarian: false,
      spiceLevel: "medium",
      allergies: [],
    },
  });

  // Watch values for reactive UI
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
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight flex items-center gap-3">
              <Settings className="w-8 h-8 text-primary" />
              Preferences
            </h1>
            <p className="text-muted-foreground font-medium">Your dietary rules — applied to every recommendation.</p>
          </div>
          <button
            type="button"
            onClick={() => signOut({ redirectUrl: "/" })}
            className="px-4 py-2 border border-border text-foreground font-bold rounded-full hover:bg-muted transition-colors text-sm shrink-0"
          >
            Log Out
          </button>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6">

          {/* Dietary needs */}
          <div className="bg-card border border-border rounded-3xl p-6 md:p-8 shadow-sm flex flex-col gap-5">
            <h3 className="font-bold text-lg text-foreground border-b border-border pb-4">Dietary Needs</h3>

            <div className="flex flex-col gap-3">
              {([
                { key: "isHalal" as const, value: isHalal, label: "Halal Only", desc: "Only halal-certified or Muslim-owned spots" },
                { key: "isVegetarian" as const, value: isVegetarian, label: "Vegetarian", desc: "Spots with good vegetarian options" },
              ]).map(({ key, value, label, desc }) => (
                <label
                  key={key}
                  data-testid={`toggle-${key}`}
                  data-state={value ? "on" : "off"}
                  className="flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all hover:bg-muted/50 data-[state=on]:border-primary data-[state=on]:bg-primary/5"
                >
                  <div className="flex flex-col">
                    <span className="font-bold text-foreground">{label}</span>
                    <span className="text-muted-foreground text-sm font-medium">{desc}</span>
                  </div>
                  <input
                    type="checkbox"
                    className="hidden"
                    {...form.register(key)}
                  />
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${value ? "bg-primary border-primary" : "border-muted-foreground"}`}>
                    {value && <Check className="w-4 h-4 text-white" />}
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Spice tolerance */}
          <div className="bg-card border border-border rounded-3xl p-6 md:p-8 shadow-sm flex flex-col gap-5">
            <h3 className="font-bold text-lg text-foreground border-b border-border pb-4">Spice Tolerance</h3>

            <div className="grid grid-cols-3 gap-3">
              {[
                { id: "mild", label: "Mild", desc: "No spice" },
                { id: "medium", label: "Medium", desc: "A little kick" },
                { id: "spicy", label: "Spicy", desc: "Bring the heat" },
              ].map((level) => (
                <button
                  key={level.id}
                  type="button"
                  data-testid={`spice-${level.id}`}
                  onClick={() => form.setValue("spiceLevel", level.id, { shouldDirty: true })}
                  className={`flex flex-col items-center text-center p-5 rounded-2xl border-2 transition-all ${
                    spiceLevel === level.id
                      ? "border-primary bg-primary/5 text-foreground"
                      : "border-border bg-card text-muted-foreground hover:border-primary/30"
                  }`}
                >
                  <span className="font-bold text-base mb-0.5">{level.label}</span>
                  <span className="text-xs font-medium opacity-75">{level.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Allergies */}
          <div className="bg-card border border-border rounded-3xl p-6 md:p-8 shadow-sm flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <h3 className="font-bold text-lg text-foreground">Allergies</h3>
              <span className="text-sm font-medium text-muted-foreground">
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
                    data-testid={`allergen-${allergen.toLowerCase().replace(/\s+/g, "-")}`}
                    onClick={() => toggleAllergen(allergen)}
                    className={`px-4 py-2 rounded-full border-2 font-semibold text-sm transition-all ${
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
          </div>

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
