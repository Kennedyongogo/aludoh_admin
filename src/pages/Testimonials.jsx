import React, { useCallback, useEffect, useState } from "react";
import { Avatar, Box, Button, IconButton, Tooltip, Typography, useMediaQuery } from "@mui/material";
import { AddRounded, BlockRounded, CheckRounded, RateReviewRounded, StarRounded } from "@mui/icons-material";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { adminRequest, buildQuery } from "../utils/adminApi";
import { StatsLayout, SummaryCard } from "../components/common/Stats";
import {
  ActionIcons,
  ClearFiltersButton,
  ContentCard,
  EmptyState,
  ErrorBanner,
  FeaturedBadge,
  FilterSelect,
  PageHeader,
  Pill,
  ResponsiveList,
  SearchField,
  Stars,
  Toolbar,
  outlinedButtonSx,
  primaryButtonSx,
} from "../components/Content/ListKit";
import { confirmDelete, toastSuccess } from "../components/Content/feedback";
import { testimonialDeletePrompt } from "../components/Content/TestimonialContent";
import {
  GREEN,
  TESTIMONIAL_SOURCES,
  TESTIMONIAL_STATUSES,
  findOption,
  initials,
  mediaUrl,
  timeAgo,
} from "../components/Content/constants";

const clampSx = (lines) => ({
  display: "-webkit-box",
  WebkitLineClamp: lines,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
});

function ClientCell({ t, size = 40 }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, minWidth: 0 }}>
      <Avatar src={mediaUrl(t.photo) || undefined} sx={{ width: size, height: size, bgcolor: GREEN.main, fontSize: "0.85rem", fontWeight: 700 }}>
        {initials(t.client_name)}
      </Avatar>
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontWeight: 700, color: GREEN.ink, fontSize: "0.9rem", display: "flex", alignItems: "center", gap: 0.5 }} noWrap>
          {t.client_name}
          {t.is_featured && <FeaturedBadge />}
        </Typography>
        <Typography variant="caption" sx={{ color: "text.secondary", display: "block", maxWidth: 200 }} noWrap>
          {[t.role, t.organization].filter(Boolean).join(", ") || "—"}
        </Typography>
      </Box>
    </Box>
  );
}

const linkedTo = (t) => t.project?.name || t.service?.short_name || t.service?.name || "";

