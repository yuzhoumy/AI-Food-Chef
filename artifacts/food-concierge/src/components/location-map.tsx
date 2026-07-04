/**
 * LocationMap — embeds an OpenStreetMap tile layer (via react-leaflet)
 * centred on the given coordinates with a custom pin at the centre.
 *
 * The default Leaflet marker uses PNG assets that Vite can't resolve,
 * so we use a styled DivIcon instead.
 */
import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// ── Custom pin icon using a plain div — no broken asset paths ─────────────
const PIN_HTML = `
  <div style="
    position: relative;
    width: 32px;
    height: 42px;
    display: flex;
    flex-direction: column;
    align-items: center;
  ">
    <div style="
      width: 32px;
      height: 32px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      background: linear-gradient(135deg, hsl(52,100%,50%), hsl(38,100%,48%));
      box-shadow: 0 4px 12px rgba(0,0,0,0.35);
      border: 3px solid white;
    "></div>
    <div style="
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: rgba(0,0,0,0.18);
      margin-top: 2px;
      filter: blur(2px);
    "></div>
  </div>
`;

const userIcon = L.divIcon({
  html: PIN_HTML,
  className: "",           // clear Leaflet's default white box
  iconSize: [32, 42],
  iconAnchor: [16, 42],   // tip of the pin
  popupAnchor: [0, -44],
});

// ── Recenter helper — animates map when lat/lng change ────────────────────
function RecenterOnChange({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom(), { animate: true });
  }, [lat, lng, map]);
  return null;
}

// ── Props ─────────────────────────────────────────────────────────────────
interface LocationMapProps {
  lat: number;
  lng: number;
  /** Height of the map container. Default: "220px" */
  height?: string;
  /** Zoom level. Default: 15 */
  zoom?: number;
}

// ── Component ─────────────────────────────────────────────────────────────
export function LocationMap({ lat, lng, height = "220px", zoom = 15 }: LocationMapProps) {
  return (
    <div
      style={{ height, borderRadius: "12px", overflow: "hidden" }}
      className="w-full shadow-inner"
    >
      <MapContainer
        center={[lat, lng]}
        zoom={zoom}
        style={{ height: "100%", width: "100%" }}
        zoomControl={false}
        attributionControl={false}
        scrollWheelZoom={false}
        dragging={true}
        doubleClickZoom={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        <Marker position={[lat, lng]} icon={userIcon} />
        <RecenterOnChange lat={lat} lng={lng} />
      </MapContainer>
    </div>
  );
}
