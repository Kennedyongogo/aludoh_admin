import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
  useMediaQuery,
} from "@mui/material";
import {
  ChevronLeftRounded,
  ChevronRightRounded,
  ClearRounded,
  InboxRounded,
  SearchRounded,
} from "@mui/icons-material";
import { Helmet } from "react-helmet-async";
import { adminRequest, buildQuery } from "../utils/adminApi";
import { PriorityChip, StatusChip } from "../components/ServiceRequests/Badges";
import ServiceRequestDrawer from "../components/ServiceRequests/ServiceRequestDrawer";
import {
  GREEN,
  HANDLER_FILTERS,
  PRIORITIES,
  SORT_OPTIONS,
  STATUSES,
  formatDate,
  timeAgo,
} from "../components/ServiceRequests/constants";

const ROWS_PER_PAGE_OPTIONS = [10, 25, 50];

const filterSx = {
  minWidth: { xs: "100%", sm: 160 },
  "& .MuiOutlinedInput-root": {
    borderRadius: "12px",
    bgcolor: "#fff",
    "&.Mui-focused fieldset": { borderColor: GREEN.mid },
  },
  "& .MuiInputLabel-root.Mui-focused": { color: GREEN.main },
};

function SummaryCard({ label, count, active, color, onClick }) {
  return (
    <Box
      component="button"
      type="button"
      onClick={onClick}
      aria-pressed={active}
      sx={{
        textAlign: "left",
        cursor: "pointer",
        px: 2,
        py: 1.5,
        borderRadius: "16px 16px 16px 6px",
        border: "1px solid",
        borderColor: active ? GREEN.mid : "rgba(45, 106, 79, 0.12)",
        bgcolor: active ? GREEN.mist : "#fff",
        boxShadow: active ? "0 6px 18px rgba(45, 106, 79, 0.15)" : "none",
        transition: "all 0.2s ease",
        font: "inherit",
        "&:hover": { borderColor: GREEN.mid },
        "&:focus-visible": { outline: `2px solid ${GREEN.mid}`, outlineOffset: 2 },
      }}
    >
      <Typography sx={{ fontSize: "1.5rem", fontWeight: 700, color: color || GREEN.deep, lineHeight: 1.1 }}>
        {count ?? "–"}
      </Typography>
      <Typography
        noWrap
        title={label}
        sx={{ fontSize: "0.78rem", color: "text.secondary", fontWeight: 600 }}
      >
        {label}
      </Typography>
    </Box>
  );
}

const CAROUSEL_GAP = 12;

const arrowSx = {
  flexShrink: 0,
  width: 34,
  height: 34,
  color: GREEN.main,
  bgcolor: "#fff",
  border: "1px solid rgba(45, 106, 79, 0.25)",
  boxShadow: "0 2px 8px rgba(27, 67, 50, 0.08)",
  "&:hover": { bgcolor: GREEN.mist },
  "&.Mui-disabled": { opacity: 0.35, bgcolor: "#fff" },
};

