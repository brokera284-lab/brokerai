import React, { useEffect, useState, useRef, useCallback } from "react";
import { APIProvider, Map, AdvancedMarker, Pin, useMap, useMapsLibrary } from "@vis.gl/react-google-maps";
import { Search, Loader2, Globe, ExternalLink, MapPin, Check, Plus, Minus, Navigation, Layers } from "lucide-react";

interface InteractiveMapProps {
  lat: number;
  lng: number;
  governorate?: string;
  city?: string;
  onLocationChange: (loc: { lat: number; lng: number; address?: string }) => void;
  className?: string;
}

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  "";

const hasValidKey = Boolean(API_KEY) && API_KEY !== "YOUR_API_KEY";

// Quick Real Estate Hotspot Presets in Egypt
const EGYPT_PRESETS = [
  { name: "Fifth Settlement", lat: 30.0074, lng: 31.4913 },
  { name: "Sheikh Zayed", lat: 30.0444, lng: 30.9833 },
  { name: "New Capital", lat: 30.0163, lng: 31.7371 },
  { name: "6th of October", lat: 29.9723, lng: 30.9458 },
  { name: "North Coast", lat: 30.9322, lng: 28.8711 },
  { name: "Mostakbal City", lat: 30.0833, lng: 31.6333 },
];

