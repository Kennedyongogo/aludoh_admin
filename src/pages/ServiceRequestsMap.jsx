import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Box, Button, Chip, CircularProgress, Collapse, Divider, Paper, Typography } from "@mui/material";
import {
  ArrowBackRounded,
  CenterFocusStrongRounded,
  ExpandLessRounded,
  ExpandMoreRounded,
  PlaceRounded,
} from "@mui/icons-material";
import { Helmet } from "react-helmet-async";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import L from "leaflet";
import { Circle, GeoJSON, MapContainer, Marker, Pane, Popup, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { adminRequest } from "../utils/adminApi";
import { GeoChip, StatusChip } from "../components/ServiceRequests/Badges";
import ServiceRequestDialog from "../components/ServiceRequests/ServiceRequestDialog";
import { GREEN, STATUSES, findStatus, formatDistance } from "../components/ServiceRequests/constants";

const KENYA_BOUNDS = [
  [-4.8, 33.8],
  [5.1, 41.95],
];
// Slightly larger than Kenya so panning stops near the border
const MAX_BOUNDS = [
  [-7.5, 31],
  [7.5, 44.5],
];
// Extra top padding keeps the northern counties clear of the zoom and "Reset view" controls
const FIT_OPTIONS = { paddingTopLeft: [16, 56], paddingBottomRight: [16, 16] };
const POLL_WHILE_PENDING_MS = 4000;

const countyStyle = {
  color: GREEN.main,
  weight: 1.2,
  opacity: 0.9,
  fillColor: GREEN.light,
  fillOpacity: 0.08,
};
const countyHoverStyle = { color: GREEN.deep, weight: 2.5, fillOpacity: 0.45 };

const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

function CountiesLayer({ data, counts }) {
  const map = useMap();

  const styleFor = useCallback(
    (feature) => {
      const n = counts[feature.properties.name] || 0;
      return n ? { ...countyStyle, fillOpacity: Math.min(0.14 + n * 0.07, 0.4) } : countyStyle;
    },
    [counts]
  );

  // Leaflet keeps the handlers bound in onEachFeature, so they read the latest values via refs
  const countsRef = useRef(counts);
  const styleRef = useRef(styleFor);
  countsRef.current = counts;
  styleRef.current = styleFor;

  const onEachFeature = useCallback(
    (feature, layer) => {
      const { name } = feature.properties;
      layer.bindTooltip(
        () => {
          const n = countsRef.current[name] || 0;
          return n ? `${name} · ${plural(n, "request")}` : name;
        },
        { sticky: true, direction: "top", offset: [0, -8] }
      );
      layer.on({
        mouseover: (e) => {
          e.target.setStyle(countyHoverStyle);
          e.target.bringToFront();
        },
        mouseout: (e) => e.target.setStyle(styleRef.current(feature)),
        click: (e) => map.fitBounds(e.target.getBounds(), { padding: [32, 32] }),
      });
    },
    [map]
  );

  return <GeoJSON data={data} style={styleFor} onEachFeature={onEachFeature} />;
}

const pinIcon = (group) => {
  const count = group.items.length;
  const size = count > 1 ? 26 : 18;
  const color = findStatus(group.items[0].status).fg;
  const approx = group.geo_status === "approximate" ? " is-approx" : "";
  return L.divIcon({
    className: "request-pin",
    html: `<span class="request-pin__dot${approx}" style="background:${color}">${count > 1 ? count : ""}</span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
};

function PinPopup({ group, onOpen }) {
  const shortName = (place = "") => place.split(",")[0];
  return (
    <Box sx={{ minWidth: 220 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap", mb: 0.5 }}>
        <Typography sx={{ fontWeight: 800, fontSize: "0.95rem", color: GREEN.deep }}>
          {group.geo_county ? `${group.geo_county} County` : "Broad area"}
        </Typography>
        <GeoChip status={group.geo_status} sx={{ height: 20, fontSize: "0.65rem" }} />
      </Box>
      <Typography sx={{ fontSize: "0.78rem", color: "text.secondary", lineHeight: 1.45 }}>
        {group.geo_place}
      </Typography>
      {group.geo_radius_m > 0 && (
        <Typography sx={{ fontSize: "0.75rem", color: "text.secondary", mt: 0.25 }}>
          Within about {formatDistance(group.geo_radius_m)} of the pin
        </Typography>
      )}
      {group.geo_candidates?.length > 0 && (
        <Typography sx={{ fontSize: "0.75rem", color: "#8A5A00", mt: 0.5 }}>
          Could also be:{" "}
          {group.geo_candidates.map((c) => `${shortName(c.place)} (${c.county})`).join(", ")}
        </Typography>
      )}

      <Divider sx={{ my: 1 }} />

      <Box sx={{ maxHeight: 220, overflowY: "auto", mx: -0.75 }}>
        {group.items.map((request) => (
          <Box
            key={request.id}
            component="button"
            type="button"
            onClick={() => onOpen(request.id)}
            sx={{
              display: "block",
              width: "100%",
              textAlign: "left",
              font: "inherit",
              border: 0,
              bgcolor: "transparent",
              cursor: "pointer",
              px: 0.75,
              py: 0.75,
              borderRadius: "8px",
              "&:hover": { bgcolor: GREEN.cream },
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
              <Typography sx={{ fontWeight: 700, fontSize: "0.8rem", color: GREEN.deep }}>{request.reference}</Typography>
              <StatusChip status={request.status} sx={{ height: 20, fontSize: "0.65rem" }} />
            </Box>
            <Typography sx={{ fontSize: "0.8rem", color: GREEN.ink }}>
              {request.name} · {request.service}
            </Typography>
            <Typography sx={{ fontSize: "0.72rem", color: "text.secondary" }}>Typed: “{request.location}”</Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

function OverviewPanel({ summary, unplaced, onOpen }) {
  const [open, setOpen] = useState(() => window.matchMedia("(min-width: 900px)").matches);
  if (!summary) return null;

  const mapped = summary.found + summary.approximate;
  const details = [
    summary.approximate && `${summary.approximate} approximate`,
    unplaced.length && `${unplaced.length} not placed`,
  ].filter(Boolean);

  return (
    <Paper
      elevation={0}
      sx={{
        position: "absolute",
        zIndex: 1000,
        left: 12,
        // Leaves the OpenStreetMap attribution (bottom-right) visible when the panel is full width
        bottom: { xs: 30, sm: 12 },
        width: { xs: "calc(100% - 24px)", sm: 320 },
        maxHeight: "50%",
        display: "flex",
        flexDirection: "column",
        borderRadius: "16px",
        overflow: "hidden",
        boxShadow: "0 10px 30px rgba(15, 40, 28, 0.22)",
      }}
    >
      <Box
        component="button"
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.25,
          width: "100%",
          px: 1.75,
          py: 1.25,
          border: 0,
          bgcolor: "#fff",
          font: "inherit",
          textAlign: "left",
          cursor: "pointer",
        }}
      >
        <PlaceRounded sx={{ color: GREEN.main }} />
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography sx={{ fontWeight: 700, fontSize: "0.88rem", color: GREEN.deep }}>
            {plural(mapped, "request")} on the map
          </Typography>
          {details.length > 0 && (
            <Typography sx={{ fontSize: "0.74rem", color: "text.secondary" }}>{details.join(" · ")}</Typography>
          )}
        </Box>
        {open ? <ExpandMoreRounded sx={{ color: "text.secondary" }} /> : <ExpandLessRounded sx={{ color: "text.secondary" }} />}
      </Box>

      <Collapse in={open} sx={{ minHeight: 0, overflowY: "auto" }}>
        <Box sx={{ px: 1.75, pb: 1.5, bgcolor: "#fff" }}>
          <Typography sx={{ fontSize: "0.72rem", color: "text.secondary", mb: 1 }}>
            Estimated from the place name each client typed. Dashed circles show the likely area when the
            match is approximate.
          </Typography>

          <Box sx={{ display: "flex", flexWrap: "wrap", columnGap: 1.5, rowGap: 0.5, mb: unplaced.length ? 1.5 : 0 }}>
            {STATUSES.map((s) => (
              <Box key={s.value} sx={{ display: "flex", alignItems: "center", gap: 0.6 }}>
                <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: s.fg, border: "2px solid #fff", boxShadow: "0 0 0 1px rgba(0,0,0,0.12)" }} />
                <Typography sx={{ fontSize: "0.72rem", color: GREEN.ink }}>{s.label}</Typography>
              </Box>
            ))}
          </Box>

          {unplaced.length > 0 && (
            <>
              <Typography sx={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: GREEN.mid, mb: 0.5 }}>
                Not on the map
              </Typography>
              {unplaced.map((request) => (
                <Box
                  key={request.id}
                  component="button"
                  type="button"
                  onClick={() => onOpen(request.id)}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    width: "100%",
                    textAlign: "left",
                    font: "inherit",
                    border: 0,
                    bgcolor: "transparent",
                    cursor: "pointer",
                    px: 0.75,
                    mx: -0.75,
                    py: 0.75,
                    borderRadius: "8px",
                    "&:hover": { bgcolor: GREEN.cream },
                  }}
                >
                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Typography noWrap sx={{ fontWeight: 700, fontSize: "0.8rem", color: GREEN.deep }}>
                      {request.reference} · {request.name}
                    </Typography>
                    <Typography noWrap sx={{ fontSize: "0.72rem", color: "text.secondary" }}>
                      Typed: “{request.location}”
                    </Typography>
                  </Box>
                  <GeoChip status={request.geo_status} sx={{ height: 20, fontSize: "0.65rem", flexShrink: 0 }} />
                </Box>
              ))}
            </>
          )}
        </Box>
      </Collapse>
    </Paper>
  );
}

const overlaySx = {
  position: "absolute",
  zIndex: 1000,
};

export default function ServiceRequestsMap() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const focusId = searchParams.get("focus");

  const [map, setMap] = useState(null);
  const [counties, setCounties] = useState(null);
  const [countiesLoading, setCountiesLoading] = useState(true);
  const [requests, setRequests] = useState(null);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");
  const [admins, setAdmins] = useState([]);
  const [openId, setOpenId] = useState(null);
  const [selectedKey, setSelectedKey] = useState(null);
  const markerRefs = useRef({});

  useEffect(() => {
    let cancelled = false;
    adminRequest("/api/counties/geojson")
      .then(({ data }) => !cancelled && setCounties(data))
      .catch((err) => !cancelled && setError(err.message || "Could not load county boundaries."))
      .finally(() => !cancelled && setCountiesLoading(false));
    adminRequest("/api/users?limit=100&sortBy=name&sortOrder=ASC")
      .then(({ data }) => !cancelled && setAdmins(data))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const loadRequests = useCallback(
    () =>
      adminRequest("/api/service-requests/locations")
        .then(({ data, summary: counts }) => {
          setRequests(data);
          setSummary(counts);
        })
        .catch((err) => setError(err.message || "Could not load request locations.")),
    []
  );

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  // New or edited locations are looked up in the background; keep refreshing until they land
  useEffect(() => {
    if (!summary?.pending) return undefined;
    const timer = setTimeout(loadRequests, POLL_WHILE_PENDING_MS);
    return () => clearTimeout(timer);
  }, [summary, loadRequests]);

  const groups = useMemo(() => {
    const byPosition = new Map();
    (requests || []).forEach((request) => {
      if (request.geo_lat == null || request.geo_lng == null) return;
      const key = `${request.geo_lat.toFixed(4)},${request.geo_lng.toFixed(4)}`;
      if (!byPosition.has(key)) byPosition.set(key, { ...request, key, items: [] });
      byPosition.get(key).items.push(request);
    });
    return [...byPosition.values()].map((group) => ({ ...group, icon: pinIcon(group) }));
  }, [requests]);

  const unplaced = useMemo(() => (requests || []).filter((r) => r.geo_lat == null), [requests]);

  const countyCounts = useMemo(() => {
    const counts = {};
    (requests || []).forEach((r) => {
      if (r.geo_county) counts[r.geo_county] = (counts[r.geo_county] || 0) + 1;
    });
    return counts;
  }, [requests]);

  const countiesBounds = useMemo(() => {
    if (!counties) return null;
    const bounds = L.geoJSON(counties).getBounds();
    return bounds.isValid() ? bounds : null;
  }, [counties]);

  // Stays true until the user pans/zooms, so resizes keep the whole country in view
  const autoFit = useRef(true);

  const fitView = useCallback(
    (animate = true) => {
      if (!map) return;
      autoFit.current = true;
      map.fitBounds(countiesBounds ?? KENYA_BOUNDS, { ...FIT_OPTIONS, animate });
    },
    [map, countiesBounds]
  );

  useEffect(() => {
    if (autoFit.current) fitView();
  }, [fitView]);

  useEffect(() => {
    if (!map) return undefined;
    const container = map.getContainer();
    const stopAutoFit = () => {
      autoFit.current = false;
    };
    const events = ["pointerdown", "wheel", "keydown"];
    events.forEach((name) => container.addEventListener(name, stopAutoFit, { passive: true }));

    const observer = new ResizeObserver(() => {
      map.invalidateSize({ animate: false });
      if (autoFit.current) fitView(false);
    });
    observer.observe(container);

    return () => {
      observer.disconnect();
      events.forEach((name) => container.removeEventListener(name, stopAutoFit));
    };
  }, [map, fitView]);

  // "View on map" from a request opens this page with ?focus=<id>
  const handledFocus = useRef(null);
  useEffect(() => {
    if (!map || !focusId || !requests || handledFocus.current === location.key) return;
    handledFocus.current = location.key;
    setOpenId(null);
    setSearchParams({}, { replace: true });

    const group = groups.find((g) => g.items.some((item) => item.id === focusId));
    if (!group) {
      setOpenId(focusId);
      return;
    }
    autoFit.current = false;
    const area = L.latLng(group.geo_lat, group.geo_lng).toBounds(Math.max(group.geo_radius_m || 0, 1500) * 2.5);
    map.once("moveend", () => markerRefs.current[group.key]?.openPopup());
    map.flyToBounds(area, { ...FIT_OPTIONS, maxZoom: 13, duration: 0.9 });
  }, [map, focusId, requests, groups, location.key, setSearchParams]);

  const openRequest = useCallback((id) => {
    setOpenId(id);
  }, []);

  const loading = countiesLoading || !requests;

  return (
    <Box
      sx={{
        mt: { xs: -1, sm: -2 },
        display: "flex",
        flexDirection: "column",
        // Viewport minus the layout's fixed offsets: top bar + main padding above,
        // and the mobile bottom navigation (below md) or main padding (md+) below.
        height: {
          xs: "calc(100dvh - 72px - 80px)",
          sm: "calc(100dvh - 80px - 80px)",
          md: "calc(100dvh - 80px - 24px)",
        },
        minHeight: 360,
      }}
    >
      <Helmet>
        <title>Request locations | Mcaludoh Consultancy Admin</title>
      </Helmet>

      <Button
        onClick={() => navigate("/service-requests")}
        startIcon={<ArrowBackRounded />}
        size="small"
        sx={{ alignSelf: "flex-start", flexShrink: 0, mb: 1.5, ml: -0.5, textTransform: "none", fontWeight: 600, color: GREEN.main }}
      >
        Service requests
      </Button>

      <Box
        sx={{
          position: "relative",
          flex: 1,
          minHeight: 0,
          borderRadius: "20px",
          overflow: "hidden",
          border: "1px solid rgba(45, 106, 79, 0.15)",
          bgcolor: "#E8EEE9",
          "& .leaflet-container": { fontFamily: "inherit" },
          "& .leaflet-tooltip": {
            fontWeight: 600,
            fontSize: "0.8rem",
            color: GREEN.deep,
            borderRadius: "8px",
            border: "none",
            boxShadow: "0 6px 18px rgba(15, 40, 28, 0.18)",
          },
          "& .leaflet-popup-content-wrapper": {
            borderRadius: "14px",
            boxShadow: "0 12px 32px rgba(15, 40, 28, 0.25)",
          },
          "& .leaflet-popup-content": { m: "12px 14px", width: "auto !important" },
          "& .leaflet-popup-content p": { m: 0 },
          "& .request-pin": { background: "none", border: "none" },
          "& .request-pin__dot": {
            display: "grid",
            placeItems: "center",
            width: "100%",
            height: "100%",
            boxSizing: "border-box",
            borderRadius: "50%",
            border: "2.5px solid #fff",
            boxShadow: "0 2px 8px rgba(15, 40, 28, 0.4)",
            color: "#fff",
            fontSize: "11px",
            fontWeight: 800,
            cursor: "pointer",
          },
          "& .request-pin__dot.is-approx": {
            outline: "2px dashed rgba(138, 90, 0, 0.85)",
            outlineOffset: "2px",
          },
        }}
      >
        <MapContainer
          ref={setMap}
          bounds={KENYA_BOUNDS}
          boundsOptions={FIT_OPTIONS}
          zoomSnap={0.1}
          maxBounds={MAX_BOUNDS}
          maxBoundsViscosity={0.8}
          minZoom={5}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {counties && <CountiesLayer data={counties} counts={countyCounts} />}

          {/* Above county shapes (which jump to the front on hover), below the pins */}
          <Pane name="request-areas" style={{ zIndex: 410 }}>
            {groups
              .filter((g) => g.geo_radius_m && (g.geo_status === "approximate" || g.key === selectedKey))
              .map((g) => (
                <Circle
                  key={g.key}
                  center={[g.geo_lat, g.geo_lng]}
                  radius={g.geo_radius_m}
                  interactive={false}
                  pathOptions={{
                    color: g.geo_status === "approximate" ? "#B7791F" : GREEN.mid,
                    weight: 1.5,
                    dashArray: "6 6",
                    fillColor: g.geo_status === "approximate" ? "#F6C453" : GREEN.light,
                    fillOpacity: g.key === selectedKey ? 0.18 : 0.08,
                  }}
                />
              ))}
          </Pane>

          {groups.map((g) => (
            <Marker
              key={g.key}
              position={[g.geo_lat, g.geo_lng]}
              icon={g.icon}
              ref={(marker) => {
                if (marker) markerRefs.current[g.key] = marker;
                else delete markerRefs.current[g.key];
              }}
              eventHandlers={{
                popupopen: () => setSelectedKey(g.key),
                popupclose: () => setSelectedKey((current) => (current === g.key ? null : current)),
              }}
            >
              <Popup minWidth={230} maxWidth={300} autoPanPadding={[24, 64]}>
                <PinPopup group={g} onOpen={openRequest} />
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        <Button
          onClick={() => fitView()}
          startIcon={<CenterFocusStrongRounded />}
          size="small"
          sx={{
            ...overlaySx,
            top: 12,
            right: 12,
            textTransform: "none",
            fontWeight: 600,
            borderRadius: "10px",
            color: GREEN.main,
            bgcolor: "#fff",
            boxShadow: "0 4px 14px rgba(15, 40, 28, 0.18)",
            "&:hover": { bgcolor: "#fff" },
          }}
        >
          Reset view
        </Button>

        {loading && (
          <Chip
            icon={<CircularProgress size={14} sx={{ color: `${GREEN.main} !important` }} />}
            label="Loading map…"
            sx={{
              ...overlaySx,
              top: 14,
              left: "50%",
              transform: "translateX(-50%)",
              bgcolor: "#fff",
              fontWeight: 600,
              color: GREEN.deep,
              boxShadow: "0 4px 14px rgba(15, 40, 28, 0.18)",
            }}
          />
        )}

        {error && (
          <Alert
            severity="error"
            onClose={() => setError("")}
            sx={{ ...overlaySx, top: 56, left: 16, right: 16, borderRadius: "12px" }}
          >
            {error}
          </Alert>
        )}

        <OverviewPanel summary={summary} unplaced={unplaced} onOpen={openRequest} />
      </Box>

      <ServiceRequestDialog
        requestId={openId}
        admins={admins}
        onClose={() => setOpenId(null)}
        onSaved={loadRequests}
        onDeleted={() => {
          setOpenId(null);
          loadRequests();
        }}
      />
    </Box>
  );
}
