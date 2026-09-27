import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Box, Button, IconButton, Tab, Tabs, Tooltip, Typography, useMediaQuery } from "@mui/material";
import { AddRounded, ArrowDownwardRounded, ArrowUpwardRounded, DesignServicesRounded } from "@mui/icons-material";
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
  PageHeader,
  ResponsiveList,
  SearchField,
  Thumb,
  Toolbar,
  outlinedButtonSx,
  primaryButtonSx,
} from "../components/Content/ListKit";
import ServiceGoals from "../components/Content/ServiceGoals";
import { confirmDelete, toastSuccess } from "../components/Content/feedback";
import { GREEN, SERVICE_STATUSES } from "../components/Content/constants";

const tabsSx = {
  mb: 2.5,
  minHeight: 44,
  borderBottom: "1px solid rgba(45, 106, 79, 0.12)",
  "& .MuiTab-root": { textTransform: "none", fontWeight: 600, minHeight: 44, color: "text.secondary", px: { xs: 1.5, sm: 2.5 } },
  "& .Mui-selected": { color: `${GREEN.deep} !important` },
  "& .MuiTabs-indicator": { bgcolor: GREEN.main, height: 3, borderRadius: "3px 3px 0 0" },
};

export default function Services() {
  const isDesktop = useMediaQuery("(min-width:900px)");
  const navigate = useNavigate();
  const [tab, setTab] = useState("services");

  const [services, setServices] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [goalCount, setGoalCount] = useState(null);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [reloadKey, setReloadKey] = useState(0);
  const [reordering, setReordering] = useState(false);

  const [allServices, setAllServices] = useState([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(0);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    adminRequest(`/api/services/admin${buildQuery({ search, status })}`)
      .then(({ data, summary: counts }) => {
        if (cancelled) return;
        setServices(data);
        setSummary(counts);
        if (!search && !status) setAllServices(data);
      })
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [search, status, reloadKey]);

  // The goal editor needs every service, even while this list is filtered
  useEffect(() => {
    if (!search && !status) return;
    adminRequest("/api/services/admin")
      .then(({ data }) => setAllServices(data))
      .catch(() => {});
  }, [search, status, reloadKey]);

  useEffect(() => {
    adminRequest("/api/service-goals/admin")
      .then(({ data }) => setGoalCount(data.length))
      .catch(() => {});
  }, []);

  const refresh = useCallback(() => setReloadKey((k) => k + 1), []);
  const hasFilters = Boolean(search || status);

  const pageRows = useMemo(
    () => services.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [services, page, rowsPerPage]
  );

  useEffect(() => {
    if (page > 0 && page * rowsPerPage >= services.length) setPage(Math.max(Math.ceil(services.length / rowsPerPage) - 1, 0));
  }, [services.length, page, rowsPerPage]);

  const clearFilters = () => {
    setSearchInput("");
    setSearch("");
    setStatus("");
    setPage(0);
  };

  const openService = (id, mode = "view") =>
    navigate(id === "new" ? "/services/new" : mode === "edit" ? `/services/${id}/edit` : `/services/${id}`);

  const move = async (service, delta) => {
    const index = services.findIndex((s) => s.id === service.id);
    const next = [...services];
    const [item] = next.splice(index, 1);
    next.splice(index + delta, 0, item);
    setServices(next);
    setReordering(true);
    try {
      await adminRequest("/api/services/reorder", { method: "PUT", body: { ids: next.map((s) => s.id) } });
      refresh();
    } catch (err) {
      setError(err.message);
      refresh();
    } finally {
      setReordering(false);
    }
  };

  const removeService = async (service) => {
    const linked = service.project_count || service.testimonial_count;
    const ok = await confirmDelete({
      title: "Delete this service?",
      text: linked
        ? `${service.name} will be removed from the website. Its ${service.project_count} project(s) and ${service.testimonial_count} testimonial(s) will stay but lose this link.`
        : `${service.name} will be removed from the website.`,
    });
    if (!ok) return;
    try {
      await adminRequest(`/api/services/${service.id}`, { method: "DELETE" });
      toastSuccess("Service deleted");
      refresh();
    } catch (err) {
      setError(err.message);
    }
  };

  const orderControls = (service) => {
    const index = services.findIndex((s) => s.id === service.id);
    const disabledReason = hasFilters ? "Clear the search and filters to reorder" : "";
    return (
      <Box sx={{ display: "inline-flex", alignItems: "center" }} onClick={(e) => e.stopPropagation()}>
        <Tooltip title={disabledReason || "Move up"}>
          <span>
            <IconButton size="small" disabled={Boolean(disabledReason) || reordering || index === 0} onClick={() => move(service, -1)} aria-label="Move up">
              <ArrowUpwardRounded fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title={disabledReason || "Move down"}>
          <span>
            <IconButton size="small" disabled={Boolean(disabledReason) || reordering || index === services.length - 1} onClick={() => move(service, 1)} aria-label="Move down">
              <ArrowDownwardRounded fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </Box>
    );
  };

  const actions = (service) => (
    <ActionIcons
      label={service.name}
      onView={() => openService(service.id, "view")}
      onEdit={() => openService(service.id, "edit")}
      onDelete={() => removeService(service)}
    />
  );

  const columns = [
    { key: "order", label: "Order", width: 96, render: orderControls },
    {
      key: "service",
      label: "Service",
      render: (s) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0 }}>
          <Thumb src={s.image} alt={s.name} size={52} />
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontWeight: 700, color: GREEN.ink, fontSize: "0.9rem" }}>{s.name}</Typography>
            <Typography variant="caption" sx={{ color: "text.secondary", display: "block", maxWidth: 560 }} noWrap>
              {s.tagline || s.short_description || `/${s.slug}`}
            </Typography>
          </Box>
        </Box>
      ),
    },
    { key: "actions", label: "Actions", align: "right", width: 140, render: actions },
  ];

  return (
    <Box sx={{ maxWidth: 1280, mx: "auto" }}>
      <Helmet>
        <title>Services | Mcaludoh Consultancy Admin</title>
      </Helmet>

      <PageHeader
        title="Services"
        subtitle="What you offer on the website, with packages, FAQs and the service finder"
        actions={
          tab === "services" && (
            <Button variant="contained" startIcon={<AddRounded />} onClick={() => openService("new", "edit")} sx={primaryButtonSx}>
              {isDesktop ? "Add service" : "Add"}
            </Button>
          )
        }
      />

      <Tabs value={tab} onChange={(_, next) => setTab(next)} sx={tabsSx} variant="scrollable" allowScrollButtonsMobile>
        <Tab value="services" label={`Services${summary ? ` (${summary.total})` : ""}`} />
        <Tab value="goals" label={`Service finder${goalCount !== null ? ` (${goalCount})` : ""}`} />
      </Tabs>

      {tab === "services" ? (
        <>
          <StatsLayout carousel={!isDesktop}>
            <SummaryCard label="All services" count={summary?.total} active={!status} onClick={() => { setStatus(""); setPage(0); }} />
            {SERVICE_STATUSES.map((s) => (
              <SummaryCard
                key={s.value}
                label={s.value === "active" ? "Live on website" : "Drafts"}
                count={summary?.[s.value]}
                color={s.fg}
                active={status === s.value}
                onClick={() => {
                  setStatus(status === s.value ? "" : s.value);
                  setPage(0);
                }}
              />
            ))}
          </StatsLayout>

          <Toolbar>
            <SearchField value={searchInput} onChange={setSearchInput} placeholder="Search name, tagline, description..." />
            {hasFilters && <ClearFiltersButton onClick={clearFilters} />}
          </Toolbar>

          <ErrorBanner error={error} onRetry={refresh} />

          <ResponsiveList
            isDesktop={isDesktop}
            columns={columns}
            rows={pageRows}
            loading={loading}
            minWidth={560}
            count={services.length}
            page={page}
            rowsPerPage={rowsPerPage}
            onPageChange={setPage}
            onRowsPerPageChange={(n) => {
              setRowsPerPage(n);
              setPage(0);
            }}
            renderCard={(s) => (
              <ContentCard
                media={<Thumb src={s.image} alt={s.name} size={64} />}
                title={s.name}
                subtitle={s.tagline || s.short_description}
                chips={orderControls(s)}
                actions={actions(s)}
              />
            )}
            empty={
              <EmptyState
                icon={<DesignServicesRounded sx={{ fontSize: 48, color: GREEN.light, mb: 1 }} />}
                title={hasFilters ? "No services match your filters" : "No services yet"}
                text={hasFilters ? "Try a different search or clear the filters." : "Add the services you offer and they'll appear on the website."}
                action={
                  hasFilters ? (
                    <Button onClick={clearFilters} variant="outlined" sx={outlinedButtonSx}>
                      Clear filters
                    </Button>
                  ) : (
                    <Button onClick={() => openService("new", "edit")} variant="contained" startIcon={<AddRounded />} sx={primaryButtonSx}>
                      Add service
                    </Button>
                  )
                }
              />
            }
          />
        </>
      ) : (
        <ServiceGoals services={allServices} isDesktop={isDesktop} onCountChange={setGoalCount} />
      )}
    </Box>
  );
}