// Inner Google Maps Controller Component
function GoogleMapContent({
  lat,
  lng,
  onLocationChange,
  searchQuery,
  setSearchQuery,
  isSearching,
  setIsSearching,
  searchError,
  setSearchError
}: {
  lat: number;
  lng: number;
  onLocationChange: (loc: { lat: number; lng: number; address?: string }) => void;
  searchQuery: string;
  setSearchQuery: (s: string) => void;
  isSearching: boolean;
  setIsSearching: (b: boolean) => void;
  searchError: string;
  setSearchError: (s: string) => void;
}) {
  const map = useMap();
  const geocodingLib = useMapsLibrary("geocoding");
  const [markerPos, setMarkerPos] = useState({ lat: lat || 30.012, lng: lng || 30.982 });
  const [formattedAddress, setFormattedAddress] = useState("");
  const [isLocating, setIsLocating] = useState(false);

  // Sync marker position with props
  useEffect(() => {
    if (lat && lng) {
      setMarkerPos({ lat, lng });
      if (map) {
        map.panTo({ lat, lng });
      }
    }
  }, [lat, lng, map]);

  // Handle map click to re-position pin
  const handleMapClick = useCallback((e: any) => {
    if (!e.detail.latLng) return;
    const newLat = e.detail.latLng.lat;
    const newLng = e.detail.latLng.lng;
    setMarkerPos({ lat: newLat, lng: newLng });
    
    if (geocodingLib) {
      const geocoder = new geocodingLib.Geocoder();
      geocoder.geocode({ location: { lat: newLat, lng: newLng } }, (results, status) => {
        if (status === "OK" && results && results[0]) {
          setFormattedAddress(results[0].formatted_address);
          onLocationChange({ lat: newLat, lng: newLng, address: results[0].formatted_address });
        } else {
          onLocationChange({ lat: newLat, lng: newLng });
        }
      });
    } else {
      onLocationChange({ lat: newLat, lng: newLng });
    }
  }, [geocodingLib, onLocationChange]);

  // Handle Marker Drag End
  const handleDragEnd = useCallback((e: any) => {
    if (!e.latLng) return;
    const newLat = e.latLng.lat();
    const newLng = e.latLng.lng();
    setMarkerPos({ lat: newLat, lng: newLng });

    if (geocodingLib) {
      const geocoder = new geocodingLib.Geocoder();
      geocoder.geocode({ location: { lat: newLat, lng: newLng } }, (results, status) => {
        if (status === "OK" && results && results[0]) {
          setFormattedAddress(results[0].formatted_address);
          onLocationChange({ lat: newLat, lng: newLng, address: results[0].formatted_address });
        } else {
          onLocationChange({ lat: newLat, lng: newLng });
        }
      });
    } else {
      onLocationChange({ lat: newLat, lng: newLng });
    }
  }, [geocodingLib, onLocationChange]);

  // Google Maps Search
  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchError("");

    if (geocodingLib) {
      const geocoder = new geocodingLib.Geocoder();
      geocoder.geocode({ address: searchQuery }, (results, status) => {
        setIsSearching(false);
        if (status === "OK" && results && results[0]) {
          const location = results[0].geometry.location;
          const foundLat = location.lat();
          const foundLng = location.lng();
          const addr = results[0].formatted_address;

          setMarkerPos({ lat: foundLat, lng: foundLng });
          setFormattedAddress(addr);
          if (map) {
            map.panTo({ lat: foundLat, lng: foundLng });
            map.setZoom(15);
          }
          onLocationChange({ lat: foundLat, lng: foundLng, address: addr });
        } else {
          setSearchError("Location not found. Please try entering a district or landmark name.");
        }
      });
    } else {
      try {
        const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(searchQuery)}&key=${API_KEY}`);
        const data = await res.json();
        if (data.status === "OK" && data.results && data.results[0]) {
          const loc = data.results[0].geometry.location;
          const addr = data.results[0].formatted_address;
          setMarkerPos({ lat: loc.lat, lng: loc.lng });
          setFormattedAddress(addr);
          if (map) {
            map.panTo({ lat: loc.lat, lng: loc.lng });
            map.setZoom(15);
          }
          onLocationChange({ lat: loc.lat, lng: loc.lng, address: addr });
        } else {
          setSearchError("Location could not be found.");
        }
      } catch (err) {
        setSearchError("Error connecting to Google Maps.");
      } finally {
        setIsSearching(false);
      }
    }
  };

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      setSearchError("Geolocation is not supported by your browser.");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const userLat = pos.coords.latitude;
        const userLng = pos.coords.longitude;
        setMarkerPos({ lat: userLat, lng: userLng });
        if (map) {
          map.panTo({ lat: userLat, lng: userLng });
          map.setZoom(15);
        }
        onLocationChange({ lat: userLat, lng: userLng });
      },
      () => {
        setIsLocating(false);
        setSearchError("Unable to retrieve current location.");
      }
    );
  };

  const handleSelectPreset = (preset: { name: string; lat: number; lng: number }) => {
    setMarkerPos({ lat: preset.lat, lng: preset.lng });
    if (map) {
      map.panTo({ lat: preset.lat, lng: preset.lng });
      map.setZoom(14);
    }
    onLocationChange({ lat: preset.lat, lng: preset.lng, address: preset.name });
  };

  const googleMapsExternalUrl = `https://www.google.com/maps/search/?api=1&query=${markerPos.lat},${markerPos.lng}`;

  return (
    <>
      {/* Top Controls Overlay */}
      <div className="absolute top-2 sm:top-3 left-2 sm:left-3 right-2 sm:right-3 z-[1000] flex flex-col gap-1.5 sm:gap-2" dir="ltr">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-1.5 sm:gap-2">
          <div className="relative flex-1 min-w-0">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search location or district (e.g. SODIC, Zayed)..."
              className="w-full h-9 sm:h-11 pl-8 sm:pl-10 pr-3 sm:pr-4 bg-zinc-950/90 border border-white/20 focus:border-emerald-500 rounded-xl text-[11px] sm:text-xs font-sans text-white placeholder-zinc-400 backdrop-blur-xl outline-none transition-all shadow-2xl"
              dir="ltr"
            />
            <Search size={14} className="absolute top-1/2 left-2.5 sm:left-3.5 -translate-y-1/2 text-zinc-400 pointer-events-none sm:scale-110" />
          </div>

          <button
            type="submit"
            disabled={isSearching}
            className="h-9 sm:h-11 px-2.5 sm:px-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 text-white font-bold text-[11px] sm:text-xs rounded-xl flex items-center gap-1 sm:gap-1.5 shadow-xl transition-all cursor-pointer shrink-0"
          >
            {isSearching ? <Loader2 size={13} className="animate-spin" /> : "Search"}
          </button>

          <button
            type="button"
            onClick={handleLocateMe}
            disabled={isLocating}
            title="Locate Current Position"
            className="h-9 sm:h-11 px-2.5 sm:px-3 bg-zinc-900/90 hover:bg-zinc-800 border border-white/20 text-emerald-400 rounded-xl flex items-center justify-center shadow-xl transition-all cursor-pointer shrink-0"
          >
            {isLocating ? <Loader2 size={13} className="animate-spin text-emerald-400" /> : <Navigation size={14} />}
          </button>
        </form>

        {/* Quick Area Presets */}
        <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar py-0.5" dir="ltr">
          {EGYPT_PRESETS.map(preset => (
            <button
              key={preset.name}
              type="button"
              onClick={() => handleSelectPreset(preset)}
              className="px-2.5 sm:px-3 py-1 bg-zinc-950/80 hover:bg-emerald-950/80 border border-white/15 hover:border-emerald-500/50 rounded-full text-[10px] sm:text-[11px] font-medium text-zinc-200 hover:text-emerald-300 backdrop-blur-md whitespace-nowrap transition-all shadow-md cursor-pointer shrink-0 flex items-center gap-1"
            >
              <MapPin size={10} className="text-emerald-400" />
              <span>{preset.name}</span>
            </button>
          ))}
        </div>

        {searchError && (
          <div className="bg-rose-950/90 border border-rose-500/30 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs text-rose-200 shadow-xl backdrop-blur-md">
            {searchError}
          </div>
        )}
      </div>

      {/* Main Map Component */}
      <Map
        defaultCenter={{ lat: lat || 30.012, lng: lng || 30.982 }}
        defaultZoom={13}
        mapId="BROKER_AI_MAP"
        internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
        style={{ width: "100%", height: "100%" }}
        onClick={handleMapClick}
        gestureHandling="greedy"
        disableDefaultUI={false}
      >
        <AdvancedMarker
          position={markerPos}
          draggable={true}
          onDragEnd={handleDragEnd}
          title="Property Location Pin"
        >
          <Pin background="#10b981" glyphColor="#ffffff" borderColor="#ffffff" />
        </AdvancedMarker>
      </Map>

      {/* Bottom HUD Overlay */}
      <div className="absolute bottom-2 sm:bottom-3 right-2 sm:right-3 left-2 sm:left-3 z-[1000] flex flex-col sm:flex-row items-stretch sm:items-end justify-between gap-1.5 sm:gap-3 pointer-events-none" dir="ltr">
        <div className="bg-zinc-950/90 border border-white/20 backdrop-blur-xl px-3 sm:px-4 py-1.5 sm:py-2.5 rounded-xl shadow-2xl max-w-full sm:max-w-[320px] pointer-events-auto">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[8.5px] sm:text-[9px] font-mono font-bold text-emerald-400 uppercase tracking-widest">GPS COORDS</span>
          </div>
          <span className="text-[11px] sm:text-xs font-mono font-bold text-white tracking-wider block">
            {markerPos.lat.toFixed(6)}, {markerPos.lng.toFixed(6)}
          </span>
          {formattedAddress && (
            <span className="text-[9.5px] sm:text-[10px] text-zinc-300 block truncate mt-0.5">{formattedAddress}</span>
          )}
        </div>

        <a
          href={googleMapsExternalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="pointer-events-auto bg-zinc-900 hover:bg-zinc-800 border border-white/20 text-white text-[11px] sm:text-xs font-semibold px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl backdrop-blur-xl flex items-center justify-center gap-1.5 sm:gap-2 shadow-2xl transition-all"
        >
          <span>Open in Google Maps</span>
          <ExternalLink size={12} className="text-emerald-400" />
        </a>
      </div>
    </>
  );
}

// Fallback Leaflet Map Component if Google Maps Key is not yet set
function LeafletFallbackMap({
  lat,
  lng,
  onLocationChange,
  className
}: InteractiveMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerInstanceRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  const [L, setL] = useState<any>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [tileMode, setTileMode] = useState<"dark" | "satellite">("dark");

  const [currentCoords, setCurrentCoords] = useState({ lat: lat || 30.012, lng: lng || 30.982 });

  useEffect(() => {
    // Inject Leaflet CSS if missing
    if (!document.getElementById("leaflet-cdn-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-cdn-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    // Inject custom styling override for Leaflet UI controls to prevent clipping
    if (!document.getElementById("leaflet-custom-overrides")) {
      const style = document.createElement("style");
      style.id = "leaflet-custom-overrides";
      style.innerHTML = `
        .leaflet-control-attribution {
          background: rgba(9, 9, 11, 0.85) !important;
          color: #a1a1aa !important;
          font-size: 9px !important;
          border-radius: 6px !important;
          padding: 2px 8px !important;
          border: 1px solid rgba(255,255,255,0.1) !important;
          margin: 0 8px 8px 0 !important;
        }
        .leaflet-control-attribution a {
          color: #10b981 !important;
        }
      `;
      document.head.appendChild(style);
    }

    if (!window.hasOwnProperty("L")) {
      const script = document.createElement("script");
      script.id = "leaflet-cdn-js";
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.onload = () => setL((window as any).L);
      document.body.appendChild(script);
    } else {
      setL((window as any).L);
    }
  }, []);

  useEffect(() => {
    if (!L || !mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const initialLat = lat || 30.012;
    const initialLng = lng || 30.982;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 13,
      zoomControl: false, // Disabled default zoom control to prevent overlap with top search bar!
    });
    mapInstanceRef.current = map;

    const tileUrl = tileMode === "satellite" 
      ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
      : "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";

    const tileLayer = L.tileLayer(tileUrl, {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19
    }).addTo(map);
    tileLayerRef.current = tileLayer;

    const customIcon = L.divIcon({
      className: "custom-leaflet-pin",
      html: `
        <div class="flex flex-col items-center justify-center">
          <div class="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-white shadow-2xl relative">
            <svg class="w-4 h-4 text-white animate-pulse" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
          </div>
          <div class="w-2 h-2 bg-emerald-400 rounded-full blur-[2px] mt-0.5"></div>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 40]
    });

    const marker = L.marker([initialLat, initialLng], {
      draggable: true,
      icon: customIcon
    }).addTo(map);
    markerInstanceRef.current = marker;

    map.on("click", (e: any) => {
      const { lat: clickedLat, lng: clickedLng } = e.latlng;
      marker.setLatLng([clickedLat, clickedLng]);
      setCurrentCoords({ lat: clickedLat, lng: clickedLng });
      onLocationChange({ lat: clickedLat, lng: clickedLng });
    });

    marker.on("dragend", () => {
      const position = marker.getLatLng();
      setCurrentCoords({ lat: position.lat, lng: position.lng });
      onLocationChange({ lat: position.lat, lng: position.lng });
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [L, tileMode]);

  // Sync coords from props
  useEffect(() => {
    if (lat && lng && mapInstanceRef.current && markerInstanceRef.current) {
      setCurrentCoords({ lat, lng });
      markerInstanceRef.current.setLatLng([lat, lng]);
      mapInstanceRef.current.panTo([lat, lng]);
    }
  }, [lat, lng]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || !L || !mapInstanceRef.current || !markerInstanceRef.current) return;

    setIsSearching(true);
    setSearchError("");

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`
      );
      const results = await response.json();

      if (results && results.length > 0) {
        const foundLat = parseFloat(results[0].lat);
        const foundLng = parseFloat(results[0].lon);

        mapInstanceRef.current.setView([foundLat, foundLng], 14);
        markerInstanceRef.current.setLatLng([foundLat, foundLng]);
        setCurrentCoords({ lat: foundLat, lng: foundLng });
        onLocationChange({ lat: foundLat, lng: foundLng });
      } else {
        setSearchError("Location could not be found.");
      }
    } catch (err) {
      setSearchError("Error connecting to map service.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      setSearchError("Geolocation is not supported by your browser.");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const userLat = pos.coords.latitude;
        const userLng = pos.coords.longitude;
        setCurrentCoords({ lat: userLat, lng: userLng });
        if (mapInstanceRef.current && markerInstanceRef.current) {
          mapInstanceRef.current.setView([userLat, userLng], 15);
          markerInstanceRef.current.setLatLng([userLat, userLng]);
        }
        onLocationChange({ lat: userLat, lng: userLng });
      },
      () => {
        setIsLocating(false);
        setSearchError("Unable to retrieve current position.");
      }
    );
  };

  const handleSelectPreset = (preset: { name: string; lat: number; lng: number }) => {
    setCurrentCoords({ lat: preset.lat, lng: preset.lng });
    if (mapInstanceRef.current && markerInstanceRef.current) {
      mapInstanceRef.current.setView([preset.lat, preset.lng], 14);
      markerInstanceRef.current.setLatLng([preset.lat, preset.lng]);
    }
    onLocationChange({ lat: preset.lat, lng: preset.lng, address: preset.name });
  };

  const handleZoomIn = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomOut();
    }
  };

  const googleMapsExternalUrl = `https://www.google.com/maps/search/?api=1&query=${currentCoords.lat},${currentCoords.lng}`;

  return (
    <div className={`relative rounded-2xl border border-white/10 bg-zinc-950 overflow-hidden ${className || "h-[450px] w-full"} flex flex-col`}>
      {/* Top Controls Bar */}
      <div className="absolute top-2 sm:top-3 left-2 sm:left-3 right-2 sm:right-3 z-[1000] flex flex-col gap-1.5 sm:gap-2" dir="ltr">
        <form onSubmit={handleSearch} className="flex items-center gap-1.5 sm:gap-2">
          <div className="relative flex-1 min-w-0">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search location or district (e.g. SODIC, Zayed)..."
              className="w-full h-9 sm:h-11 pl-8 sm:pl-10 pr-3 sm:pr-4 bg-zinc-950/90 border border-white/20 focus:border-emerald-500 rounded-xl text-[11px] sm:text-xs font-sans text-white placeholder-zinc-400 backdrop-blur-xl outline-none transition-all shadow-2xl"
              dir="ltr"
            />
            <Search size={14} className="absolute top-1/2 left-2.5 sm:left-3.5 -translate-y-1/2 text-zinc-400 pointer-events-none sm:scale-110" />
          </div>

          <button
            type="submit"
            disabled={isSearching}
            className="h-9 sm:h-11 px-2.5 sm:px-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 text-white font-bold text-[11px] sm:text-xs rounded-xl flex items-center gap-1 sm:gap-1.5 shadow-xl transition-all cursor-pointer shrink-0"
          >
            {isSearching ? <Loader2 size={13} className="animate-spin" /> : "Search"}
          </button>

          <button
            type="button"
            onClick={handleLocateMe}
            disabled={isLocating}
            title="Locate Current Position"
            className="h-9 sm:h-11 px-2.5 sm:px-3 bg-zinc-900/90 hover:bg-zinc-800 border border-white/20 text-emerald-400 rounded-xl flex items-center justify-center shadow-xl transition-all cursor-pointer shrink-0"
          >
            {isLocating ? <Loader2 size={13} className="animate-spin text-emerald-400" /> : <Navigation size={14} />}
          </button>
        </form>

        {/* Quick Location Chips */}
        <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar py-0.5" dir="ltr">
          {EGYPT_PRESETS.map(preset => (
            <button
              key={preset.name}
              type="button"
              onClick={() => handleSelectPreset(preset)}
              className="px-2.5 sm:px-3 py-1 bg-zinc-950/85 hover:bg-emerald-950/80 border border-white/15 hover:border-emerald-500/50 rounded-full text-[10px] sm:text-[11px] font-medium text-zinc-200 hover:text-emerald-300 backdrop-blur-md whitespace-nowrap transition-all shadow-md cursor-pointer shrink-0 flex items-center gap-1"
            >
              <MapPin size={10} className="text-emerald-400" />
              <span>{preset.name}</span>
            </button>
          ))}
        </div>

        {searchError && (
          <div className="bg-rose-950/90 border border-rose-500/30 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs text-rose-200 shadow-xl backdrop-blur-md">
            {searchError}
          </div>
        )}
      </div>

      {/* Floating Left Side Controls (Custom Zoom + Tile Switcher) */}
      <div className="absolute top-24 sm:top-28 left-2 sm:left-3 z-[1000] flex flex-col gap-1 sm:gap-1.5" dir="ltr">
        <button
          type="button"
          onClick={handleZoomIn}
          title="Zoom In"
          className="w-8 h-8 sm:w-9 sm:h-9 bg-zinc-950/90 hover:bg-zinc-800 border border-white/20 text-white rounded-xl flex items-center justify-center shadow-xl backdrop-blur-md transition-all cursor-pointer"
        >
          <Plus size={15} />
        </button>
        <button
          type="button"
          onClick={handleZoomOut}
          title="Zoom Out"
          className="w-8 h-8 sm:w-9 sm:h-9 bg-zinc-950/90 hover:bg-zinc-800 border border-white/20 text-white rounded-xl flex items-center justify-center shadow-xl backdrop-blur-md transition-all cursor-pointer"
        >
          <Minus size={15} />
        </button>
        <button
          type="button"
          onClick={() => setTileMode(prev => prev === "dark" ? "satellite" : "dark")}
          title={tileMode === "dark" ? "Switch to Satellite Mode" : "Switch to Dark Mode"}
          className="w-8 h-8 sm:w-9 sm:h-9 bg-zinc-950/90 hover:bg-zinc-800 border border-white/20 text-emerald-400 rounded-xl flex items-center justify-center shadow-xl backdrop-blur-md transition-all cursor-pointer mt-0.5 sm:mt-1"
        >
          <Layers size={14} />
        </button>
      </div>

      {/* Map Canvas */}
      <div className="w-full flex-1 min-h-[300px] sm:min-h-[350px]" ref={mapContainerRef} />

      {/* Bottom HUD Overlay */}
      <div className="absolute bottom-2 sm:bottom-3 right-2 sm:right-3 left-2 sm:left-3 z-[1000] flex flex-col sm:flex-row items-stretch sm:items-end justify-between gap-1.5 sm:gap-3 pointer-events-none" dir="ltr">
        <div className="bg-zinc-950/90 border border-white/20 backdrop-blur-xl px-3 sm:px-4 py-1.5 sm:py-2.5 rounded-xl shadow-2xl max-w-full sm:max-w-[320px] pointer-events-auto">
          <span className="text-[8.5px] sm:text-[9px] font-mono font-bold text-emerald-400 block tracking-widest uppercase">GPS LOCATION</span>
          <span className="text-[11px] sm:text-xs font-mono font-bold text-white tracking-wider">
            {currentCoords.lat.toFixed(6)}, {currentCoords.lng.toFixed(6)}
          </span>
        </div>

        <a
          href={googleMapsExternalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="pointer-events-auto bg-zinc-900 hover:bg-zinc-800 border border-white/20 text-white text-[11px] sm:text-xs font-semibold px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl backdrop-blur-xl flex items-center justify-center gap-1.5 sm:gap-2 shadow-2xl transition-all"
        >
          <span>Open in Google Maps</span>
          <ExternalLink size={12} className="text-emerald-400" />
        </a>
      </div>
    </div>
  );
}

export default function InteractiveMap(props: InteractiveMapProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");

  if (hasValidKey) {
    return (
      <div className={`relative rounded-2xl border border-white/10 bg-zinc-950 overflow-hidden ${props.className || "h-[480px] w-full"}`}>
        <APIProvider apiKey={API_KEY} version="weekly">
          <GoogleMapContent
            {...props}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            isSearching={isSearching}
            setIsSearching={setIsSearching}
            searchError={searchError}
            setSearchError={setSearchError}
          />
        </APIProvider>
      </div>
    );
  }

  return <LeafletFallbackMap {...props} />;
}

