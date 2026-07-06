import { useState, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { Shell } from "@/components/shell";
import { useToast } from "@/hooks/use-toast";
import { Slider } from "@/components/ui/slider";
import {
  PlusCircle,
  X,
  Upload,
  ImagePlus,
  CheckCircle2,
  Loader2,
  UtensilsCrossed,
  MapPin,
  DollarSign,
  Leaf,
} from "lucide-react";

// ── Constants ─────────────────────────────────────────────────────────────────

const CUISINE_OPTIONS = [
  "Malay", "Chinese", "Indian", "Japanese", "Korean",
  "Western", "Italian", "Thai", "Vietnamese", "Mexican",
  "Middle Eastern", "Fusion", "Seafood", "Vegetarian", "Café",
];

const OCCASION_OPTIONS = [
  "Casual Dining", "Date Night", "Family Gathering", "Business Lunch",
  "Quick Bite", "Late Night", "Weekend Brunch", "Special Occasion",
  "Group Dining", "Solo", "Takeaway",
];

// ── Image upload hook (presigned URL flow) ─────────────────────────────────────

interface UploadedImage {
  /** Stable identifier — used to avoid index-race conditions during async uploads */
  id: string;
  file: File;
  preview: string;    // local object URL for thumbnail
  objectPath: string | null; // serving path after upload (e.g. /api/storage/objects/...)
  uploading: boolean;
  error: string | null;
}

let _imgSeq = 0;
function nextId() { return `img-${++_imgSeq}`; }

function useImageUpload(apiBase: string) {
  const [images, setImages] = useState<UploadedImage[]>([]);

  const addFiles = useCallback(async (files: FileList | File[], currentCount: number) => {
    const fileArray = Array.from(files).slice(0, 10 - currentCount);
    if (fileArray.length === 0) return;

    // Assign stable IDs before any state update so async closures can reference them
    const entries = fileArray.map((file) => ({
      id: nextId(),
      file,
      preview: URL.createObjectURL(file),
      objectPath: null as string | null,
      uploading: true,
      error: null as string | null,
    }));

    setImages((prev) => [...prev, ...entries]);

    // Upload each file independently; update by stable ID, not fragile index
    await Promise.allSettled(entries.map(async (entry) => {
      try {
        // Step 1: request presigned PUT URL
        const metaRes = await fetch(`${apiBase}/storage/uploads/request-url`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: entry.file.name,
            size: entry.file.size,
            contentType: entry.file.type || "image/jpeg",
          }),
        });
        if (!metaRes.ok) throw new Error("Failed to request upload URL");
        const { uploadURL, objectPath } = await metaRes.json() as { uploadURL: string; objectPath: string };

        // Step 2: upload directly to GCS via presigned URL
        const uploadRes = await fetch(uploadURL, {
          method: "PUT",
          body: entry.file,
          headers: { "Content-Type": entry.file.type || "image/jpeg" },
        });
        if (!uploadRes.ok) throw new Error("Upload to storage failed");

        // objectPath looks like "/objects/uploads/<uuid>"; serving URL = /api/storage + objectPath
        const servingPath = `${apiBase}/storage${objectPath}`;
        setImages((prev) =>
          prev.map((img) =>
            img.id === entry.id ? { ...img, objectPath: servingPath, uploading: false } : img,
          ),
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : "Upload failed";
        setImages((prev) =>
          prev.map((img) =>
            img.id === entry.id ? { ...img, uploading: false, error: message } : img,
          ),
        );
      }
    }));
  }, [apiBase]);

  const removeImage = useCallback((id: string) => {
    setImages((prev) => {
      const img = prev.find((i) => i.id === id);
      if (img?.preview) URL.revokeObjectURL(img.preview);
      return prev.filter((i) => i.id !== id);
    });
  }, []);

  // Collect objectPaths of successfully uploaded images
  const readyPaths = images
    .filter((img) => img.objectPath && !img.error)
    .map((img) => img.objectPath!);

  const isUploading = images.some((img) => img.uploading);

  return { images, addFiles, removeImage, readyPaths, isUploading };
}

