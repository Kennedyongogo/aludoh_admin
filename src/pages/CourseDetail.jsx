import React, { useEffect, useState } from "react";
import { Alert } from "@mui/material";
import { Helmet } from "react-helmet-async";
import { adminRequest } from "../utils/adminApi";
import ContentPage from "../components/Content/ContentPage";
import useDetailPage from "../components/Content/useDetailPage";
import {
  CourseChips,
  CourseForm,
  CoursePreview,
  CourseQuickActions,
  courseDeletePrompt,
  toForm,
  toPayload,
} from "../components/Content/CourseContent";
import { publicLink } from "../components/Content/constants";

export default function CourseDetail() {
  const [categories, setCategories] = useState([]);
  const d = useDetailPage({
    listPath: "/courses",
    endpoint: "/api/courses",
    toForm,
    toPayload,
    noun: "course",
    deletePrompt: courseDeletePrompt,
  });
  const { form, setField, record } = d;
  const shown = d.mode === "edit" ? form : record;

  useEffect(() => {
    adminRequest("/api/courses/admin/options")
      .then(({ data }) => setCategories(data.categories || []))
      .catch(() => setCategories([]));
  }, []);

  return (
    <>
      <Helmet>
        <title>{`${d.isNew ? "Add course" : record?.name || "Course"} | Mcaludoh Consultancy Admin`}</title>
      </Helmet>

      <ContentPage
        {...d.pageProps}
        backLabel="All courses"
        eyebrow={d.isNew ? "Add course" : `${d.mode === "edit" ? "Editing course" : "Training course"}${record?.category ? ` · ${record.category}` : ""}`}
        title={d.isNew ? form.name || "New course" : record?.name}
        cover={shown?.image}
        chips={shown && <CourseChips course={shown} />}
        siteUrl={record?.is_published ? publicLink(`/training/${record.slug}`) : ""}
        saveLabel={d.isNew ? "Create course" : "Save changes"}
        viewActions={record && <CourseQuickActions course={record} saving={d.saving} patch={d.patch} />}
      >
        {d.loadError && (
          <Alert severity="error" sx={{ borderRadius: "12px" }}>
            {d.loadError}
          </Alert>
        )}
        {!d.loadError && d.mode === "view" && record && <CoursePreview course={record} />}
        {!d.loadError && d.mode === "edit" && <CourseForm form={form} setField={setField} categories={categories} />}
      </ContentPage>
    </>
  );
}
