import { useCallback, useRef, useState } from "react";
import { Marker, Tooltip, useMapEvents } from "react-leaflet";
import { isWithinDhakaBounds } from "../config/dhakaMap.js";
import { hoverCursorIcon } from "../lib/leafletIcons.js";
import { reverseGeocode } from "../lib/reverseGeocode.js";

function LocationInfoBox({ info }) {
  if (info.loading) {
    return <p className="map-hover-info__loading">Loading location…</p>;
  }

  if (!info.lines?.length) {
    return <p className="map-hover-info__empty">Move over the map to preview address details</p>;
  }

  return (
    <ul className="map-hover-info__list">
      {info.lines.map(({ label, value }) => (
        <li key={`${label}-${value}`}>
          <span className="map-hover-info__label">{label}:</span> {value}
        </li>
      ))}
    </ul>
  );
}

export default function MapHoverInspector() {
  const [hover, setHover] = useState(null);
  const [info, setInfo] = useState({ loading: false, lines: [] });
  const requestId = useRef(0);
  const debounceRef = useRef(null);

  const loadDetails = useCallback((lat, lng) => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const id = ++requestId.current;
      setInfo({ loading: true, lines: [] });

      try {
        const details = await reverseGeocode(lat, lng);
        if (requestId.current === id) {
          setInfo({ loading: false, lines: details.lines || [] });
        }
      } catch {
        if (requestId.current === id) {
          setInfo({
            loading: false,
            lines: [{ label: "Location", value: "Details unavailable" }],
          });
        }
      }
    }, 300);
  }, []);

  useMapEvents({
    mousemove(e) {
      const { lat, lng } = e.latlng;
      if (!isWithinDhakaBounds(lat, lng)) {
        setHover(null);
        setInfo({ loading: false, lines: [] });
        return;
      }
      setHover({ lat, lng });
      loadDetails(lat, lng);
    },
    mouseout() {
      clearTimeout(debounceRef.current);
      setHover(null);
      setInfo({ loading: false, lines: [] });
    },
  });

  if (!hover) {
    return null;
  }

  return (
    <Marker
      position={[hover.lat, hover.lng]}
      icon={hoverCursorIcon}
      interactive={false}
      zIndexOffset={2000}
    >
      <Tooltip permanent direction="top" offset={[0, -10]} className="map-hover-info">
        <LocationInfoBox info={info} />
      </Tooltip>
    </Marker>
  );
}
