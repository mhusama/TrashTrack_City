import { useCallback, useEffect, useMemo, useState } from "react";
import { CircleMarker, MapContainer, Popup, useMap } from "react-leaflet";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  Clock,
  Layers,
  MapPin,
  Recycle,
  TrendingUp,
} from "lucide-react";
import { statisticsApi } from "../../api/client.js";
import {
  HEATMAP_SEVERITY_FILTERS,
  HEATMAP_TIME_FILTERS,
  HEATMAP_WASTE_FILTERS,
  HEAT_INTENSITY_LEGEND,
} from "../../config/heatmapConfig.js";
import { DHAKA_BOUNDS, DHAKA_CENTER, DHAKA_ZOOM } from "../../config/dhakaMap.js";
import MapTileLayer from "../MapTileLayer.jsx";
import HeatmapLayer from "./HeatmapLayer.jsx";

function MapFlyTo({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 0.8 });
  }, [map, center, zoom]);
  return null;
}

function StatCardSkeleton() {
  return (
    <div className="stats-glass-card animate-pulse p-4">
      <div className="mb-2 h-4 w-24 rounded bg-white/20" />
      <div className="h-8 w-16 rounded bg-white/30" />
    </div>
  );
}

function StatCard({ icon: Icon, label, value, accent }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="stats-glass-card group p-4 transition-shadow hover:shadow-[0_0_24px_rgba(34,211,238,0.25)]"
    >
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cyan-200/90">
        <Icon className={`h-4 w-4 ${accent}`} aria-hidden />
        {label}
      </div>
      <p className="text-2xl font-bold text-white drop-shadow-sm">{value}</p>
    </motion.div>
  );
}

