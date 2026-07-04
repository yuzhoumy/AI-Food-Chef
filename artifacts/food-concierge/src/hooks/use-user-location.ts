/**
 * useUserLocation — browser Geolocation + OSM Nominatim reverse geocoding.
 *
 * Usage:
 *   const { location, request } = useUserLocation();
 *   // location.status: "idle" | "requesting" | "granted" | "denied" | "error"
 *   // When "granted": location.lat, location.lng, location.label
 */

import { useState, useCallback } from "react";

export type LocationState =
  | { status: "idle" }
  | { status: "requesting" }
  | { status: "granted"; lat: number; lng: number; label: string }
  | { status: "denied" }
  | { status: "error"; message: string };

interface NominatimReverseResult {
  address?: {
    suburb?: string;
    neighbourhood?: string;
    city_district?: string;
    quarter?: string;
    city?: string;
    town?: string;
    state?: string;
  };
}

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=14`,
      {
        headers: {
          "User-Agent": "FoodConcierge/1.0 (food-recommendation-app)",
          "Accept-Language": "en",
        },
      },
    );
    if (!res.ok) return "Your location";
    const data = (await res.json()) as NominatimReverseResult;
    const addr = data.address ?? {};
    // Pick the most specific human-readable name
    return (
      addr.suburb ??
      addr.neighbourhood ??
      addr.quarter ??
      addr.city_district ??
      addr.city ??
      addr.town ??
      addr.state ??
      "Your location"
    );
  } catch {
    return "Your location";
  }
}

export function useUserLocation() {
  const [location, setLocation] = useState<LocationState>({ status: "idle" });

  const request = useCallback(() => {
    if (!navigator.geolocation) {
      setLocation({ status: "error", message: "Geolocation is not supported by your browser." });
      return;
    }

    setLocation({ status: "requesting" });

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        const label = await reverseGeocode(lat, lng);
        setLocation({ status: "granted", lat, lng, label });
      },
      (err) => {
        if (err.code === 1 /* PERMISSION_DENIED */) {
          setLocation({ status: "denied" });
        } else {
          setLocation({ status: "error", message: "Could not determine your location." });
        }
      },
      { timeout: 10_000, maximumAge: 5 * 60 * 1000 },
    );
  }, []);

  return { location, request };
}
