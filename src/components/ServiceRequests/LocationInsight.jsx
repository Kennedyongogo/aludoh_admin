import React, { useEffect, useRef, useState } from "react";
import { Alert, Box, Button, CircularProgress, Collapse, TextField, Typography } from "@mui/material";
import { MapRounded, RefreshRounded, SearchRounded } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { adminRequest } from "../../utils/adminApi";
import { GeoChip } from "./Badges";
import { GREEN, formatDistance } from "./constants";

const POLL_MS = 3000;
const MAX_POLLS = 10;

const actionSx = {
  textTransform: "none",
  fontWeight: 600,
  borderRadius: "10px",
  px: 1.5,
  color: GREEN.main,
  border: "1px solid rgba(45, 106, 79, 0.25)",
};

const shortName = (place = "") => place.split(",")[0];

// Where the typed location was estimated to be, with ways to fix a wrong or missing match
export default function LocationInsight({ request, onUpdated, fieldSx }) {
  const navigate = useNavigate();
  const [showSearch, setShowSearch] = useState(false);
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");
  const [pollTick, setPollTick] = useState(0);
  const polls = useRef(0);
  const onUpdatedRef = useRef(onUpdated);
  onUpdatedRef.current = onUpdated;

  const status = request.geo_status;
  const located = request.geo_lat != null;
  const searchedOther =
    request.geo_query && request.location && request.geo_query.toLowerCase() !== request.location.toLowerCase();

  useEffect(() => {
    setShowSearch(false);
    setQuery(request.geo_query || request.location || "");
    setError("");
    polls.current = 0;
  }, [request.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // The lookup runs in the background right after submission; wait for it to finish
  useEffect(() => {
    if (status !== "pending" || polls.current >= MAX_POLLS) return undefined;
    const timer = setTimeout(async () => {
      polls.current += 1;
      try {
        const { data } = await adminRequest(`/api/service-requests/${request.id}`);
        if (data.geo_status !== "pending") onUpdatedRef.current(data);
        else setPollTick((t) => t + 1);
      } catch {
        setPollTick((t) => t + 1);
      }
    }, POLL_MS);
    return () => clearTimeout(timer);
  }, [status, request.id, pollTick]);

  const search = async (text) => {
    setSearching(true);
    setError("");
    try {
      const { data } = await adminRequest(`/api/service-requests/${request.id}/geocode`, {
        method: "POST",
        body: text ? { query: text } : {},
      });
      onUpdatedRef.current(data);
      if (data.geo_lat != null) setShowSearch(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSearching(false);
    }
  };

  if (!request.location && !status) {
    return <Typography sx={{ fontSize: "0.88rem", color: "text.secondary" }}>The client didn't give a location.</Typography>;
  }

  const searchOpen = showSearch || status === "not_found";

  return (
    <Box>
      <Typography sx={{ fontSize: "0.72rem", color: "text.secondary", lineHeight: 1.4 }}>Given by client</Typography>
      <Typography sx={{ fontSize: "0.95rem", color: GREEN.ink, fontWeight: 600, wordBreak: "break-word" }}>
        {request.location || "—"}
      </Typography>

      <Box
        sx={{
          mt: 1.75,
          p: 1.75,
          borderRadius: "14px",
          bgcolor: located ? "#F3F8F4" : "#FBF8F1",
          border: `1px solid ${located ? "rgba(45, 106, 79, 0.14)" : "rgba(138, 90, 0, 0.14)"}`,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, mb: 0.75 }}>
          <Typography sx={{ fontSize: "0.72rem", color: "text.secondary" }}>Detected area</Typography>
          <GeoChip status={status} />
        </Box>

        {status === "pending" && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <CircularProgress size={14} sx={{ color: GREEN.mid }} />
            <Typography sx={{ fontSize: "0.85rem", color: GREEN.ink }}>Looking up this place on the map…</Typography>
          </Box>
        )}

        {located && (
          <>
            <Typography sx={{ fontWeight: 800, fontSize: "1.05rem", color: GREEN.deep, lineHeight: 1.3 }}>
              {request.geo_county ? `${request.geo_county} County` : "County unclear"}
            </Typography>
            <Typography sx={{ fontSize: "0.82rem", color: "text.secondary", mt: 0.25 }}>{request.geo_place}</Typography>
            {request.geo_radius_m > 0 && (
              <Typography sx={{ fontSize: "0.76rem", color: "text.secondary", mt: 0.5 }}>
                Within about {formatDistance(request.geo_radius_m)} of the pin
                {status === "approximate" && " · confirm the exact spot with the client"}
              </Typography>
            )}
            {request.geo_candidates?.length > 0 && (
              <Typography sx={{ fontSize: "0.76rem", color: "#8A5A00", mt: 0.5 }}>
                Could also be:{" "}
                {request.geo_candidates.map((c) => `${shortName(c.place)} (${c.county} County)`).join(", ")}
              </Typography>
            )}
          </>
        )}

        {status === "not_found" && (
          <Typography sx={{ fontSize: "0.85rem", color: GREEN.ink }}>
            No place called “{request.geo_query || request.location}” was found in Kenya. Try another spelling or a
            nearby town.
          </Typography>
        )}

        {status === "failed" && (
          <Typography sx={{ fontSize: "0.85rem", color: GREEN.ink }}>
            The map service didn't respond. Try the lookup again.
          </Typography>
        )}

        {searchedOther && status !== "pending" && (
          <Typography sx={{ fontSize: "0.72rem", color: "text.secondary", mt: 0.75 }}>
            Searched for “{request.geo_query}” instead of the client's text
          </Typography>
        )}

        {status !== "pending" && (
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1.5 }}>
            {located && (
              <Button
                size="small"
                startIcon={<MapRounded />}
                onClick={() => navigate(`/service-requests/map?focus=${request.id}`)}
                sx={actionSx}
              >
                View on map
              </Button>
            )}
            {status === "failed" && (
              <Button
                size="small"
                startIcon={searching ? <CircularProgress size={14} color="inherit" /> : <RefreshRounded />}
                onClick={() => search(request.geo_query)}
                disabled={searching}
                sx={actionSx}
              >
                Try again
              </Button>
            )}
            {status !== "not_found" && (
              <Button size="small" startIcon={<SearchRounded />} onClick={() => setShowSearch((v) => !v)} sx={actionSx}>
                {located ? "Wrong place?" : "Search another name"}
              </Button>
            )}
          </Box>
        )}

        <Collapse in={searchOpen} unmountOnExit>
          <Box
            component="form"
            onSubmit={(e) => {
              e.preventDefault();
              if (query.trim()) search(query.trim());
            }}
            sx={{ display: "flex", gap: 1, mt: 1.5 }}
          >
            <TextField
              size="small"
              fullWidth
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. Kitengela, or Juja, Kiambu"
              inputProps={{ maxLength: 160, "aria-label": "Place name to search" }}
              sx={fieldSx}
            />
            <Button
              type="submit"
              variant="contained"
              disabled={searching || !query.trim()}
              sx={{
                flexShrink: 0,
                textTransform: "none",
                fontWeight: 700,
                borderRadius: "12px",
                boxShadow: "none",
                bgcolor: GREEN.main,
                "&:hover": { bgcolor: GREEN.deep, boxShadow: "none" },
              }}
            >
              {searching ? <CircularProgress size={18} color="inherit" /> : "Search"}
            </Button>
          </Box>
        </Collapse>

        {error && (
          <Alert severity="error" sx={{ mt: 1.5, borderRadius: "12px" }}>
            {error}
          </Alert>
        )}
      </Box>
    </Box>
  );
}
