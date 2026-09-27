import React from "react";
import { Alert, Box, Button, Typography } from "@mui/material";
import { PhotoLibraryRounded, VisibilityOffRounded, VisibilityRounded } from "@mui/icons-material";
import { Field, FieldGrid, GalleryField, ImageField, Paragraph, Section, SwitchRow } from "./FormKit";
import { Pill, Thumb } from "./ListKit";
import { GREEN, VISIBILITY, findOption } from "./constants";

export const MAX_ALBUM_PHOTOS = 60;

const EMPTY = { name: "", slug: "", description: "", cover_image: "", photos: [], is_published: true, sort_order: "" };

export const toForm = (album) =>
  album
    ? {
        name: album.name || "",
        slug: album.slug || "",
        description: album.description || "",
        cover_image: album.cover_image || "",
        photos: (album.photos || []).map((p) => ({ url: p.url, caption: p.caption || "" })),
        is_published: album.is_published !== false,
        sort_order: album.sort_order ?? "",
      }
    : { ...EMPTY };

export const toPayload = (form) => ({
  ...form,
  sort_order: form.sort_order === "" ? null : form.sort_order,
});

export const albumDeletePrompt = (album) => ({
  title: "Delete this album?",
  text: `${album.name} and its ${album.photos?.length || 0} photo(s) will be removed from the gallery.`,
});

export const albumCover = (album) => album?.cover_image || album?.photos?.[0]?.url || "";

export function AlbumChips({ album }) {
  return (
    <>
      <Pill option={findOption(VISIBILITY, album.is_published ? "published" : "draft")} />
      <Typography sx={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.85)" }}>
        {album.photos?.length || 0} photo{album.photos?.length === 1 ? "" : "s"}
      </Typography>
    </>
  );
}

export function AlbumQuickActions({ album, saving, patch }) {
  return (
    <Button
      variant="outlined"
      disabled={saving}
      startIcon={album.is_published ? <VisibilityOffRounded /> : <VisibilityRounded />}
      onClick={() => patch({ is_published: !album.is_published }, album.is_published ? "Album hidden" : "Album published")}
      sx={{ textTransform: "none", fontWeight: 700, borderRadius: "12px", color: GREEN.main, borderColor: "rgba(45,106,79,0.35)" }}
    >
      {album.is_published ? "Hide" : "Publish"}
    </Button>
  );
}

export function AlbumPreview({ album }) {
  const photos = album.photos || [];
  return (
    <>
      {!album.is_published && (
        <Alert severity="info" sx={{ mb: 2, borderRadius: "12px" }}>
          Hidden: this album isn't shown on the website's gallery.
        </Alert>
      )}
      {album.is_published && !photos.length && (
        <Alert severity="warning" sx={{ mb: 2, borderRadius: "12px" }}>
          Albums without photos are left off the website. Add some photos to show it.
        </Alert>
      )}

      {album.description && (
        <Section title="About this album">
          <Paragraph>{album.description}</Paragraph>
        </Section>
      )}

      <Section title={`Photos (${photos.length})`}>
        {photos.length ? (
          <Box
            sx={{
              display: "grid",
              gap: 1.5,
              gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", sm: "repeat(3, minmax(0, 1fr))", md: "repeat(4, minmax(0, 1fr))" },
            }}
          >
            {photos.map((photo, i) => (
              <Box key={`${photo.url}-${i}`} sx={{ borderRadius: "14px", overflow: "hidden", border: "1px solid rgba(45,106,79,0.12)", bgcolor: "#fff" }}>
                <Thumb src={photo.url} alt={photo.caption || album.name} size="100%" radius={0} sx={{ aspectRatio: "4 / 3", height: "auto" }} />
                <Typography sx={{ fontSize: "0.78rem", color: photo.caption ? GREEN.ink : "text.disabled", px: 1.25, py: 0.9 }} noWrap title={photo.caption}>
                  {photo.caption || "No caption"}
                </Typography>
              </Box>
            ))}
          </Box>
        ) : (
          <Box sx={{ textAlign: "center", py: 5, color: "text.secondary" }}>
            <PhotoLibraryRounded sx={{ fontSize: 42, color: GREEN.light }} />
            <Typography sx={{ fontSize: "0.9rem" }}>No photos yet. Switch to Edit to upload some.</Typography>
          </Box>
        )}
      </Section>
    </>
  );
}

export function AlbumForm({ form, setField }) {
  return (
    <>
      <Box sx={{ display: "grid", gap: { md: 2 }, gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1.4fr) minmax(0, 1fr)" }, alignItems: "start" }}>
        <Section title="Album">
          <FieldGrid>
            <Field label="Album name" value={form.name} onChange={setField("name")} max={120} required span placeholder="e.g. Hydroponics" />
            <Field
              label="Description"
              value={form.description}
              onChange={setField("description")}
              max={500}
              multiline
              rows={3}
              span
              helper="Optional, shown under the album name"
            />
            <Field label="Web address" value={form.slug} onChange={setField("slug")} max={160} helper="Leave empty to use the name" />
            <Field label="Display position" type="number" value={form.sort_order} onChange={setField("sort_order")} helper="Lower numbers show first" />
            <Box className="span-all">
              <SwitchRow
                label="Show on website"
                description="Hidden albums stay here but aren't listed on the gallery page"
                checked={form.is_published}
                onChange={setField("is_published")}
              />
            </Box>
          </FieldGrid>
        </Section>

        <Section title="Cover photo">
          <ImageField
            label="Cover"
            value={form.cover_image}
            onChange={setField("cover_image")}
            folder="gallery"
            aspect="4 / 3"
            helper="Optional. The first photo is used when this is empty."
          />
        </Section>
      </Box>

      <Section title={`Photos (${form.photos.length}/${MAX_ALBUM_PHOTOS})`} hint="Upload several at once, add captions, and use the arrows to reorder.">
        <GalleryField value={form.photos} onChange={setField("photos")} folder="gallery" max={MAX_ALBUM_PHOTOS} />
      </Section>
    </>
  );
}