// ── Multi-select badge chip ────────────────────────────────────────────────────

function BadgeChip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 rounded-full border-2 font-bold text-base transition-all duration-150 ${
        selected
          ? "text-[hsl(220,45%,12%)] shadow-md"
          : "border-white/30 text-white hover:border-white/50 hover:bg-white/10"
      }`}
      style={
        selected
          ? {
              background: "linear-gradient(to bottom, #FFEF4D, #FFD800)",
              border: "2px solid rgba(255,255,255,0.60)",
              boxShadow: "0 3px 0 #B89200, 0 4px 12px rgba(0,0,0,0.20)",
            }
          : {}
      }
    >
      {label}
    </button>
  );
}

// ── Image upload zone ──────────────────────────────────────────────────────────

function ImageUploadZone({
  images,
  addFiles,
  removeImage,
}: ReturnType<typeof useImageUpload>) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleAdd = (files: FileList | null) => {
    if (files) addFiles(files, images.length);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files, images.length);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center gap-3 p-8 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200 ${
          dragging
            ? "border-yellow-400 bg-yellow-400/10"
            : "border-white/30 hover:border-white/50 hover:bg-white/5"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleAdd(e.target.files)}
        />
        <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
          <ImagePlus className="w-6 h-6 text-white/70" />
        </div>
        <div className="text-center">
          <p className="text-white font-bold text-base">
            {dragging ? "Drop images here" : "Click or drag to upload photos"}
          </p>
          <p className="text-white/70 text-sm font-medium mt-1">
            JPEG, PNG, WebP · Up to 10 images
          </p>
        </div>
      </div>

      {/* Preview thumbnails */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {images.map((img, displayIdx) => (
            <div key={img.id} className="relative rounded-xl overflow-hidden aspect-square bg-white/10">
              <img
                src={img.preview}
                alt={`Photo ${displayIdx + 1}`}
                className={`w-full h-full object-cover transition-opacity ${
                  img.uploading ? "opacity-40" : "opacity-100"
                }`}
              />
              {img.uploading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                </div>
              )}
              {img.objectPath && !img.uploading && (
                <div className="absolute top-1.5 left-1.5">
                  <CheckCircle2 className="w-4 h-4 text-green-400 drop-shadow" />
                </div>
              )}
              {img.error && (
                <div className="absolute inset-0 flex items-center justify-center bg-red-900/50">
                  <span className="text-xs text-red-200 text-center px-2">{img.error}</span>
                </div>
              )}
              {!img.uploading && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); removeImage(img.id); }}
                  className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80 transition-colors"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              )}
            </div>
          ))}

          {images.length < 10 && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="aspect-square rounded-xl border-2 border-dashed border-white/25 flex items-center justify-center hover:border-white/50 hover:bg-white/5 transition-all"
            >
              <PlusCircle className="w-6 h-6 text-white/40" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Section card ────────────────────────────────────────────────────────────────

function SectionCard({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-3xl p-6 md:p-8 flex flex-col gap-5"
      style={{
        background: "rgba(255,255,255,0.10)",
        backdropFilter: "blur(20px)",
        border: "1.5px solid rgba(255,255,255,0.22)",
        boxShadow: "0 4px 32px rgba(0,0,0,0.12)",
      }}
    >
      <h3 className="font-display text-xl text-white font-bold flex items-center gap-2.5">
        <Icon className="w-5 h-5 text-yellow-300 shrink-0" />
        {title}
      </h3>
      {children}
    </div>
  );
}

// ── Text field ──────────────────────────────────────────────────────────────────

function TextField({
  label,
  placeholder,
  value,
  onChange,
  multiline,
  required,
  error,
}: {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  required?: boolean;
  error?: string;
}) {
  const cls =
    "w-full rounded-xl px-4 py-3 text-white placeholder:text-white/50 font-semibold text-base outline-none transition-all resize-none " +
    "bg-white/10 border border-white/20 focus:border-yellow-400/60 focus:bg-white/15";
  return (
    <div className="flex flex-col gap-2">
      <label className="text-white text-base font-bold">
        {label} {required && <span className="text-yellow-400">*</span>}
      </label>
      {multiline ? (
        <textarea
          className={cls}
          rows={3}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          type="text"
          className={cls}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
      {error && <p className="text-red-300 text-sm font-bold">{error}</p>}
    </div>
  );
}

// ── Main page ───────────────────────────────────────────────────────────────────

type FormErrors = Partial<Record<string, string>>;

export default function AddRestaurant() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // API base — matches the path used by the generated API client hooks
  const apiBase = "/api";

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [area, setArea] = useState("");
  const [cuisines, setCuisines] = useState<string[]>([]);
  const [occasions, setOccasions] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState([20, 60]);
  const [isHalal, setIsHalal] = useState(false);
  const [isVegetarianFriendly, setIsVegetarianFriendly] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const uploadState = useImageUpload(apiBase);

  const toggleCuisine = (c: string) =>
    setCuisines((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c],
    );

  const toggleOccasion = (o: string) =>
    setOccasions((prev) =>
      prev.includes(o) ? prev.filter((x) => x !== o) : [...prev, o],
    );

  function validate(): boolean {
    const e: FormErrors = {};
    if (name.trim().length < 2) e.name = "Name must be at least 2 characters.";
    if (description.trim().length < 10)
      e.description = "Description must be at least 10 characters.";
    if (address.trim().length < 5)
      e.address = "Please enter a full address.";
    if (cuisines.length === 0)
      e.cuisines = "Select at least one cuisine.";
    if (occasions.length === 0)
      e.occasions = "Select at least one dining occasion.";
    if (priceRange[0] >= priceRange[1])
      e.price = "Min price must be less than max price.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    if (uploadState.isUploading) {
      toast({
        title: "Still uploading…",
        description: "Please wait for all images to finish uploading.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${apiBase}/restaurants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          cuisines,
          diningOccasion: occasions,
          priceMin: priceRange[0],
          priceMax: priceRange[1],
          address: address.trim(),
          area: area.trim(),
          photos: uploadState.readyPaths,
          isHalal,
          isVegetarianFriendly,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to create restaurant");
      }

      const restaurant = await res.json();
      setSubmitted(true);
      toast({
        title: "Restaurant listed! 🎉",
        description: `${restaurant.name} has been added to the directory.`,
      });

      setTimeout(() => {
        setLocation(`/restaurant/${restaurant.id}`);
      }, 1200);
    } catch (err) {
      toast({
        title: "Something went wrong",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }

  // Success state
  if (submitted) {
    return (
      <Shell>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
          <div
            className="w-24 h-24 rounded-3xl flex items-center justify-center"
            style={{
              background: "linear-gradient(to bottom, #FFEF4D, #FFD800)",
              boxShadow: "0 6px 0 #B89200",
            }}
          >
            <CheckCircle2 className="w-12 h-12 text-[hsl(220,45%,12%)]" />
          </div>
          <div>
            <h2 className="font-display text-3xl text-white">Listing submitted!</h2>
            <p className="text-white/70 mt-2">Taking you to the restaurant page…</p>
          </div>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="max-w-2xl mx-auto py-6 flex flex-col gap-8">

        {/* Header */}
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-4xl md:text-5xl text-white tracking-wide drop-shadow-sm">
            List a Restaurant
          </h1>
          <p className="text-white/70 font-medium text-lg">
            Add your venue to the Food Concierge directory.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">

          {/* Basic info */}
          <SectionCard icon={UtensilsCrossed} title="Basic info">
            <TextField
              label="Restaurant name"
              placeholder="e.g. Nasi Lemak Wanjo"
              value={name}
              onChange={setName}
              required
              error={errors.name}
            />
            <TextField
              label="Description"
              placeholder="Tell diners what makes your restaurant special…"
              value={description}
              onChange={setDescription}
              multiline
              required
              error={errors.description}
            />
          </SectionCard>

          {/* Location */}
          <SectionCard icon={MapPin} title="Location">
            <TextField
              label="Full address"
              placeholder="e.g. 56, Jalan Raja Muda Musa, Kampung Baru"
              value={address}
              onChange={setAddress}
              required
              error={errors.address}
            />
            <TextField
              label="Area / neighbourhood"
              placeholder="e.g. KLCC, Bangsar, Petaling Jaya"
              value={area}
              onChange={setArea}
            />
          </SectionCard>

          {/* Cuisines */}
          <SectionCard icon={UtensilsCrossed} title="Cuisines">
            {errors.cuisines && (
              <p className="text-red-300 text-sm font-bold -mb-2">{errors.cuisines}</p>
            )}
            <div className="flex flex-wrap gap-2">
              {CUISINE_OPTIONS.map((c) => (
                <BadgeChip
                  key={c}
                  label={c}
                  selected={cuisines.includes(c)}
                  onClick={() => toggleCuisine(c)}
                />
              ))}
            </div>
          </SectionCard>

          {/* Dining occasions */}
          <SectionCard icon={UtensilsCrossed} title="Dining occasions">
            {errors.occasions && (
              <p className="text-red-300 text-sm font-bold -mb-2">{errors.occasions}</p>
            )}
            <div className="flex flex-wrap gap-2">
              {OCCASION_OPTIONS.map((o) => (
                <BadgeChip
                  key={o}
                  label={o}
                  selected={occasions.includes(o)}
                  onClick={() => toggleOccasion(o)}
                />
              ))}
            </div>
          </SectionCard>

          {/* Price range */}
          <SectionCard icon={DollarSign} title="Price range (per person)">
            {errors.price && (
              <p className="text-red-300 text-sm font-bold -mb-2">{errors.price}</p>
            )}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span
                  className="text-2xl font-display text-white"
                >
                  RM{priceRange[0]}
                </span>
                <span className="text-white/40 font-semibold">–</span>
                <span className="text-2xl font-display text-white">
                  RM{priceRange[1]}
                </span>
              </div>
              <Slider
                min={5}
                max={300}
                step={5}
                value={priceRange}
                onValueChange={setPriceRange}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-white/60 font-bold">
                <span>RM5</span>
                <span>RM300</span>
              </div>
            </div>
          </SectionCard>

          {/* Dietary flags */}
          <SectionCard icon={Leaf} title="Dietary info">
            <div className="flex flex-col gap-3">
              {[
                {
                  label: "Halal certified",
                  description: "Food prepared according to halal standards",
                  checked: isHalal,
                  toggle: () => setIsHalal((v) => !v),
                },
                {
                  label: "Vegetarian / vegan friendly",
                  description: "Dedicated vegetarian or vegan menu options",
                  checked: isVegetarianFriendly,
                  toggle: () => setIsVegetarianFriendly((v) => !v),
                },
              ].map(({ label, description, checked, toggle }) => (
                <button
                  key={label}
                  type="button"
                  onClick={toggle}
                  className={`flex items-start gap-4 p-4 rounded-2xl border-2 text-left transition-all ${
                    checked
                      ? "border-yellow-400/60 bg-yellow-400/10"
                      : "border-white/15 hover:border-white/30 hover:bg-white/5"
                  }`}
                >
                  <div
                    className={`w-5 h-5 mt-0.5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                      checked ? "border-yellow-400 bg-yellow-400" : "border-white/40"
                    }`}
                  >
                    {checked && <div className="w-2 h-2 bg-[hsl(220,45%,12%)] rounded-full" />}
                  </div>
                  <div>
                    <div className="font-bold text-white text-base">{label}</div>
                    <div className="text-sm text-white/70 font-medium mt-0.5">{description}</div>
                  </div>
                </button>
              ))}
            </div>
          </SectionCard>

          {/* Photos */}
          <SectionCard icon={ImagePlus} title="Photos (optional)">
            <ImageUploadZone {...uploadState} />
          </SectionCard>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting || uploadState.isUploading}
            className="btn-glass-cta w-full flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Submitting…
              </>
            ) : (
              <>
                <PlusCircle className="w-5 h-5" />
                List my restaurant
              </>
            )}
          </button>
        </form>
      </div>
    </Shell>
  );
}