function StatsLayout({ carousel, children }) {
  const scrollerRef = useRef(null);
  const [scroll, setScroll] = useState({ page: 0, pages: 1, canPrev: false, canNext: false });

  const measure = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const step = el.clientWidth + CAROUSEL_GAP;
    const max = el.scrollWidth - el.clientWidth;
    setScroll({
      page: Math.round(el.scrollLeft / step),
      pages: Math.max(Math.ceil((el.scrollWidth + CAROUSEL_GAP) / step), 1),
      canPrev: el.scrollLeft > 2,
      canNext: el.scrollLeft < max - 2,
    });
  }, []);

  useEffect(() => {
    if (!carousel) return undefined;
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [carousel, measure]);

  const goTo = (page) => {
    const el = scrollerRef.current;
    if (el) el.scrollTo({ left: page * (el.clientWidth + CAROUSEL_GAP), behavior: "smooth" });
  };

  if (!carousel) {
    return (
      <Box
        sx={{
          display: "flex",
          gap: 1.5,
          mb: 2.5,
          flexWrap: { md: "wrap", lg: "nowrap" },
          "& > button": { flex: { md: "1 1 128px", lg: "1 1 0" }, minWidth: { md: 128, lg: 0 } },
        }}
      >
        {children}
      </Box>
    );
  }

  return (
    <Box sx={{ mb: 2.5 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <IconButton
          onClick={() => goTo(scroll.page - 1)}
          disabled={!scroll.canPrev}
          aria-label="Previous stats"
          sx={arrowSx}
        >
          <ChevronLeftRounded />
        </IconButton>

        <Box
          ref={scrollerRef}
          onScroll={measure}
          sx={{
            flex: 1,
            minWidth: 0,
            display: "flex",
            gap: `${CAROUSEL_GAP}px`,
            overflowX: "auto",
            overflowY: "hidden",
            scrollSnapType: "x mandatory",
            scrollbarWidth: "none",
            "&::-webkit-scrollbar": { display: "none" },
            py: 1,
            "& > button": {
              flex: `0 0 calc((100% - ${CAROUSEL_GAP}px) / 2)`,
              minWidth: 0,
              scrollSnapAlign: "start",
            },
          }}
        >
          {children}
        </Box>

        <IconButton
          onClick={() => goTo(scroll.page + 1)}
          disabled={!scroll.canNext}
          aria-label="Next stats"
          sx={arrowSx}
        >
          <ChevronRightRounded />
        </IconButton>
      </Box>

      {scroll.pages > 1 && (
        <Box sx={{ display: "flex", justifyContent: "center", gap: 0.75, mt: 1.25 }}>
          {Array.from({ length: scroll.pages }, (_, i) => (
            <Box
              key={i}
              component="button"
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Show stats group ${i + 1}`}
              aria-current={scroll.page === i}
              sx={{
                p: 0,
                border: 0,
                cursor: "pointer",
                height: 6,
                width: scroll.page === i ? 20 : 6,
                borderRadius: 3,
                bgcolor: scroll.page === i ? GREEN.main : "rgba(45, 106, 79, 0.25)",
                transition: "all 0.25s ease",
              }}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}

function RequestCard({ request, onOpen }) {
  return (
    <Box
      component="button"
      type="button"
      onClick={onOpen}
      sx={{
        width: "100%",
        textAlign: "left",
        font: "inherit",
        cursor: "pointer",
        p: 2,
        mb: 1.5,
        borderRadius: "16px 16px 16px 6px",
        border: "1px solid rgba(45, 106, 79, 0.12)",
        bgcolor: "#fff",
        "&:hover": { borderColor: GREEN.mid },
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, mb: 1 }}>
        <Typography sx={{ fontWeight: 700, color: GREEN.deep, fontSize: "0.85rem" }}>
          {request.reference}
        </Typography>
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          {timeAgo(request.createdAt)}
        </Typography>
      </Box>
      <Typography sx={{ fontWeight: 600, color: GREEN.ink }}>{request.name}</Typography>
      <Typography variant="body2" sx={{ color: "text.secondary", mb: 1.25 }}>
        {request.service} · {request.phone}
      </Typography>
      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center" }}>
        <StatusChip status={request.status} />
        <PriorityChip priority={request.priority} />
        <Typography variant="caption" sx={{ color: "text.secondary", ml: "auto" }}>
          {request.handler?.name || "Unassigned"}
        </Typography>
      </Box>
    </Box>
  );
}

export default function ServiceRequests() {
  const isDesktop = useMediaQuery("(min-width:900px)");

  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [handler, setHandler] = useState("");
  const [sort, setSort] = useState(SORT_OPTIONS[0].value);
  const [reloadKey, setReloadKey] = useState(0);

  const [admins, setAdmins] = useState([]);
  const [openId, setOpenId] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(0);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    adminRequest("/api/users?limit=100&sortBy=name&sortOrder=ASC")
      .then(({ data }) => setAdmins(data))
      .catch(() => setAdmins([]));
  }, []);

  useEffect(() => {
    let cancelled = false;
    const [sortBy, sortOrder] = sort.split(":");
    setLoading(true);
    setError("");

    adminRequest(
      `/api/service-requests${buildQuery({
        page: page + 1,
        limit: rowsPerPage,
        search,
        status,
        priority,
        handled_by: handler,
        sortBy,
        sortOrder,
      })}`
    )
      .then(({ data, summary: counts, pagination }) => {
        if (cancelled) return;
        // Deleting the last row on a page leaves it empty; step back a page
        if (!data.length && pagination.total > 0 && page > 0) {
          setPage(Math.max(pagination.totalPages - 1, 0));
          return;
        }
        setRows(data);
        setSummary(counts);
        setTotal(pagination.total);
      })
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [page, rowsPerPage, search, status, priority, handler, sort, reloadKey]);

  const refresh = useCallback(() => setReloadKey((k) => k + 1), []);

  const setFilter = (setter) => (value) => {
    setter(value);
    setPage(0);
  };

  const hasFilters = Boolean(search || status || priority || handler);
  const clearFilters = () => {
    setSearchInput("");
    setSearch("");
    setStatus("");
    setPriority("");
    setHandler("");
    setPage(0);
  };

  const handleSaved = (updated) => {
    setRows((prev) => prev.map((row) => (row.id === updated.id ? { ...row, ...updated } : row)));
    refresh();
  };

  const handleDeleted = () => {
    setOpenId(null);
    refresh();
  };

  const showSkeleton = loading && !rows.length;

  return (
    <Box sx={{ maxWidth: 1280, mx: "auto" }}>
      <Helmet>
        <title>Service requests | Mcaludoh Consultancy Admin</title>
      </Helmet>

      <Box sx={{ mb: 3 }}>
        <Typography
          component="h1"
          sx={{ fontWeight: 700, fontSize: { xs: "1.45rem", md: "1.85rem" }, color: GREEN.deep }}
        >
          Service requests
        </Typography>
        <Typography sx={{ color: "text.secondary", fontSize: "0.92rem" }}>
          Requests submitted from the public website. Open one to respond and update its status.
        </Typography>
      </Box>

      <StatsLayout carousel={!isDesktop}>
        <SummaryCard
          label="All requests"
          count={summary?.total}
          active={!status}
          onClick={() => setFilter(setStatus)("")}
        />
        {STATUSES.map((s) => (
          <SummaryCard
            key={s.value}
            label={s.label}
            count={summary?.[s.value]}
            color={s.fg}
            active={status === s.value}
            onClick={() => setFilter(setStatus)(status === s.value ? "" : s.value)}
          />
        ))}
      </StatsLayout>

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, mb: 2.5 }}>
        <TextField
          size="small"
          placeholder="Search reference, name, phone, email, service..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          sx={{ ...filterSx, flex: "1 1 280px" }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchRounded sx={{ color: "text.secondary" }} />
              </InputAdornment>
            ),
            endAdornment: searchInput && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setSearchInput("")} aria-label="Clear search">
                  <ClearRounded fontSize="small" />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
        <FormControl size="small" sx={filterSx}>
          <InputLabel>Priority</InputLabel>
          <Select label="Priority" value={priority} onChange={(e) => setFilter(setPriority)(e.target.value)}>
            <MenuItem value="">Any priority</MenuItem>
            {PRIORITIES.map((p) => (
              <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={filterSx}>
          <InputLabel>Handler</InputLabel>
          <Select label="Handler" value={handler} onChange={(e) => setFilter(setHandler)(e.target.value)}>
            {HANDLER_FILTERS.map((h) => (
              <MenuItem key={h.value || "any"} value={h.value}>{h.label}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={filterSx}>
          <InputLabel>Sort</InputLabel>
          <Select label="Sort" value={sort} onChange={(e) => setFilter(setSort)(e.target.value)}>
            {SORT_OPTIONS.map((o) => (
              <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
            ))}
          </Select>
        </FormControl>
        {hasFilters && (
          <Button onClick={clearFilters} sx={{ textTransform: "none", color: GREEN.main, fontWeight: 600 }}>
            Clear filters
          </Button>
        )}
      </Box>

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 2, borderRadius: "12px" }}
          action={
            <Button color="inherit" size="small" onClick={refresh}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      <Paper
        elevation={0}
        sx={{
          borderRadius: "20px",
          border: "1px solid rgba(45, 106, 79, 0.12)",
          overflow: "hidden",
          bgcolor: isDesktop ? "#fff" : "transparent",
          borderColor: isDesktop ? "rgba(45, 106, 79, 0.12)" : "transparent",
          opacity: loading && rows.length ? 0.6 : 1,
          transition: "opacity 0.2s ease",
        }}
      >
        {isDesktop ? (
          <TableContainer>
            <Table sx={{ minWidth: 820 }}>
              <TableHead>
                <TableRow sx={{ "& th": { bgcolor: GREEN.cream, color: GREEN.deep, fontWeight: 700, fontSize: "0.8rem" } }}>
                  <TableCell>Reference</TableCell>
                  <TableCell>Client</TableCell>
                  <TableCell>Service</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Priority</TableCell>
                  <TableCell>Handled by</TableCell>
                  <TableCell>Updated</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {showSkeleton &&
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      {[...Array(7)].map((__, j) => (
                        <TableCell key={j}>
                          <Skeleton />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                {rows.map((row) => (
                  <TableRow
                    key={row.id}
                    hover
                    tabIndex={0}
                    onClick={() => setOpenId(row.id)}
                    onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setOpenId(row.id)}
                    sx={{ cursor: "pointer", "&:focus-visible": { outline: `2px solid ${GREEN.mid}`, outlineOffset: -2 } }}
                  >
                    <TableCell>
                      <Typography sx={{ fontWeight: 700, color: GREEN.deep, fontSize: "0.85rem" }}>
                        {row.reference}
                      </Typography>
                      <Typography variant="caption" sx={{ color: "text.secondary" }}>
                        {formatDate(row.createdAt, false)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontWeight: 600, fontSize: "0.88rem" }}>{row.name}</Typography>
                      <Typography variant="caption" sx={{ color: "text.secondary" }}>
                        {row.phone}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ maxWidth: 220 }}>
                      <Typography noWrap sx={{ fontSize: "0.88rem" }}>
                        {row.service}
                      </Typography>
                      {row.location && (
                        <Typography variant="caption" noWrap sx={{ color: "text.secondary", display: "block" }}>
                          {row.location}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusChip status={row.status} />
                    </TableCell>
                    <TableCell>
                      <PriorityChip priority={row.priority} />
                    </TableCell>
                    <TableCell sx={{ fontSize: "0.85rem", color: row.handler ? "inherit" : "text.secondary" }}>
                      {row.handler?.name || "Unassigned"}
                    </TableCell>
                    <TableCell sx={{ fontSize: "0.82rem", color: "text.secondary", whiteSpace: "nowrap" }}>
                      {timeAgo(row.updatedAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Box>
            {showSkeleton &&
              [...Array(4)].map((_, i) => (
                <Skeleton key={i} variant="rounded" height={118} sx={{ mb: 1.5, borderRadius: "16px" }} />
              ))}
            {rows.map((row) => (
              <RequestCard key={row.id} request={row} onOpen={() => setOpenId(row.id)} />
            ))}
          </Box>
        )}

        {!loading && !error && !rows.length && (
          <Box sx={{ textAlign: "center", py: 8, px: 2, bgcolor: "#fff", borderRadius: isDesktop ? 0 : "20px" }}>
            <InboxRounded sx={{ fontSize: 48, color: GREEN.light, mb: 1 }} />
            <Typography sx={{ fontWeight: 700, color: GREEN.deep }}>
              {hasFilters ? "No requests match your filters" : "No service requests yet"}
            </Typography>
            <Typography sx={{ color: "text.secondary", fontSize: "0.9rem", mb: hasFilters ? 2 : 0 }}>
              {hasFilters
                ? "Try a different search or clear the filters."
                : "Requests submitted on the public website will appear here."}
            </Typography>
            {hasFilters && (
              <Button onClick={clearFilters} variant="outlined" sx={{ textTransform: "none", borderRadius: "10px", color: GREEN.main, borderColor: GREEN.mid }}>
                Clear filters
              </Button>
            )}
          </Box>
        )}

        <TablePagination
          component="div"
          count={total}
          page={total ? page : 0}
          onPageChange={(_, next) => setPage(next)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
          labelRowsPerPage={isDesktop ? "Rows per page" : "Rows"}
          sx={{
            bgcolor: "#fff",
            mt: !isDesktop && !rows.length ? 1.5 : 0,
            borderTop: isDesktop ? "1px solid rgba(45, 106, 79, 0.12)" : "none",
            borderRadius: isDesktop ? 0 : "16px",
            "& .MuiTablePagination-toolbar": { px: { xs: 1, sm: 2 } },
          }}
        />
      </Paper>

      <ServiceRequestDrawer
        requestId={openId}
        admins={admins}
        onClose={() => setOpenId(null)}
        onSaved={handleSaved}
        onDeleted={handleDeleted}
      />
    </Box>
  );
}
