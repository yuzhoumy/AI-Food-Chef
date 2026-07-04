import { useEffect } from "react";
import { Shell } from "@/components/shell";
import { useGetUserPreferences, useUpdatePreferences } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Settings, Save, Check } from "lucide-react";
import { useClerk } from "@clerk/react";

const cuisines = ["Malaysian", "Western", "Japanese", "Korean", "Chinese", "Indian", "Middle Eastern", "Cafe"];

export default function SettingsPage() {
  const { data: preferences, isLoading } = useGetUserPreferences();
  const updatePreferences = useUpdatePreferences();
  const { toast } = useToast();
  const { signOut } = useClerk();

  const form = useForm({
    defaultValues: {
      isHalal: false,
      isVegetarian: false,
      spiceLevel: "medium",
      budgetRange: "RM15-RM30",
      favoriteCuisines: [] as string[],
    }
  });

  useEffect(() => {
    if (preferences) {
      form.reset({
        isHalal: preferences.isHalal ?? false,
        isVegetarian: preferences.isVegetarian ?? false,
        spiceLevel: preferences.spiceLevel ?? "medium",
        budgetRange: preferences.budgetRange ?? "RM15-RM30",
        favoriteCuisines: preferences.favoriteCuisines || [],
      });
    }
  }, [preferences, form]);

  const onSubmit = (data: any) => {
    updatePreferences.mutate({ data }, {
      onSuccess: () => {
        toast({ title: "Settings updated", description: "Your preferences have been saved." });
      }
    });
  };

  const toggleCuisine = (cuisine: string) => {
    const current = form.getValues("favoriteCuisines");
    if (current.includes(cuisine)) {
      form.setValue("favoriteCuisines", current.filter(c => c !== cuisine), { shouldDirty: true });
    } else {
      form.setValue("favoriteCuisines", [...current, cuisine], { shouldDirty: true });
    }
  };

  if (isLoading) {
    return (
      <Shell>
        <div className="flex flex-col gap-6 max-w-3xl mx-auto p-4 animate-pulse">
          <Skeleton className="h-12 w-48 rounded-xl" />
          <Skeleton className="h-64 w-full rounded-3xl" />
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="flex flex-col gap-8 max-w-3xl mx-auto py-8">
        
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight flex items-center gap-3">
              <Settings className="w-8 h-8 text-primary" />
              Preferences
            </h1>
            <p className="text-muted-foreground font-medium">Update your core dietary rules and tastes.</p>
          </div>
          <button 
            onClick={() => signOut({ redirectUrl: "/" })}
            className="px-4 py-2 border border-border text-foreground font-bold rounded-full hover:bg-muted transition-colors text-sm"
          >
            Log Out
          </button>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-8">
            
            <div className="bg-card border border-border rounded-3xl p-6 md:p-8 shadow-sm flex flex-col gap-6">
              <h3 className="font-bold text-xl text-foreground border-b border-border pb-4">Dietary Needs</h3>
              
              <div className="grid sm:grid-cols-2 gap-4">
                <FormField control={form.control} name="isHalal" render={({ field }) => (
                  <label className="flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all hover:bg-muted/50 data-[state=on]:border-primary data-[state=on]:bg-primary/5" data-state={field.value ? "on" : "off"}>
                    <span className="font-bold text-foreground">Halal Only</span>
                    <input type="checkbox" className="hidden" checked={field.value} onChange={field.onChange} />
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${field.value ? "bg-primary border-primary" : "border-muted-foreground"}`}>
                      {field.value && <Check className="w-4 h-4 text-white" />}
                    </div>
                  </label>
                )} />

                <FormField control={form.control} name="isVegetarian" render={({ field }) => (
                  <label className="flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all hover:bg-muted/50 data-[state=on]:border-primary data-[state=on]:bg-primary/5" data-state={field.value ? "on" : "off"}>
                    <span className="font-bold text-foreground">Vegetarian</span>
                    <input type="checkbox" className="hidden" checked={field.value} onChange={field.onChange} />
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${field.value ? "bg-primary border-primary" : "border-muted-foreground"}`}>
                      {field.value && <Check className="w-4 h-4 text-white" />}
                    </div>
                  </label>
                )} />
              </div>
            </div>

            <div className="bg-card border border-border rounded-3xl p-6 md:p-8 shadow-sm flex flex-col gap-6">
              <h3 className="font-bold text-xl text-foreground border-b border-border pb-4">Spice & Budget</h3>
              
              <div className="grid sm:grid-cols-2 gap-8">
                <FormField control={form.control} name="spiceLevel" render={({ field }) => (
                  <div className="flex flex-col gap-3">
                    <span className="text-sm font-bold text-muted-foreground uppercase">Spice Level</span>
                    <select {...field} className="bg-muted border border-border text-foreground font-bold px-4 py-3 rounded-xl outline-none focus:border-primary/50">
                      <option value="mild">Mild</option>
                      <option value="medium">Medium</option>
                      <option value="spicy">Spicy</option>
                    </select>
                  </div>
                )} />

                <FormField control={form.control} name="budgetRange" render={({ field }) => (
                  <div className="flex flex-col gap-3">
                    <span className="text-sm font-bold text-muted-foreground uppercase">Standard Budget</span>
                    <select {...field} className="bg-muted border border-border text-foreground font-bold px-4 py-3 rounded-xl outline-none focus:border-primary/50">
                      <option value="RM5-RM15">RM5 - RM15</option>
                      <option value="RM15-RM30">RM15 - RM30</option>
                      <option value="RM30+">RM30+</option>
                    </select>
                  </div>
                )} />
              </div>
            </div>

            <div className="bg-card border border-border rounded-3xl p-6 md:p-8 shadow-sm flex flex-col gap-6">
              <h3 className="font-bold text-xl text-foreground border-b border-border pb-4">Favorite Cuisines</h3>
              <FormField control={form.control} name="favoriteCuisines" render={({ field }) => (
                <div className="flex flex-wrap gap-2">
                  {cuisines.map((cuisine) => {
                    const isSelected = field.value.includes(cuisine);
                    return (
                      <button
                        key={cuisine}
                        type="button"
                        onClick={() => toggleCuisine(cuisine)}
                        className={`px-4 py-2 rounded-xl font-bold text-sm transition-all border-2 ${
                          isSelected
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-card text-muted-foreground hover:border-primary/50"
                        }`}
                      >
                        {cuisine}
                      </button>
                    );
                  })}
                </div>
              )} />
            </div>

            <div className="flex justify-end pt-4">
              <button 
                type="submit"
                disabled={!form.formState.isDirty || updatePreferences.isPending}
                className="bg-foreground text-background font-bold px-8 py-4 rounded-full shadow-lg hover:shadow-xl hover:bg-foreground/90 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <Save className="w-5 h-5" />
                {updatePreferences.isPending ? "Saving..." : "Save Changes"}
              </button>
            </div>

          </form>
        </Form>

      </div>
    </Shell>
  );
}
