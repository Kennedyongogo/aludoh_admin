import React, { useCallback, useEffect, useState } from "react";
import { Box, Button, Typography, useMediaQuery } from "@mui/material";
import { AddRounded, PlaceRounded, WorkRounded } from "@mui/icons-material";
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
  Thumb,
  Toolbar,
  outlinedButtonSx,
  primaryButtonSx,
} from "../components/Content/ListKit";
import { confirmDelete, toastSuccess } from "../components/Content/feedback";
import { GREEN, PROJECT_STATUSES, VISIBILITY, findOption } from "../components/Content/constants";

// Summary cards double as quick visibility filters
const VIEWS = [
  { value: "", label: "All projects", count: (s) => s?.total },
  { value: "published", label: "Published", count: (s) => s?.published, color: "#1D4E89", query: { published: "true" } },
  { value: "hidden", label: "Hidden", count: (s) => s?.drafts, color: "#5B6660", query: { published: "false" } },
  { value: "featured", label: "Featured", count: (s) => s?.featured, color: "#8A6A00", query: { featured: "true" } },
];

const place = (p) => [p.location, p.county && !p.location?.toLowerCase().includes(p.county.toLowerCase()) ? p.county : ""].filter(Boolean).join(", ");

export default function Projects() {
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
  const [view, setView] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [status, setStatus] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

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
    const viewQuery = VIEWS.find((v) => v.value === view)?.query || {};
    adminRequest(
      `/api/projects/admin${buildQuery({ page: page + 1, limit: rowsPerPage, search, service_id: serviceId, status, ...viewQuery })}`
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
  }, [page, rowsPerPage, search, view, serviceId, status, reloadKey]);

  const refresh = useCallback(() => setReloadKey((k) => k + 1), []);

  const setFilter = (setter) => (value) => {
    setter(value);
    setPage(0);
  };

  const hasFilters = Boolean(search || view || serviceId || status);
  const clearFilters = () => {
    setSearchInput("");
    setSearch("");
    setView("");
    setServiceId("");
    setStatus("");
    setPage(0);
  };

  const openProject = (id, mode = "view") =>
    navigate(id === "new" ? "/projects/new" : mode === "edit" ? `/projects/${id}/edit` : `/projects/${id}`);

  const removeProject = async (project) => {
    const ok = await confirmDelete({
      title: "Delete this project?",
      text: project.testimonial_count
        ? `${project.name} will be removed from the website. Its ${project.testimonial_count} testimonial(s) will stay but lose this link.`
        : `${project.name} will be removed from the website.`,
    });
    if (!ok) return;
    try {
      await adminRequest(`/api/projects/${project.id}`, { method: "DELETE" });
      toastSuccess("Project deleted");
      refresh();
    } catch (err) {
      setError(err.message);
    }
  };

  const actions = (p) => (
    <ActionIcons
      label={p.name}
      onView={() => openProject(p.id, "view")}
      onEdit={() => openProject(p.id, "edit")}
      onDelete={() => removeProject(p)}
    />
  );

  const serviceOptions = [
    ...services.map((s) => ({ value: s.id, label: s.short_name || s.name })),
    { value: "none", label: "Not linked to a service" },
  ];
  const statusOptions = PROJECT_STATUSES.map((s) => ({
    value: s.value,
    label: summary ? `${s.label} (${summary[s.value] ?? 0})` : s.label,
  }));

  const columns = [
    {
      key: "project",
      label: "Project",
      render: (p) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0 }}>
          <Thumb src={p.cover_image} alt={p.name} size={56} />
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontWeight: 700, color: GREEN.ink, fontSize: "0.9rem", display: "flex", alignItems: "center", gap: 0.5 }}>
              <Box component="span" sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 420 }}>
                {p.name}
              </Box>
              {p.is_featured && <FeaturedBadge />}
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              {p.client || "No client name"}
            </Typography>
          </Box>
        </Box>
      ),
    },
    {
      key: "service",
      label: "Service",
      render: (p) =>
        p.service ? (
          <Typography sx={{ fontSize: "0.85rem" }}>{p.service.short_name || p.service.name}</Typography>
        ) : (
          <Typography sx={{ fontSize: "0.82rem", color: "text.disabled" }}>Not linked</Typography>
        ),
    },
    { key: "actions", label: "Actions", align: "right", width: 140, render: actions },
  ];

  return (
    <Box sx={{ maxWidth: 1280, mx: "auto" }}>
      <Helmet>
        <title>Projects | Mcaludoh Consultancy Admin</title>
      </Helmet>

      <PageHeader
        title="Projects"
        subtitle="Case studies shown on the website's Projects page"
        actions={
          <Button variant="contained" startIcon={<AddRounded />} onClick={() => openProject("new", "edit")} sx={primaryButtonSx}>
            {isDesktop ? "Add project" : "Add"}
          </Button>
        }
      />

      <StatsLayout carousel={!isDesktop}>
        {VIEWS.map((v) => (
          <SummaryCard
            key={v.value || "all"}
            label={v.label}
            count={v.count(summary)}
            color={v.color}
            active={view === v.value}
            onClick={() => setFilter(setView)(view === v.value ? "" : v.value)}
          />
        ))}
      </StatsLayout>

      <Toolbar>
        <SearchField value={searchInput} onChange={setSearchInput} placeholder="Search name, client, location, county..." />
        <FilterSelect label="Service" value={serviceId} onChange={setFilter(setServiceId)} options={serviceOptions} anyLabel="All services" />
        <FilterSelect label="Status" value={status} onChange={setFilter(setStatus)} options={statusOptions} anyLabel="Any status" />
        {hasFilters && <ClearFiltersButton onClick={clearFilters} />}
      </Toolbar>

      <ErrorBanner error={error} onRetry={refresh} />

      <ResponsiveList
        isDesktop={isDesktop}
        columns={columns}
        rows={rows}
        loading={loading}
        minWidth={560}
        count={total}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={setPage}
        onRowsPerPageChange={(n) => {
          setRowsPerPage(n);
          setPage(0);
        }}
        renderCard={(p) => (
          <ContentCard
            media={<Thumb src={p.cover_image} alt={p.name} size={68} />}
            title={
              <>
                {p.name} {p.is_featured && <FeaturedBadge sx={{ mb: "2px" }} />}
              </>
            }
            subtitle={[p.service?.short_name || p.service?.name, p.client].filter(Boolean).join(" · ")}
            body={
              place(p) && (
                <Typography variant="body2" sx={{ color: "text.secondary", display: "flex", alignItems: "center", gap: 0.5 }}>
                  <PlaceRounded sx={{ fontSize: 16, color: GREEN.light }} />
                  {place(p)}
                  {p.year ? ` · ${p.year}` : ""}
                </Typography>
              )
            }
            chips={
              <>
                <Pill option={findOption(PROJECT_STATUSES, p.status)} />
                {!p.is_published && <Pill option={findOption(VISIBILITY, "draft")} />}
              </>
            }
            actions={actions(p)}
          />
        )}
        empty={
          <EmptyState
            icon={<WorkRounded sx={{ fontSize: 48, color: GREEN.light, mb: 1 }} />}
            title={hasFilters ? "No projects match your filters" : "No projects yet"}
            text={hasFilters ? "Try a different search or clear the filters." : "Showcase your work: add a project with photos and results."}
            action={
              hasFilters ? (
                <Button onClick={clearFilters} variant="outlined" sx={outlinedButtonSx}>
                  Clear filters
                </Button>
              ) : (
                <Button onClick={() => openProject("new", "edit")} variant="contained" startIcon={<AddRounded />} sx={primaryButtonSx}>
                  Add project
                </Button>
              )
            }
          />
        }
      />
    </Box>
  );
}
