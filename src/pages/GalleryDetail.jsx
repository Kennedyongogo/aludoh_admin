import React from "react";
import { Alert } from "@mui/material";
import { Helmet } from "react-helmet-async";
import ContentPage from "../components/Content/ContentPage";
import useDetailPage from "../components/Content/useDetailPage";
import {
  AlbumChips,
  AlbumForm,
  AlbumPreview,
  AlbumQuickActions,
  albumCover,
  albumDeletePrompt,
  toForm,
  toPayload,
} from "../components/Content/GalleryContent";
import { publicLink } from "../components/Content/constants";

export default function GalleryDetail() {
  const d = useDetailPage({
    listPath: "/gallery",
    endpoint: "/api/gallery",
    toForm,
    toPayload,
    noun: "album",
    deletePrompt: albumDeletePrompt,
  });
  const { form, setField, record } = d;
  const shown = d.mode === "edit" ? form : record;

  return (
    <>
      <Helmet>
        <title>{`${d.isNew ? "Add album" : record?.name || "Album"} | Mcaludoh Consultancy Admin`}</title>
      </Helmet>

      <ContentPage
        {...d.pageProps}
        backLabel="All albums"
        eyebrow={d.isNew ? "Add album" : d.mode === "edit" ? "Editing album" : "Gallery album"}
        title={d.isNew ? form.name || "New album" : record?.name}
        cover={albumCover(shown)}
        chips={shown && <AlbumChips album={shown} />}
        siteUrl={record?.is_published && record.photos?.length ? publicLink("/gallery") : ""}
        saveLabel={d.isNew ? "Create album" : "Save changes"}
        viewActions={record && <AlbumQuickActions album={record} saving={d.saving} patch={d.patch} />}
      >
        {d.loadError && (
          <Alert severity="error" sx={{ borderRadius: "12px" }}>
            {d.loadError}
          </Alert>
        )}
        {!d.loadError && d.mode === "view" && record && <AlbumPreview album={record} />}
        {!d.loadError && d.mode === "edit" && <AlbumForm form={form} setField={setField} />}
      </ContentPage>
    </>
  );
}