function FilterChip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
        active
          ? "border-cyan-400 bg-cyan-500/30 text-white shadow-[0_0_12px_rgba(34,211,238,0.45)]"
          : "border-white/20 bg-white/5 text-slate-200 hover:border-cyan-400/50 hover:bg-white/10"
      }`}
    >
      {children}
    </button>
  );
}

function HeatmapFilterPanel({ wasteType, setWasteType, timeRange, setTimeRange, severity, setSeverity }) {
  return (
    <>
      <p className="mb-3 flex items-center gap-2 text-sm font-bold text-white">
        <TrendingUp className="h-4 w-4 text-cyan-400" />
        Smart filters
      </p>

      <div className="mb-4 space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-cyan-300/80">
              Report category
            </p>
        <div className="flex flex-wrap gap-1.5">
          {HEATMAP_WASTE_FILTERS.map((w) => (
            <FilterChip
              key={w.id}
              active={wasteType === w.id}
              onClick={() => setWasteType(w.id)}
            >
              {w.label}
            </FilterChip>
          ))}
        </div>
      </div>

      <div className="mb-4 space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-cyan-300/80">
          Time range
        </p>
        <div className="flex flex-wrap gap-1.5">
          {HEATMAP_TIME_FILTERS.map((t) => (
            <FilterChip
              key={t.id}
              active={timeRange === t.id}
              onClick={() => setTimeRange(t.id)}
            >
              {t.label}
            </FilterChip>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-cyan-300/80">
          Severity
        </p>
        <div className="flex flex-wrap gap-1.5">
          {HEATMAP_SEVERITY_FILTERS.map((s) => (
            <FilterChip
              key={s.id}
              active={severity === s.id}
              onClick={() => setSeverity(s.id)}
            >
              {s.label}
            </FilterChip>
          ))}
        </div>
      </div>
    </>
  );
}

export default function SmartHeatmapVisualization() {
  const [wasteType, setWasteType] = useState("all");
  const [timeRange, setTimeRange] = useState("all_time");
  const [severity, setSeverity] = useState("all");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mapReady, setMapReady] = useState(false);
  const [selectedHotspot, setSelectedHotspot] = useState(null);
  const [hoverHotspot, setHoverHotspot] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await statisticsApi.heatmap({ wasteType, timeRange, severity });
      setData(res.data);
      setSelectedHotspot(null);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [wasteType, timeRange, severity]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const summary = data?.summary;
  const heatPoints = data?.heatPoints || [];
  const hotspots = data?.hotspots || [];

  const tooltipHotspot = hoverHotspot || selectedHotspot;

  const avgResponseDisplay = useMemo(() => {
    if (summary?.averageResponseTimeHours == null) return "—";
    const h = summary.averageResponseTimeHours;
    if (h < 24) return `${h}h`;
    return `${Math.round((h / 24) * 10) / 10}d`;
  }, [summary]);

  return (
    <div className="stats-module space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {loading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard
              icon={Layers}
              label="Total complaints"
              value={summary?.totalComplaints ?? 0}
              accent="text-emerald-400"
            />
            <StatCard
              icon={MapPin}
              label="Most polluted area"
              value={summary?.mostPollutedArea ?? "—"}
              accent="text-orange-400"
            />
            <StatCard
              icon={Recycle}
              label="Most common category"
              value={summary?.mostCommonWasteType ?? "—"}
              accent="text-lime-400"
            />
            <StatCard
              icon={Clock}
              label="Avg response time"
              value={avgResponseDisplay}
              accent="text-violet-400"
            />
            <StatCard
              icon={Activity}
              label="Active cleaning ops"
              value={summary?.activeCleaningOperations ?? 0}
              accent="text-cyan-400"
            />
          </>
        )}
      </div>

      <div className="stats-map-shell stats-map-shell--layout overflow-hidden rounded-2xl border border-cyan-500/20">
        <div className="stats-map-canvas relative">
        <div className="stats-legend absolute bottom-4 left-3 z-[1000] rounded-lg px-3 py-2">
          <p className="mb-1 text-[10px] font-semibold uppercase text-cyan-200">Intensity</p>
          <div className="flex items-center gap-2">
            {HEAT_INTENSITY_LEGEND.map((item) => (
              <span key={item.label} className="flex items-center gap-1 text-[10px] text-white">
                <span
                  className="h-2.5 w-2.5 rounded-full shadow-[0_0_6px_currentColor]"
                  style={{ backgroundColor: item.color, color: item.color }}
                />
                {item.label}
              </span>
            ))}
          </div>
        </div>

        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[900] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm"
            >
              <div className="flex flex-col items-center gap-3">
                <div className="stats-loader h-12 w-12 rounded-full border-2 border-cyan-400/30 border-t-cyan-400" />
                <p className="text-sm font-medium text-cyan-100">Updating heatmap…</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {tooltipHotspot && !loading && (
          <div className="stats-hover-card absolute bottom-16 right-3 z-[1000] max-w-xs rounded-xl p-3 text-sm md:bottom-4 md:right-80">
            <p className="font-semibold text-white">{tooltipHotspot.area}</p>
            <ul className="mt-2 space-y-1 text-slate-200">
              <li>
                <strong>{tooltipHotspot.count}</strong> complaint{tooltipHotspot.count !== 1 ? "s" : ""}
              </li>
              <li>Category: {tooltipHotspot.dominantWasteType}</li>
              <li className="flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                {tooltipHotspot.severityLabel}
              </li>
              <li>
                Last:{" "}
                {tooltipHotspot.lastComplaintAt
                  ? new Date(tooltipHotspot.lastComplaintAt).toLocaleString("en-GB", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })
                  : "—"}
              </li>
            </ul>
          </div>
        )}

        <div className="h-[min(72vh,640px)] w-full">
          <MapContainer
            center={DHAKA_CENTER}
            zoom={DHAKA_ZOOM.default}
            minZoom={DHAKA_ZOOM.min}
            maxZoom={DHAKA_ZOOM.max}
            maxBounds={DHAKA_BOUNDS}
            scrollWheelZoom
            className="h-full w-full"
            whenReady={() => setMapReady(true)}
          >
            <MapTileLayer />
            <MapFlyTo center={DHAKA_CENTER} zoom={DHAKA_ZOOM.default} />
            {mapReady && (
              <HeatmapLayer points={heatPoints} visible={!loading && heatPoints.length > 0} />
            )}
            {hotspots.slice(0, 80).map((h, i) => (
              <CircleMarker
                key={`${h.lat}-${h.lng}-${i}`}
                center={[h.lat, h.lng]}
                radius={10 + Math.min(h.count * 3, 24)}
                pathOptions={{
                  fillOpacity: 0,
                  opacity: 0,
                  stroke: false,
                }}
                eventHandlers={{
                  mouseover: () => setHoverHotspot(h),
                  mouseout: () => setHoverHotspot(null),
                  click: () => {
                    setSelectedHotspot(h);
                    setHoverHotspot(h);
                  },
                }}
              >
                <Popup className="stats-popup">
                  <div className="min-w-[200px] p-1 text-sm text-black">
                    <p className="font-bold text-[#6b0f1a]">{h.area}</p>
                    <p className="mt-1">
                      <strong>{h.count}</strong> complaints in this zone
                    </p>
                    <p className="mt-1">Category: {h.dominantWasteType}</p>
                    <p className="mt-1">Severity: {h.severityLabel}</p>
                    <p className="mt-1 text-xs text-neutral-600">
                      Last report:{" "}
                      {h.lastComplaintAt
                        ? new Date(h.lastComplaintAt).toLocaleString()
                        : "—"}
                    </p>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>

        {!loading && heatPoints.length === 0 && (
          <p className="absolute inset-0 z-[800] flex items-center justify-center bg-slate-900/40 text-center text-sm text-white">
            No complaints match these filters. Try a wider time range or a different category.
          </p>
        )}
        </div>

        <div className="stats-filter-panel stats-filter-panel--dock">
          <HeatmapFilterPanel
            wasteType={wasteType}
            setWasteType={setWasteType}
            timeRange={timeRange}
            setTimeRange={setTimeRange}
            severity={severity}
            setSeverity={setSeverity}
          />
        </div>
      </div>
    </div>
  );
}
