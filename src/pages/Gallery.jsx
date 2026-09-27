import React, { useState } from "react";
import { Box, Button, Typography, useMediaQuery } from "@mui/material";
import { AddRounded, PhotoLibraryRounded } from "@mui/icons-material";
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
import { albumCover, albumDeletePrompt } from "../components/Content/GalleryContent";
import { GREEN, VISIBILITY, findOption, timeAgo } from "../components/Content/constants";

const VIEWS = [
  { value: "", label: "All albums", count: (s) => s?.total },
  { value: "true", label: "Published", count: (s) => s?.published, color: "#1D4E89" },
  { value: "false", label: "Hidden", count: (s) => s?.hidden, color: "#5B6660" },
];

const photoCount = (album) => {
  const n = album.photos?.length || 0;
  return `${n} photo${n === 1 ? "" : "s"}`;
};

export default function Gallery() {
  const isDesktop = useMediaQuery("(min-width:900px)");
  const navigate = useNavigate();
  const [published, setPublished] = useState("");
  const list = useAdminList("/api/gallery/admin", { published });

  const hasFilters = Boolean(list.search || published);
  const clearFilters = () => {
    list.clearSearch();
    setPublished("");
  };
  const chooseView = (value) => {
    setPublished(published === value ? "" : value);
    list.resetPage();
  };

  const openAlbum = (id, mode = "view") =>
    navigate(id === "new" ? "/gallery/new" : mode === "edit" ? `/gallery/${id}/edit` : `/gallery/${id}`);

  const removeAlbum = async (album) => {
    if (!(await confirmDelete(albumDeletePrompt(album)))) return;
    try {
      await adminRequest(`/api/gallery/${album.id}`, { method: "DELETE" });
      toastSuccess("Album deleted");
      list.refresh();
    } catch (err) {
      list.setError(err.message);
    }
  };

  const actions = (a) => (
    <ActionIcons label={a.name} onView={() => openAlbum(a.id)} onEdit={() => openAlbum(a.id, "edit")} onDelete={() => removeAlbum(a)} />
  );

  const columns = [
    {
      key: "album",
      label: "Album",
      render: (a) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0 }}>
          <Thumb src={albumCover(a)} alt={a.name} size={56} icon={<PhotoLibraryRounded />} />
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontWeight: 700, color: GREEN.ink, fontSize: "0.9rem", display: "flex", alignItems: "center", gap: 0.75 }}>
              <Box component="span" sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 380 }}>
                {a.name}
              </Box>
              {!a.is_published && <Pill option={findOption(VISIBILITY, "draft")} />}
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary", display: "block", maxWidth: 420 }} noWrap>
              {a.description || `Updated ${timeAgo(a.updatedAt)}`}
            </Typography>
          </Box>
        </Box>
      ),
    },
    {
      key: "photos",
      label: "Photos",
      width: 130,
      render: (a) => <Typography sx={{ fontSize: "0.85rem", whiteSpace: "nowrap" }}>{photoCount(a)}</Typography>,
    },
    { key: "actions", label: "Actions", align: "right", width: 140, render: actions },
  ];

  return (
    <Box sx={{ maxWidth: 1280, mx: "auto" }}>
      <Helmet>
        <title>Gallery | Mcaludoh Consultancy Admin</title>
      </Helmet>

      <PageHeader
        title="Gallery"
        subtitle={
          list.summary ? `${list.summary.photos} photos across ${list.summary.total} albums on the website's Gallery page` : "Photo albums shown on the website's Gallery page"
        }
        actions={
          <Button variant="contained" startIcon={<AddRounded />} onClick={() => openAlbum("new")} sx={primaryButtonSx}>
            {isDesktop ? "Add album" : "Add"}
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
            active={published === v.value}
            onClick={() => chooseView(v.value)}
          />
        ))}
      </StatsLayout>

      <Toolbar>
        <SearchField value={list.searchInput} onChange={list.setSearchInput} placeholder="Search album name or description..." />
        {hasFilters && <ClearFiltersButton onClick={clearFilters} />}
      </Toolbar>

      <ErrorBanner error={list.error} onRetry={list.refresh} />

      <ResponsiveList
        {...list.listProps}
        isDesktop={isDesktop}
        columns={columns}
        minWidth={560}
        renderCard={(a) => (
          <ContentCard
            media={<Thumb src={albumCover(a)} alt={a.name} size={68} icon={<PhotoLibraryRounded />} />}
            title={a.name}
            subtitle={a.description}
            chips={
              <>
                <Pill option={{ label: photoCount(a), bg: GREEN.mist, fg: GREEN.deep }} />
                {!a.is_published && <Pill option={findOption(VISIBILITY, "draft")} />}
              </>
            }
            actions={actions(a)}
          />
        )}
        empty={
          <EmptyState
            icon={<PhotoLibraryRounded sx={{ fontSize: 48, color: GREEN.light, mb: 1 }} />}
            title={hasFilters ? "No albums match your filters" : "No albums yet"}
            text={hasFilters ? "Try a different search or clear the filters." : "Create an album, then upload photos from your farms, trainings and projects."}
            action={
              hasFilters ? (
                <Button onClick={clearFilters} variant="outlined" sx={outlinedButtonSx}>
                  Clear filters
                </Button>
              ) : (
                <Button onClick={() => openAlbum("new")} variant="contained" startIcon={<AddRounded />} sx={primaryButtonSx}>
                  Add album
                </Button>
              )
            }
          />
        }
      />
    </Box>
  );
}
