import React, { useEffect, useState } from "react";
import { Box, Button, Typography, useMediaQuery } from "@mui/material";
import { AddRounded, SchoolRounded } from "@mui/icons-material";
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
import useAdminList from "../components/Content/useAdminList";
import { courseDeletePrompt } from "../components/Content/CourseContent";
import { GREEN, VISIBILITY, findOption, formatDay, formatKES } from "../components/Content/constants";

const VIEWS = [
  { value: "", label: "All courses", count: (s) => s?.total },
  { value: "published", label: "Published", count: (s) => s?.published, color: "#1D4E89", query: { published: "true" } },
  { value: "hidden", label: "Hidden", count: (s) => s?.hidden, color: "#5B6660", query: { published: "false" } },
  { value: "featured", label: "Featured", count: (s) => s?.featured, color: "#8A6A00", query: { featured: "true" } },
];

const nextDateText = (c) =>
  c.next_session
    ? `Next: ${formatDay(c.next_session, { weekday: true })}${c.upcoming_sessions > 1 ? ` · +${c.upcoming_sessions - 1} more` : ""}`
    : "No upcoming dates";

export default function Courses() {
  const isDesktop = useMediaQuery("(min-width:900px)");
  const navigate = useNavigate();
  const [view, setView] = useState("");
  const [category, setCategory] = useState("");
  const [categories, setCategories] = useState([]);
  const viewQuery = VIEWS.find((v) => v.value === view)?.query || {};
  const list = useAdminList("/api/courses/admin", { ...viewQuery, category });

  useEffect(() => {
    adminRequest("/api/courses/admin/options")
      .then(({ data }) => setCategories(data.categories || []))
      .catch(() => setCategories([]));
  }, []);

  const setFilter = (setter) => (value) => {
    setter(value);
    list.resetPage();
  };

  const hasFilters = Boolean(list.search || view || category);
  const clearFilters = () => {
    list.clearSearch();
    setView("");
    setCategory("");
  };

  const openCourse = (id, mode = "view") =>
    navigate(id === "new" ? "/courses/new" : mode === "edit" ? `/courses/${id}/edit` : `/courses/${id}`);

  const removeCourse = async (course) => {
    if (!(await confirmDelete(courseDeletePrompt(course)))) return;
    try {
      await adminRequest(`/api/courses/${course.id}`, { method: "DELETE" });
      toastSuccess("Course deleted");
      list.refresh();
    } catch (err) {
      list.setError(err.message);
    }
  };

  const actions = (c) => (
    <ActionIcons label={c.name} onView={() => openCourse(c.id)} onEdit={() => openCourse(c.id, "edit")} onDelete={() => removeCourse(c)} />
  );

  const pendingPill = (c) =>
    c.pending_bookings > 0 && <Pill option={{ label: `${c.pending_bookings} new booking${c.pending_bookings === 1 ? "" : "s"}`, bg: "#FFF1D6", fg: "#8A5A00" }} />;

  const columns = [
    {
      key: "course",
      label: "Course",
      render: (c) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0 }}>
          <Thumb src={c.image} alt={c.name} size={56} icon={<SchoolRounded />} />
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontWeight: 700, color: GREEN.ink, fontSize: "0.9rem", display: "flex", alignItems: "center", gap: 0.75 }}>
              <Box component="span" sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 380 }}>
                {c.name}
              </Box>
              {c.is_featured && <FeaturedBadge />}
              {!c.is_published && <Pill option={findOption(VISIBILITY, "draft")} />}
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              {[c.category, c.level, formatKES(c.fee)].filter((x) => x && x !== "—").join(" · ")}
            </Typography>
          </Box>
        </Box>
      ),
    },
    {
      key: "dates",
      label: "Dates",
      width: 240,
      render: (c) => (
        <Box>
          <Typography sx={{ fontSize: "0.84rem", color: c.next_session ? GREEN.ink : "text.disabled", whiteSpace: "nowrap" }}>{nextDateText(c)}</Typography>
          {pendingPill(c) && <Box sx={{ mt: 0.5 }}>{pendingPill(c)}</Box>}
        </Box>
      ),
    },
    { key: "actions", label: "Actions", align: "right", width: 140, render: actions },
  ];

  return (
    <Box sx={{ maxWidth: 1280, mx: "auto" }}>
      <Helmet>
        <title>Courses | Mcaludoh Consultancy Admin</title>
      </Helmet>

      <PageHeader
        title="Courses"
        subtitle={
          list.summary
            ? `${list.summary.upcoming_sessions} upcoming class date${list.summary.upcoming_sessions === 1 ? "" : "s"} on the website's Training page`
            : "Training courses and their class dates"
        }
        actions={
          <Button variant="contained" startIcon={<AddRounded />} onClick={() => openCourse("new")} sx={primaryButtonSx}>
            {isDesktop ? "Add course" : "Add"}
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
            active={view === v.value}
            onClick={() => setFilter(setView)(view === v.value ? "" : v.value)}
          />
        ))}
      </StatsLayout>

      <Toolbar>
        <SearchField value={list.searchInput} onChange={list.setSearchInput} placeholder="Search name, category, location..." />
        {categories.length > 0 && (
          <FilterSelect
            label="Category"
            value={category}
            onChange={setFilter(setCategory)}
            options={categories.map((c) => ({ value: c, label: c }))}
            anyLabel="All categories"
          />
        )}
        {hasFilters && <ClearFiltersButton onClick={clearFilters} />}
      </Toolbar>

      <ErrorBanner error={list.error} onRetry={list.refresh} />

      <ResponsiveList
        {...list.listProps}
        isDesktop={isDesktop}
        columns={columns}
        minWidth={640}
        renderCard={(c) => (
          <ContentCard
            media={<Thumb src={c.image} alt={c.name} size={68} icon={<SchoolRounded />} />}
            title={
              <>
                {c.name} {c.is_featured && <FeaturedBadge sx={{ mb: "2px" }} />}
              </>
            }
            subtitle={[c.category, c.level, formatKES(c.fee)].filter((x) => x && x !== "—").join(" · ")}
            body={
              <Typography variant="body2" sx={{ color: c.next_session ? GREEN.ink : "text.disabled" }}>
                {nextDateText(c)}
              </Typography>
            }
            chips={
              <>
                {!c.is_published && <Pill option={findOption(VISIBILITY, "draft")} />}
                {pendingPill(c)}
              </>
            }
            actions={actions(c)}
          />
        )}
        empty={
          <EmptyState
            icon={<SchoolRounded sx={{ fontSize: 48, color: GREEN.light, mb: 1 }} />}
            title={hasFilters ? "No courses match your filters" : "No courses yet"}
            text={hasFilters ? "Try a different search or clear the filters." : "Add a course with its dates so visitors can book a seat."}
            action={
              hasFilters ? (
                <Button onClick={clearFilters} variant="outlined" sx={outlinedButtonSx}>
                  Clear filters
                </Button>
              ) : (
                <Button onClick={() => openCourse("new")} variant="contained" startIcon={<AddRounded />} sx={primaryButtonSx}>
                  Add course
                </Button>
              )
            }
          />
        }
      />
    </Box>
  );
}