export default function Testimonials() {
  const isDesktop = useMediaQuery("(min-width:900px)");
  const navigate = useNavigate();

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
  const [serviceId, setServiceId] = useState("");
  const [source, setSource] = useState("");
  const [featured, setFeatured] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [busyId, setBusyId] = useState(null);

  const [services, setServices] = useState([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(0);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    adminRequest("/api/services/admin")
      .then(({ data }) => setServices(data))
      .catch(() => setServices([]));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    adminRequest(
      `/api/testimonials/admin${buildQuery({
        page: page + 1,
        limit: rowsPerPage,
        search,
        status,
        service_id: serviceId,
        source,
        featured: featured ? "true" : "",
      })}`
    )
      .then(({ data, summary: counts, pagination }) => {
        if (cancelled) return;
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
  }, [page, rowsPerPage, search, status, serviceId, source, featured, reloadKey]);

  const refresh = useCallback(() => setReloadKey((k) => k + 1), []);

  const setFilter = (setter) => (value) => {
    setter(value);
    setPage(0);
  };

  const hasFilters = Boolean(search || status || serviceId || source || featured);
  const clearFilters = () => {
    setSearchInput("");
    setSearch("");
    setStatus("");
    setServiceId("");
    setSource("");
    setFeatured(false);
    setPage(0);
  };

  const openTestimonial = (id, mode = "view") =>
    navigate(id === "new" ? "/testimonials/new" : mode === "edit" ? `/testimonials/${id}/edit` : `/testimonials/${id}`);

  const review = async (t, nextStatus) => {
    setBusyId(t.id);
    try {
      await adminRequest(`/api/testimonials/${t.id}`, { method: "PUT", body: { status: nextStatus } });
      toastSuccess(nextStatus === "approved" ? "Approved and live on the website" : "Testimonial rejected");
      refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const removeTestimonial = async (t) => {
    const ok = await confirmDelete(testimonialDeletePrompt(t));
    if (!ok) return;
    try {
      await adminRequest(`/api/testimonials/${t.id}`, { method: "DELETE" });
      toastSuccess("Testimonial deleted");
      refresh();
    } catch (err) {
      setError(err.message);
    }
  };

  const actions = (t) => (
    <ActionIcons
      label={`testimonial from ${t.client_name}`}
      onView={() => openTestimonial(t.id, "view")}
      onEdit={() => openTestimonial(t.id, "edit")}
      onDelete={() => removeTestimonial(t)}
    >
      {t.status === "pending" && (
        <>
          <Tooltip title="Approve">
            <IconButton
              size="small"
              disabled={busyId === t.id}
              onClick={() => review(t, "approved")}
              aria-label={`Approve testimonial from ${t.client_name}`}
              sx={{ width: 34, height: 34, color: "#fff", bgcolor: GREEN.main, "&:hover": { bgcolor: GREEN.deep } }}
            >
              <CheckRounded fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Reject">
            <IconButton
              size="small"
              disabled={busyId === t.id}
              onClick={() => review(t, "rejected")}
              aria-label={`Reject testimonial from ${t.client_name}`}
              sx={{ width: 34, height: 34, color: "#B42318", bgcolor: "#FDE2E1", "&:hover": { bgcolor: "#FBCBC9" } }}
            >
              <BlockRounded fontSize="small" />
            </IconButton>
          </Tooltip>
        </>
      )}
    </ActionIcons>
  );

  const ratings = summary?.ratings;
  const subtitle = ratings?.average
    ? `Approved reviews average ${ratings.average}★ from ${ratings.rated} rating${ratings.rated === 1 ? "" : "s"}${ratings.happy_percent !== null ? ` · ${ratings.happy_percent}% rated 4★ or more` : ""}`
    : "What clients say about your work, and the review queue for new submissions";

  const serviceOptions = [
    ...services.map((s) => ({ value: s.id, label: s.short_name || s.name })),
    { value: "none", label: "Not linked to a service" },
  ];

  const columns = [
    { key: "client", label: "Client", width: 240, render: (t) => <ClientCell t={t} /> },
    {
      key: "quote",
      label: "Testimonial",
      render: (t) => (
        <Box sx={{ maxWidth: 560 }}>
          <Stars value={t.rating} size={14} />
          <Typography sx={{ fontSize: "0.84rem", color: GREEN.ink, mt: 0.25, ...clampSx(2) }}>{t.content}</Typography>
        </Box>
      ),
    },
    { key: "actions", label: "Actions", align: "right", width: 200, render: actions },
  ];

  return (
    <Box sx={{ maxWidth: 1280, mx: "auto" }}>
      <Helmet>
        <title>Testimonials | Mcaludoh Consultancy Admin</title>
      </Helmet>

      <PageHeader
        title="Testimonials"
        subtitle={subtitle}
        actions={
          <Button variant="contained" startIcon={<AddRounded />} onClick={() => openTestimonial("new", "edit")} sx={primaryButtonSx}>
            {isDesktop ? "Add testimonial" : "Add"}
          </Button>
        }
      />

      <StatsLayout carousel={!isDesktop}>
        <SummaryCard label="All testimonials" count={summary?.total} active={!status && !featured} onClick={() => { setFilter(setStatus)(""); setFeatured(false); }} />
        {TESTIMONIAL_STATUSES.map((s) => (
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

      <Toolbar>
        <SearchField value={searchInput} onChange={setSearchInput} placeholder="Search client, organisation, words in the testimonial..." />
        <FilterSelect label="Service" value={serviceId} onChange={setFilter(setServiceId)} options={serviceOptions} anyLabel="All services" />
        <FilterSelect label="Source" value={source} onChange={setFilter(setSource)} options={TESTIMONIAL_SOURCES} anyLabel="Any source" />
        <Button
          variant={featured ? "contained" : "outlined"}
          startIcon={<StarRounded sx={{ color: featured ? "#fff" : "#E0A100" }} />}
          onClick={() => setFilter(setFeatured)(!featured)}
          aria-pressed={featured}
          sx={featured ? { ...primaryButtonSx, boxShadow: "none", height: 40 } : { ...outlinedButtonSx, height: 40 }}
        >
          Featured
        </Button>
        {hasFilters && <ClearFiltersButton onClick={clearFilters} />}
      </Toolbar>

      <ErrorBanner error={error} onRetry={refresh} />

      <ResponsiveList
        isDesktop={isDesktop}
        columns={columns}
        rows={rows}
        loading={loading}
        minWidth={640}
        count={total}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={setPage}
        onRowsPerPageChange={(n) => {
          setRowsPerPage(n);
          setPage(0);
        }}
        renderCard={(t) => (
          <ContentCard
            media={<ClientCell t={t} size={44} />}
            body={
              <>
                <Stars value={t.rating} size={15} />
                <Typography sx={{ fontSize: "0.88rem", color: GREEN.ink, mt: 0.5, fontStyle: "italic", ...clampSx(3) }}>
                  “{t.content}”
                </Typography>
                {linkedTo(t) && (
                  <Typography variant="caption" sx={{ color: GREEN.main, fontWeight: 600, display: "block", mt: 0.75 }}>
                    {linkedTo(t)}
                  </Typography>
                )}
              </>
            }
            chips={<Pill option={findOption(TESTIMONIAL_STATUSES, t.status)} />}
            meta={timeAgo(t.createdAt)}
            actions={actions(t)}
          />
        )}
        empty={
          <EmptyState
            icon={<RateReviewRounded sx={{ fontSize: 48, color: GREEN.light, mb: 1 }} />}
            title={hasFilters ? "No testimonials match your filters" : "No testimonials yet"}
            text={
              hasFilters
                ? status === "pending" && !search
                  ? "You're all caught up: nothing is waiting for review."
                  : "Try a different search or clear the filters."
                : "Testimonials submitted on the website land here for review. You can also add ones you received by phone or WhatsApp."
            }
            action={
              hasFilters && (
                <Button onClick={clearFilters} variant="outlined" sx={outlinedButtonSx}>
                  Clear filters
                </Button>
              )
            }
          />
        }
      />
    </Box>
  );
}
