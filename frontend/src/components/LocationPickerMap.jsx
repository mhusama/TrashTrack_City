import { useEffect, useRef, useState } from "react";
import { MapContainer, Marker, useMap, useMapEvents } from "react-leaflet";
import toast from "react-hot-toast";
import { DHAKA_BOUNDS, DHAKA_ZOOM, isWithinDhakaBounds } from "../config/dhakaMap.js";
import { getCurrentPosition } from "../lib/geolocation.js";
import { reportMarkerIcon } from "../lib/leafletIcons.js";
import MapHoverInspector from "./MapHoverInspector.jsx";
import MapTileLayer from "./MapTileLayer.jsx";

const GPS_ZOOM = 16;

function MapClickHandler({ onPick }) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      if (isWithinDhakaBounds(lat, lng)) {
        onPick(lat, lng);
      }
    },
  });
  return null;
}

function FlyToGpsLocation({ lat, lng, fly }) {
  const map = useMap();
  const hasFlown = useRef(false);

  useEffect(() => {
    if (!fly || hasFlown.current) return;
    map.flyTo([Number(lat), Number(lng)], GPS_ZOOM, { duration: 0.8 });
    hasFlown.current = true;
  }, [map, lat, lng, fly]);

  return null;
}

export default function LocationPickerMap({
  lat,
  lng,
  onChange,
  height = "280px",
  className = "",
  fillHeight = false,
}) {
  const [locating, setLocating] = useState(true);
  const [gpsApplied, setGpsApplied] = useState(false);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    let cancelled = false;

    async function detectLocation() {
      try {
        const position = await getCurrentPosition();
        if (cancelled) return;

        const { latitude, longitude } = position.coords;

        if (isWithinDhakaBounds(latitude, longitude)) {
          onChangeRef.current(latitude, longitude);
          setGpsApplied(true);
        } else {
          toast.error(
            "Your current location is outside Dhaka city. Move the pin to your report spot."
          );
        }
      } catch (error) {
        if (cancelled) return;

        if (error.code === 1) {
          toast.error("Location permission denied. Pin your report manually on the map.");
        } else if (error.code === 2) {
          toast.error("Could not detect location. Pin your report manually on the map.");
        } else if (error.code === 3) {
          toast.error("Location request timed out. Pin your report manually on the map.");
        } else {
          toast.error("Could not detect location. Pin your report manually on the map.");
        }
      } finally {
        if (!cancelled) {
          setLocating(false);
        }
      }
    }

    detectLocation();

    return () => {
      cancelled = true;
    };
  }, []);

  const position = [Number(lat), Number(lng)];

  return (
    <div className={`space-y-2 ${className}`.trim()}>
      <p className="text-sm text-black">
        {locating
          ? "Detecting your current location…"
          : "Hover to preview the address, then click or drag the pin to adjust."}
      </p>
      <div
        className={`overflow-hidden rounded-xl border border-theme-border${fillHeight ? " location-picker-map-fill" : ""}`}
        style={fillHeight ? undefined : { height }}
      >
        <MapContainer
          center={position}
          zoom={DHAKA_ZOOM.default}
          minZoom={DHAKA_ZOOM.min}
          maxZoom={DHAKA_ZOOM.max}
          maxBounds={DHAKA_BOUNDS}
          maxBoundsViscosity={1}
          scrollWheelZoom
          className="map-hover-cursor h-full w-full"
          style={{ height: "100%", minHeight: fillHeight ? "22rem" : height }}
        >
          <MapTileLayer />
          <FlyToGpsLocation lat={lat} lng={lng} fly={gpsApplied} />
          <MapHoverInspector />
          <MapClickHandler onPick={onChange} />
          <Marker
            position={position}
            icon={reportMarkerIcon}
            draggable
            zIndexOffset={1000}
            eventHandlers={{
              dragend(e) {
                const { lat: newLat, lng: newLng } = e.target.getLatLng();
                if (isWithinDhakaBounds(newLat, newLng)) {
                  onChange(newLat, newLng);
                } else {
                  e.target.setLatLng(position);
                }
              },
            }}
          />
        </MapContainer>
      </div>
      <p className="text-xs text-black">
        {locating ? (
          "Waiting for GPS…"
        ) : (
          <>
            {Number(lat).toFixed(5)}, {Number(lng).toFixed(5)}
            {gpsApplied ? " · using your current location" : " · Dhaka city only"}
          </>
        )}
      </p>
    </div>
  );
}
