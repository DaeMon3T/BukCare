import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  Circle,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Navigation,
  Clock,
  Activity,
  AlertTriangle,
  Search,
  X,
  ChevronUp,
  MapPin,
  Layers,
  Crosshair,
  List,
} from "lucide-react";
import api from "@/services/api";

// ─── FIX LEAFLET BLANK ICON IN VITE ─────────────────────────────────────────
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

L.Marker.prototype.options.icon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

// ─── CUSTOM MAP ICONS ────────────────────────────────────────────────────────
const UserIcon = L.divIcon({
  className: "",
  html: `
    <div style="position:relative;width:22px;height:22px;">
      <div style="position:absolute;inset:0;background:#1a73e8;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(26,115,232,0.5);"></div>
      <div style="position:absolute;inset:-6px;background:rgba(26,115,232,0.2);border-radius:50%;animation:pulse-ring 2s ease-out infinite;"></div>
    </div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

const createHospitalIcon = (isSelected: boolean) =>
  L.divIcon({
    className: "",
    html: `
      <div style="position:relative;width:${isSelected ? 36 : 28}px;height:${isSelected ? 36 : 28}px;">
        <div style="
          width:100%;height:100%;
          background:${isSelected ? "#1a73e8" : "#ea4335"};
          border-radius:50% 50% 50% 0;
          transform:rotate(-45deg);
          border:3px solid white;
          box-shadow:0 3px 12px rgba(0,0,0,0.3);
        "></div>
        <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;">
          <svg xmlns='http://www.w3.org/2000/svg' width='${isSelected ? 14 : 11}' height='${isSelected ? 14 : 11}' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'>
            <rect x='3' y='3' width='18' height='18' rx='2'/><path d='M12 8v8M8 12h8'/>
          </svg>
        </div>
      </div>`,
    iconSize: isSelected ? [36, 36] : [28, 28],
    iconAnchor: isSelected ? [18, 36] : [14, 28],
  });

// ─── TYPES ───────────────────────────────────────────────────────────────────
interface Hospital {
  place_id: string;
  name: string;
  vicinity: string;
  lat: number;
  lng: number;
  distance_km: number;
}

// ─── PANEL STATES ────────────────────────────────────────────────────────────
// hidden → panel is fully off-screen; a floating pill appears at bottom
// peek   → just the drag handle + header row (~64px); map is ~90% visible
// half   → ~30vh; comfortable for a few list items without eating the map
// full   → ~78vh; full scrollable list / detail view
type PanelState = "hidden" | "peek" | "half" | "full";



const PANEL_HEIGHT: Record<PanelState, string> = {
  hidden: "0px",
  peek: "64px",
  half: "30vh",
  full: "78vh",
};

// ─── MAP CONTROLLER ──────────────────────────────────────────────────────────
const MapController = ({
  lat,
  lng,
  zoom = 14,
  trigger,
}: {
  lat: number;
  lng: number;
  zoom?: number;
  trigger?: unknown;
}) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], zoom, { animate: true, duration: 1.2 });
  }, [lat, lng, zoom, trigger, map]);
  return null;
};

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
const ASSUMED_SPEED_KMH = 40;

const HospitalLocator: React.FC = () => {
  const [userLoc, setUserLoc] = useState<[number, number] | null>(null);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [filteredHospitals, setFilteredHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [mapFlyTarget, setMapFlyTarget] = useState<{ lat: number; lng: number; zoom: number } | null>(null);

  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [routePolyline, setRoutePolyline] = useState<[number, number][]>([]);
  const [routeDistance, setRouteDistance] = useState<number | null>(null);
  const [etaMinutes, setEtaMinutes] = useState<number | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [routeLoading, setRouteLoading] = useState(false);

  // Default: peek — handle visible, map mostly clear
  const [panelState, setPanelState] = useState<PanelState>("peek");
  const [mapStyle, setMapStyle] = useState<"standard" | "satellite">("standard");

  const searchRef = useRef<HTMLInputElement>(null);
  const dragStartY = useRef<number | null>(null);

  const TILE_URLS = {
    standard: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    satellite:
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  };
  const TILE_ATTRS = {
    standard:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
    satellite: "Tiles &copy; Esri",
  };

  // ── 1. Geolocation ──
  useEffect(() => {
    if (!navigator.geolocation) {
      setErrorMsg("Geolocation is not supported by your browser.");
      setLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setUserLoc(coords);
        fetchHospitals(coords[0], coords[1]);
      },
      () => {
        setErrorMsg("Allow location permissions to find nearby hospitals.");
        setLoading(false);
      },
      { enableHighAccuracy: true }
    );
  }, []);

  // ── 2. Fetch hospitals ──
  const fetchHospitals = async (lat: number, lng: number) => {
    setLoading(true);
    try {
      const res = await api.get(`/hospitals/nearby?lat=${lat}&lng=${lng}&radius=15000`);
      setHospitals(res.data);
      setFilteredHospitals(res.data);
    } catch {
      setErrorMsg("Failed to load nearby facility data.");
    } finally {
      setLoading(false);
    }
  };

  // ── 3. Search filter ──
  useEffect(() => {
    const q = searchQuery.toLowerCase().trim();
    setFilteredHospitals(
      q
        ? hospitals.filter(
          (h) =>
            h.name.toLowerCase().includes(q) ||
            h.vicinity.toLowerCase().includes(q)
        )
        : hospitals
    );
  }, [searchQuery, hospitals]);

  // ── 4. Route via OSRM ──
  const handleSelectHospital = useCallback(
    async (hosp: Hospital) => {
      setSelectedHospital(hosp);
      setPanelState("half");
      setRouteLoading(true);

      if (userLoc) {
        const midLat = (userLoc[0] + hosp.lat) / 2;
        const midLng = (userLoc[1] + hosp.lng) / 2;
        setMapFlyTarget({ lat: midLat, lng: midLng, zoom: 13 });
      }

      if (!userLoc) {
        setRouteLoading(false);
        return;
      }

      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${userLoc[1]},${userLoc[0]};${hosp.lng},${hosp.lat}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        const data = await res.json();

        if (data.code === "Ok" && data.routes.length > 0) {
          const route = data.routes[0];
          const coords = route.geometry.coordinates.map(
            (c: [number, number]) => [c[1], c[0]] as [number, number]
          );
          setRoutePolyline(coords);
          const distKm = route.distance / 1000;
          setRouteDistance(distKm);
          setEtaMinutes(Math.round((distKm / ASSUMED_SPEED_KMH) * 60));
        }
      } catch {
        setRouteDistance(hosp.distance_km);
        setEtaMinutes(Math.round((hosp.distance_km / ASSUMED_SPEED_KMH) * 60));
      } finally {
        setRouteLoading(false);
      }
    },
    [userLoc]
  );

  const handleClearSelection = useCallback(() => {
    setSelectedHospital(null);
    setRoutePolyline([]);
    setRouteDistance(null);
    setEtaMinutes(null);
    setIsNavigating(false);
    setRouteLoading(false);
    setPanelState("peek");
    if (userLoc) setMapFlyTarget({ lat: userLoc[0], lng: userLoc[1], zoom: 14 });
  }, [userLoc]);

  // ── 5. Drag to resize sheet ──
  const panelUp = (s: PanelState): PanelState => {
    if (s === "hidden") return "peek";
    if (s === "peek") return "half";
    if (s === "half") return "full";
    return "full";
  };
  const panelDown = (s: PanelState): PanelState => {
    if (s === "full") return "half";
    if (s === "half") return "peek";
    if (s === "peek") return "hidden";
    return "hidden";
  };

  const handleDragStart = (e: React.TouchEvent<Element> | React.MouseEvent<Element>) => {
    dragStartY.current = "touches" in e ? (e as React.TouchEvent).touches[0]!.clientY : e.clientY;
  };
  const handleDragEnd = (e: React.TouchEvent<Element> | React.MouseEvent<Element>) => {
    if (dragStartY.current === null) return;
    const endY = "changedTouches" in e ? (e as React.TouchEvent).changedTouches[0]!.clientY : e.clientY;
    const delta = dragStartY.current - endY;
    if (delta > 40) setPanelState(panelUp);
    if (delta < -40) setPanelState(panelDown);
    dragStartY.current = null;
  };

  // ── 6. Helpers ──
  const recenter = () => {
    if (userLoc) setMapFlyTarget({ lat: userLoc[0], lng: userLoc[1], zoom: 14 });
  };

  const expandPanel = () => {
    setPanelState((s) => {
      if (s === "peek") return "half";
      if (s === "half") return "full";
      return "peek";
    });
  };

  return (
    <div
      className="relative flex flex-col w-full overflow-hidden"
      style={{ height: "calc(100vh - 80px)", fontFamily: "'DM Sans', system-ui, sans-serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');

        @keyframes pulse-ring {
          0%   { transform: scale(0.8); opacity: 0.8; }
          70%  { transform: scale(2.4); opacity: 0; }
          100% { transform: scale(2.4); opacity: 0; }
        }
        @keyframes slide-up {
          from { transform: translateY(14px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes route-dash {
          to { stroke-dashoffset: -20; }
        }
        @keyframes pill-pop {
          0%   { transform: translateX(-50%) scale(0.85); opacity: 0; }
          100% { transform: translateX(-50%) scale(1);    opacity: 1; }
        }

        .slide-up  { animation: slide-up 0.3s cubic-bezier(0.34,1.4,0.64,1) forwards; }
        .fade-in   { animation: fade-in  0.2s ease forwards; }
        .pill-pop  { animation: pill-pop 0.3s cubic-bezier(0.34,1.4,0.64,1) forwards; }

        .bottom-sheet {
          transition: height 0.38s cubic-bezier(0.32, 0.72, 0, 1);
          will-change: height;
        }

        .hosp-card { transition: background 0.13s, transform 0.13s; }
        .hosp-card:hover  { background: #eff6ff !important; transform: translateX(2px); }
        .hosp-card:active { transform: scale(0.98); }

        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

        .leaflet-control-attribution { font-size: 9px !important; }
        .leaflet-control-zoom        { display: none !important; }

        .animated-route {
          stroke-dasharray: 12 6;
          animation: route-dash 0.6s linear infinite;
        }

        .map-fab {
          transition: transform 0.15s, box-shadow 0.15s;
        }
        .map-fab:hover  { transform: translateY(-1px); }
        .map-fab:active { transform: scale(0.95); }
      `}</style>

      {/* ── FULL-SCREEN MAP ── */}
      <div className="absolute inset-0 z-0">
        {userLoc ? (
          <MapContainer center={userLoc} zoom={14} className="w-full h-full" zoomControl={false}>
            <TileLayer attribution={TILE_ATTRS[mapStyle]} url={TILE_URLS[mapStyle]} />

            {mapFlyTarget && (
              <MapController
                lat={mapFlyTarget.lat}
                lng={mapFlyTarget.lng}
                zoom={mapFlyTarget.zoom}
                trigger={mapFlyTarget}
              />
            )}

            <Circle
              center={userLoc}
              radius={15000}
              pathOptions={{
                color: "#1a73e8",
                fillColor: "#1a73e8",
                fillOpacity: 0.04,
                weight: 1.5,
                dashArray: "8 12",
              }}
            />

            <Marker position={userLoc} icon={UserIcon}>
              <Popup>You are here</Popup>
            </Marker>

            {filteredHospitals.map((hosp) => (
              <Marker
                key={hosp.place_id}
                position={[hosp.lat, hosp.lng]}
                icon={createHospitalIcon(selectedHospital?.place_id === hosp.place_id)}
                eventHandlers={{ click: () => handleSelectHospital(hosp) }}
              />
            ))}

            {routePolyline.length > 0 && (
              <>
                <Polyline positions={routePolyline} color="#fff" weight={9} opacity={0.9} />
                <Polyline positions={routePolyline} color="#1a73e8" weight={5} opacity={0.95} />
                <Polyline
                  positions={routePolyline}
                  color="#93c5fd"
                  weight={3}
                  opacity={0.6}
                  className="animated-route"
                />
              </>
            )}
          </MapContainer>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100">
            {loading ? (
              <div className="flex flex-col items-center gap-4">
                <div className="relative w-14 h-14">
                  <div className="absolute inset-0 border-4 border-blue-100 rounded-full" />
                  <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
                <p className="text-slate-500 font-medium text-sm tracking-wide">Acquiring GPS signal…</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 px-8 text-center slide-up">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center mb-1">
                  <AlertTriangle className="w-7 h-7 text-amber-500" />
                </div>
                <p className="text-slate-800 font-semibold text-base">{errorMsg}</p>
                <p className="text-slate-400 text-sm">Check your browser's location permissions.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── TOP SEARCH BAR ── */}
      <div className="absolute top-4 left-4 right-4 z-20">
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-2xl"
          style={{
            background: "rgba(255,255,255,0.96)",
            backdropFilter: "blur(20px)",
            boxShadow: "0 4px 24px rgba(0,0,0,0.12), 0 1px 4px rgba(0,0,0,0.06)",
          }}
        >
          <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <input
            ref={searchRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search hospitals & clinics…"
            className="flex-1 bg-transparent outline-none text-sm text-slate-800 placeholder:text-slate-400"
            style={{ fontFamily: "inherit" }}
            onFocus={() => {
              if (panelState === "hidden" || panelState === "peek") setPanelState("half");
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center hover:bg-slate-300 transition-colors flex-shrink-0"
            >
              <X className="w-3 h-3 text-slate-500" />
            </button>
          )}
        </div>
      </div>

      {/* ── RIGHT FLOATING CONTROLS ── */}
      <div className="absolute right-4 z-20 flex flex-col gap-2" style={{ top: "76px" }}>
        <button
          onClick={() => setMapStyle((s) => (s === "standard" ? "satellite" : "standard"))}
          className="map-fab w-10 h-10 rounded-xl flex items-center justify-center"
          style={{
            background: "rgba(255,255,255,0.96)",
            backdropFilter: "blur(12px)",
            boxShadow: "0 2px 12px rgba(0,0,0,0.14)",
          }}
          title="Toggle map style"
        >
          <Layers className="w-4 h-4 text-slate-600" />
        </button>

        <button
          onClick={recenter}
          className="map-fab w-10 h-10 rounded-xl flex items-center justify-center"
          style={{
            background: "rgba(255,255,255,0.96)",
            backdropFilter: "blur(12px)",
            boxShadow: "0 2px 12px rgba(0,0,0,0.14)",
          }}
          title="Center on my location"
        >
          <Crosshair className="w-4 h-4 text-blue-600" />
        </button>
      </div>

      {/* ── FLOATING PILL — shown only when panel is fully hidden ── */}
      {panelState === "hidden" && (
        <button
          onClick={() => setPanelState("peek")}
          className="pill-pop absolute z-20 flex items-center gap-2 px-5 py-3 rounded-full"
          style={{
            bottom: "24px",
            left: "50%",
            /* transform handled by animation, fallback: */
            transform: "translateX(-50%)",
            background: "rgba(255,255,255,0.97)",
            backdropFilter: "blur(16px)",
            boxShadow: "0 4px 20px rgba(0,0,0,0.18)",
          }}
        >
          <List className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-semibold text-slate-700">
            {filteredHospitals.length} nearby
          </span>
          <ChevronUp className="w-4 h-4 text-slate-400" />
        </button>
      )}

      {/* ── BOTTOM SHEET ── */}
      {panelState !== "hidden" && (
        <div
          className="bottom-sheet absolute bottom-0 left-0 right-0 z-20 flex flex-col rounded-t-3xl overflow-hidden"
          style={{
            height: PANEL_HEIGHT[panelState],
            background: "rgba(255,255,255,0.97)",
            backdropFilter: "blur(24px)",
            boxShadow: "0 -6px 32px rgba(0,0,0,0.1), 0 -1px 0 rgba(0,0,0,0.04)",
          }}
        >
          {/* ── Drag handle + header ── */}
          <div
            className="flex-shrink-0 cursor-grab active:cursor-grabbing select-none"
            onMouseDown={handleDragStart}
            onMouseUp={handleDragEnd}
            onTouchStart={handleDragStart}
            onTouchEnd={handleDragEnd}
          >
            {/* Pill handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-slate-200" />
            </div>

            {/* Header row */}
            <div className="flex items-center justify-between px-5 py-2">
              {/* Left label */}
              {selectedHospital ? (
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center">
                    <Navigation className="w-3 h-3 text-blue-600" />
                  </div>
                  <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">
                    Route details
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-red-50 flex items-center justify-center">
                    <Activity className="w-3 h-3 text-red-500" />
                  </div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                    {loading ? "Loading…" : `${filteredHospitals.length} facilities nearby`}
                  </span>
                </div>
              )}

              {/* Right controls */}
              <div className="flex items-center gap-1">
                {/* Expand / shrink */}
                <button
                  onClick={expandPanel}
                  className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
                  title="Expand panel"
                >
                  <ChevronUp
                    className="w-4 h-4 text-slate-500 transition-transform duration-300"
                    style={{ transform: panelState === "full" ? "rotate(180deg)" : "none" }}
                  />
                </button>

                {/* Collapse completely */}
                <button
                  onClick={() => setPanelState("hidden")}
                  className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
                  title="Hide panel"
                >
                  <X className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </div>
            </div>
          </div>

          {/* ── SCROLLABLE CONTENT (hidden in peek state) ── */}
          {panelState !== "peek" && (
            <>
              {selectedHospital ? (
                /* ── DETAIL VIEW ── */
                <div className="flex-1 overflow-y-auto no-scrollbar px-5 pb-6">
                  <div className="flex items-start justify-between mb-4 slide-up">
                    <div className="flex-1 pr-3">
                      <h2 className="font-bold text-lg text-slate-900 leading-snug">
                        {selectedHospital.name}
                      </h2>
                      <div className="flex items-center gap-1.5 mt-1">
                        <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
                        <p className="text-xs text-slate-400 line-clamp-1">{selectedHospital.vicinity}</p>
                      </div>
                    </div>
                    <button
                      onClick={handleClearSelection}
                      className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors flex-shrink-0"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Metrics cards */}
                  <div className="grid grid-cols-2 gap-3 mb-4 slide-up" style={{ animationDelay: "0.04s" }}>
                    <div
                      className="rounded-2xl p-4 flex flex-col"
                      style={{ background: "linear-gradient(135deg,#eff6ff,#dbeafe)" }}
                    >
                      <div className="flex items-center gap-1.5 mb-2">
                        <div className="w-6 h-6 rounded-lg bg-white/70 flex items-center justify-center">
                          <Navigation className="w-3 h-3 text-blue-600" />
                        </div>
                        <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">
                          Distance
                        </span>
                      </div>
                      {routeLoading ? (
                        <div className="h-7 w-14 bg-blue-200/50 rounded-lg animate-pulse" />
                      ) : (
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-black text-blue-700">
                            {routeDistance !== null
                              ? routeDistance.toFixed(1)
                              : selectedHospital.distance_km.toFixed(1)}
                          </span>
                          <span className="text-xs font-bold text-blue-400">km</span>
                        </div>
                      )}
                      <span className="text-[10px] text-blue-400/70 mt-0.5">via road</span>
                    </div>

                    <div
                      className="rounded-2xl p-4 flex flex-col"
                      style={{ background: "linear-gradient(135deg,#f0fdf4,#dcfce7)" }}
                    >
                      <div className="flex items-center gap-1.5 mb-2">
                        <div className="w-6 h-6 rounded-lg bg-white/70 flex items-center justify-center">
                          <Clock className="w-3 h-3 text-emerald-600" />
                        </div>
                        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                          ETA
                        </span>
                      </div>
                      {routeLoading ? (
                        <div className="h-7 w-14 bg-emerald-200/50 rounded-lg animate-pulse" />
                      ) : (
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-black text-emerald-700">
                            {etaMinutes ?? "--"}
                          </span>
                          <span className="text-xs font-bold text-emerald-400">min</span>
                        </div>
                      )}
                      <span className="text-[10px] text-emerald-400/70 mt-0.5">
                        @ {ASSUMED_SPEED_KMH} km/h
                      </span>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2 slide-up" style={{ animationDelay: "0.08s" }}>
                    {isNavigating ? (
                      <button
                        onClick={handleClearSelection}
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-semibold text-sm transition-all active:scale-95"
                        style={{ background: "#fee2e2", color: "#dc2626" }}
                      >
                        <X className="w-4 h-4" /> Cancel Navigation
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => setIsNavigating(true)}
                          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-semibold text-sm text-white transition-all active:scale-95"
                          style={{
                            background: "linear-gradient(135deg,#1a73e8,#1557b0)",
                            boxShadow: "0 4px 14px rgba(26,115,232,0.35)",
                          }}
                        >
                          <Navigation className="w-4 h-4" /> Start Navigation
                        </button>
                        <button
                          onClick={() =>
                            window.open(
                              `https://www.google.com/maps/dir/?api=1&destination=${selectedHospital.lat},${selectedHospital.lng}`,
                              "_blank"
                            )
                          }
                          className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all active:scale-95"
                          style={{ background: "#f1f5f9", border: "1.5px solid #e2e8f0" }}
                          title="Open in Google Maps"
                        >
                          <MapPin className="w-4 h-4 text-blue-600" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                /* ── LIST VIEW ── */
                <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-4">
                  {/* Skeleton loaders */}
                  {loading && (
                    <div className="space-y-3 pt-1">
                      {[...Array(3)].map((_, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-3 p-3.5 rounded-2xl animate-pulse"
                          style={{ background: "#f8fafc", animationDelay: `${i * 0.07}s` }}
                        >
                          <div className="w-10 h-10 rounded-xl bg-slate-200 flex-shrink-0" />
                          <div className="flex-1 space-y-2">
                            <div className="h-3 bg-slate-200 rounded w-3/4" />
                            <div className="h-2.5 bg-slate-100 rounded w-1/2" />
                          </div>
                          <div className="w-10 h-7 bg-slate-200 rounded-lg" />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Empty state */}
                  {!loading && filteredHospitals.length === 0 && (
                    <div className="flex flex-col items-center py-8 text-center fade-in">
                      <div className="w-11 h-11 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                        <Activity className="w-5 h-5 text-slate-300" />
                      </div>
                      <p className="text-slate-500 font-semibold text-sm">
                        {searchQuery
                          ? `No results for "${searchQuery}"`
                          : "No facilities found within 15km."}
                      </p>
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery("")}
                          className="mt-2 text-xs text-blue-500 font-semibold"
                        >
                          Clear search
                        </button>
                      )}
                    </div>
                  )}

                  {/* Hospital cards */}
                  <div className="space-y-2 pt-1">
                    {filteredHospitals.map((h, i) => (
                      <div
                        key={h.place_id}
                        className="hosp-card fade-in flex items-center gap-3 p-3 rounded-2xl cursor-pointer"
                        style={{
                          background: "#f8fafc",
                          border: "1.5px solid #f1f5f9",
                          animationDelay: `${i * 0.035}s`,
                        }}
                        onClick={() => handleSelectHospital(h)}
                      >
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: "#fee2e2" }}
                        >
                          <Activity className="w-4 h-4" style={{ color: "#ef4444" }} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm truncate text-slate-800">
                            {h.name}
                          </h4>
                          <p className="text-xs text-slate-400 truncate mt-0.5">{h.vicinity}</p>
                        </div>

                        <div
                          className="flex-shrink-0 rounded-xl px-2.5 py-1.5"
                          style={{ background: "#f1f5f9" }}
                        >
                          <span className="text-sm font-black text-blue-500">
                            {h.distance_km}
                          </span>
                          <span className="text-[10px] font-bold text-blue-300 ml-0.5">km</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default HospitalLocator;