import React, { useEffect, useState } from "react";
import { Alert } from "@mui/material";
import { Helmet } from "react-helmet-async";
import { adminRequest } from "../utils/adminApi";
import ContentPage from "../components/Content/ContentPage";
import useDetailPage from "../components/Content/useDetailPage";
import {
  ArticleChips,
  ArticleForm,
  ArticlePreview,
  ArticleQuickActions,
  articleDeletePrompt,
  toForm,
  toPayload,
} from "../components/Content/ArticleContent";
import { articleState, publicLink } from "../components/Content/constants";

export default function ArticleDetail() {
  const [categories, setCategories] = useState([]);
  const d = useDetailPage({
    listPath: "/knowledge",
    endpoint: "/api/articles",
    toForm,
    toPayload,
    noun: "article",
    deletePrompt: articleDeletePrompt,
  });
  const { form, setField, record } = d;
  const shown = d.mode === "edit" ? form : record;

  useEffect(() => {
    adminRequest("/api/articles/admin/options")
      .then(({ data }) => setCategories(data.categories || []))
      .catch(() => setCategories([]));
  }, []);

  return (
    <>
      <Helmet>
        <title>{`${d.isNew ? "Write article" : record?.title || "Article"} | Mcaludoh Consultancy Admin`}</title>
      </Helmet>

      <ContentPage
        {...d.pageProps}
        backLabel="All articles"
        eyebrow={d.isNew ? "Write article" : d.mode === "edit" ? "Editing article" : "Knowledge Center"}
        title={d.isNew ? form.title || "New article" : record?.title}
        cover={shown?.featured_image}
        chips={shown && <ArticleChips article={shown} />}
        siteUrl={record && articleState(record) === "published" ? publicLink(`/blog/${record.slug}`) : ""}
        saveLabel={d.isNew ? "Create article" : "Save changes"}
        viewActions={record && <ArticleQuickActions article={record} saving={d.saving} patch={d.patch} />}
      >
        {d.loadError && (
          <Alert severity="error" sx={{ borderRadius: "12px" }}>
            {d.loadError}
          </Alert>
        )}
        {!d.loadError && d.mode === "view" && record && <ArticlePreview article={record} />}
        {!d.loadError && d.mode === "edit" && <ArticleForm form={form} setField={setField} categories={categories} />}
      </ContentPage>
    </>
  );
}
