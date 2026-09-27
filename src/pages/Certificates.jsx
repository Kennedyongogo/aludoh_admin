import React, { useEffect, useState } from "react";
import { Box, Button, IconButton, Tooltip, Typography, useMediaQuery } from "@mui/material";
import { AddRounded, ContentCopyRounded, WorkspacePremiumRounded } from "@mui/icons-material";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { adminRequest } from "../utils/adminApi";
import { StatsLayout, SummaryCard } from "../components/common/Stats";
import {
  ActionIcons,
  ClearFiltersButton,
  ContentCard,
  EmptyState,
  ErrorBanner,
  FilterSelect,
  PageHeader,
  Pill,
  ResponsiveList,
  SearchField,
  Toolbar,
  outlinedButtonSx,
  primaryButtonSx,
} from "../components/Content/ListKit";
import { confirmDelete, toastSuccess } from "../components/Content/feedback";
import useAdminList from "../components/Content/useAdminList";
import { RecipientCell, certificateDeletePrompt, copyVerifyLink } from "../components/Content/CertificateContent";
import { CERTIFICATE_STATUSES, GREEN, findOption, formatDay } from "../components/Content/constants";

const VIEWS = [
  { value: "", label: "All certificates", count: (s) => s?.total },
  { value: "valid", label: "Valid", count: (s) => s?.valid, color: "#1B4332" },
  { value: "revoked", label: "Revoked", count: (s) => s?.revoked, color: "#9B1C1C" },
];

export default function Certificates() {
  const isDesktop = useMediaQuery("(min-width:900px)");
  const navigate = useNavigate();
  const [status, setStatus] = useState("");
  const [courseId, setCourseId] = useState("");
  const [courses, setCourses] = useState([]);
  const list = useAdminList("/api/certificates/admin", { status, course_id: courseId });

  useEffect(() => {
    adminRequest("/api/courses/admin/sessions")
      .then(({ data }) => setCourses(data))
      .catch(() => setCourses([]));
  }, []);

  const setFilter = (setter) => (value) => {
    setter(value);
    list.resetPage();
  };

  const hasFilters = Boolean(list.search || status || courseId);
  const clearFilters = () => {
    list.clearSearch();
    setStatus("");
    setCourseId("");
  };

  const openCertificate = (id, mode = "view") =>
    navigate(id === "new" ? "/certificates/new" : mode === "edit" ? `/certificates/${id}/edit` : `/certificates/${id}`);

  const removeCertificate = async (cert) => {
    if (!(await confirmDelete(certificateDeletePrompt(cert)))) return;
    try {
      await adminRequest(`/api/certificates/${cert.id}`, { method: "DELETE" });
      toastSuccess("Certificate deleted");
      list.refresh();
    } catch (err) {
      list.setError(err.message);
    }
  };

  const actions = (c) => (
    <ActionIcons
      label={`certificate ${c.certificate_number}`}
      onView={() => openCertificate(c.id)}
      onEdit={() => openCertificate(c.id, "edit")}
      onDelete={() => removeCertificate(c)}
    >
      <Tooltip title="Copy verification link">
        <IconButton size="small" aria-label={`Copy verification link for ${c.certificate_number}`} onClick={() => copyVerifyLink(c.certificate_number)} sx={{ width: 34, height: 34, color: "#8A6A00" }}>
          <ContentCopyRounded fontSize="small" />
        </IconButton>
      </Tooltip>
    </ActionIcons>
  );

  const certLine = (c) => (
    <>
      <Typography sx={{ fontSize: "0.84rem", fontWeight: 700, color: GREEN.ink, fontFamily: "monospace", display: "flex", alignItems: "center", gap: 1 }}>
        {c.certificate_number}
        {c.status === "revoked" && <Pill option={findOption(CERTIFICATE_STATUSES, "revoked")} />}
      </Typography>
      <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }} noWrap title={c.course_name}>
        {c.course_name}
        {c.completed_on ? ` · ${formatDay(c.completed_on)}` : ""}
      </Typography>
    </>
  );

  const columns = [
    { key: "recipient", label: "Recipient", render: (c) => <RecipientCell cert={c} /> },
    { key: "certificate", label: "Certificate", render: (c) => <Box sx={{ minWidth: 0, maxWidth: 380 }}>{certLine(c)}</Box> },
    { key: "actions", label: "Actions", align: "right", width: 180, render: actions },
  ];

  return (
    <Box sx={{ maxWidth: 1280, mx: "auto" }}>
      <Helmet>
        <title>Certificates | Mcaludoh Consultancy Admin</title>
      </Helmet>

      <PageHeader
        title="Certificates"
        subtitle={
          list.summary
            ? `${list.summary.this_year} issued this year · anyone can check them on the website's verify page`
            : "Training certificates that can be checked on the website"
        }
        actions={
          <Button variant="contained" startIcon={<AddRounded />} onClick={() => openCertificate("new")} sx={primaryButtonSx}>
            {isDesktop ? "Issue certificate" : "Issue"}
          </Button>
        }
      />

      <StatsLayout carousel={!isDesktop}>
        {VIEWS.map((v) => (
          <SummaryCard
            key={v.value || "all"}
            label={v.label}
            count={v.count(list.summary)}
            color={v.color}
            active={status === v.value}
            onClick={() => setFilter(setStatus)(status === v.value ? "" : v.value)}
          />
        ))}
      </StatsLayout>

      <Toolbar>
        <SearchField value={list.searchInput} onChange={list.setSearchInput} placeholder="Search number, name, email, course..." />
        <FilterSelect
          label="Course"
          value={courseId}
          onChange={setFilter(setCourseId)}
          options={courses.map((c) => ({ value: c.id, label: c.name }))}
          anyLabel="All courses"
        />
        {hasFilters && <ClearFiltersButton onClick={clearFilters} />}
      </Toolbar>

      <ErrorBanner error={list.error} onRetry={list.refresh} />

      <ResponsiveList
        {...list.listProps}
        isDesktop={isDesktop}
        columns={columns}
        minWidth={620}
        renderCard={(c) => (
          <ContentCard
            media={<WorkspacePremiumRounded sx={{ color: "#B7791F", fontSize: 32, mt: 0.25 }} />}
            title={c.recipient_name}
            subtitle={c.organization || c.recipient_email}
            body={certLine(c)}
            actions={actions(c)}
          />
        )}
        empty={
          <EmptyState
            icon={<WorkspacePremiumRounded sx={{ fontSize: 48, color: GREEN.light, mb: 1 }} />}
            title={hasFilters ? "No certificates match your filters" : "No certificates yet"}
            text={
              hasFilters
                ? "Try a different search or clear the filters."
                : "Mark bookings as attended, then issue certificates from the course page or a booking."
            }
            action={
              hasFilters ? (
                <Button onClick={clearFilters} variant="outlined" sx={outlinedButtonSx}>
                  Clear filters
                </Button>
              ) : (
                <Button onClick={() => openCertificate("new")} variant="contained" startIcon={<AddRounded />} sx={primaryButtonSx}>
                  Issue certificate
                </Button>
              )
            }
          />
        }
      />
    </Box>
  );
}
