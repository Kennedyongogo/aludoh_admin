import React, { useEffect, useState } from "react";
import { Box, Button, Typography, useMediaQuery } from "@mui/material";
import { AddRounded, MenuBookRounded } from "@mui/icons-material";
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
  ResponsiveList,
  SearchField,
  Thumb,
  Toolbar,
  outlinedButtonSx,
  primaryButtonSx,
} from "../components/Content/ListKit";
import { confirmDelete, toastSuccess } from "../components/Content/feedback";
import useAdminList from "../components/Content/useAdminList";
import { ArticleStatusPill, articleDeletePrompt } from "../components/Content/ArticleContent";
import { GREEN, articleState, formatDate } from "../components/Content/constants";

// Summary cards double as status filters
const VIEWS = [
  { value: "", label: "All articles", count: (s) => s?.total },
  { value: "published", label: "Live", count: (s) => s?.published, color: "#1B4332" },
  { value: "scheduled", label: "Scheduled", count: (s) => s?.scheduled, color: "#1D4E89" },
  { value: "draft", label: "Drafts", count: (s) => s?.drafts, color: "#5B6660" },
];

const dateLine = (a) => {
  const state = articleState(a);
  if (state === "draft") return "Not published";
  return `${state === "scheduled" ? "Goes live" : "Published"} ${formatDate(a.published_at, false)}`;
};

export default function Knowledge() {
  const isDesktop = useMediaQuery("(min-width:900px)");
  const navigate = useNavigate();
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");
  const [categories, setCategories] = useState([]);
  const list = useAdminList("/api/articles/admin", { status, category });

  useEffect(() => {
    adminRequest("/api/articles/admin/options")
      .then(({ data }) => setCategories(data.categories || []))
      .catch(() => setCategories([]));
  }, []);

  const setFilter = (setter) => (value) => {
    setter(value);
    list.resetPage();
  };

  const hasFilters = Boolean(list.search || status || category);
  const clearFilters = () => {
    list.clearSearch();
    setStatus("");
    setCategory("");
  };

  const openArticle = (id, mode = "view") =>
    navigate(id === "new" ? "/knowledge/new" : mode === "edit" ? `/knowledge/${id}/edit` : `/knowledge/${id}`);

  const removeArticle = async (article) => {
    if (!(await confirmDelete(articleDeletePrompt(article)))) return;
    try {
      await adminRequest(`/api/articles/${article.id}`, { method: "DELETE" });
      toastSuccess("Article deleted");
      list.refresh();
    } catch (err) {
      list.setError(err.message);
    }
  };

  const actions = (a) => (
    <ActionIcons label={a.title} onView={() => openArticle(a.id)} onEdit={() => openArticle(a.id, "edit")} onDelete={() => removeArticle(a)} />
  );

  const byline = (a) => [a.category || "Uncategorised", a.author_name].filter(Boolean).join(" · ");

  const columns = [
    {
      key: "article",
      label: "Article",
      render: (a) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0 }}>
          <Thumb src={a.featured_image} alt={a.title} size={56} icon={<MenuBookRounded />} />
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontWeight: 700, color: GREEN.ink, fontSize: "0.9rem", display: "flex", alignItems: "center", gap: 0.5 }}>
              <Box component="span" sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 460 }}>
                {a.title}
              </Box>
              {a.is_featured && <FeaturedBadge />}
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              {byline(a)}
            </Typography>
          </Box>
        </Box>
      ),
    },
    {
      key: "status",
      label: "Status",
      width: 200,
      render: (a) => (
        <Box>
          <ArticleStatusPill article={a} />
          <Typography variant="caption" sx={{ display: "block", color: "text.secondary", mt: 0.5, whiteSpace: "nowrap" }}>
            {dateLine(a)}
          </Typography>
        </Box>
      ),
    },
    { key: "actions", label: "Actions", align: "right", width: 140, render: actions },
  ];

  return (
    <Box sx={{ maxWidth: 1280, mx: "auto" }}>
      <Helmet>
        <title>Knowledge Center | Mcaludoh Consultancy Admin</title>
      </Helmet>

      <PageHeader
        title="Knowledge Center"
        subtitle="Guides and articles shown on the website's blog"
        actions={
          <Button variant="contained" startIcon={<AddRounded />} onClick={() => openArticle("new")} sx={primaryButtonSx}>
            {isDesktop ? "Write article" : "Write"}
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
        <SearchField value={list.searchInput} onChange={list.setSearchInput} placeholder="Search title, category, author..." />
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
        minWidth={620}
        renderCard={(a) => (
          <ContentCard
            media={<Thumb src={a.featured_image} alt={a.title} size={68} icon={<MenuBookRounded />} />}
            title={
              <>
                {a.title} {a.is_featured && <FeaturedBadge sx={{ mb: "2px" }} />}
              </>
            }
            subtitle={byline(a)}
            chips={<ArticleStatusPill article={a} />}
            meta={dateLine(a)}
            actions={actions(a)}
          />
        )}
        empty={
          <EmptyState
            icon={<MenuBookRounded sx={{ fontSize: 48, color: GREEN.light, mb: 1 }} />}
            title={hasFilters ? "No articles match your filters" : "No articles yet"}
            text={hasFilters ? "Try a different search or clear the filters." : "Share your know-how: write a guide for farmers and clients."}
            action={
              hasFilters ? (
                <Button onClick={clearFilters} variant="outlined" sx={outlinedButtonSx}>
                  Clear filters
                </Button>
              ) : (
                <Button onClick={() => openArticle("new")} variant="contained" startIcon={<AddRounded />} sx={primaryButtonSx}>
                  Write article
                </Button>
              )
            }
          />
        }
      />
    </Box>
  );
}
