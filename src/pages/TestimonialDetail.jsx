import React, { useEffect, useState } from "react";
import { Alert } from "@mui/material";
import { Helmet } from "react-helmet-async";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { adminRequest } from "../utils/adminApi";
import ContentPage from "../components/Content/ContentPage";
import useContentDialog from "../components/Content/useContentDialog";
import {
  TestimonialChips,
  TestimonialForm,
  TestimonialPreview,
  TestimonialQuickActions,
  testimonialDeletePrompt,
  toForm,
  toPayload,
} from "../components/Content/TestimonialContent";

const LIST_PATH = "/testimonials";

export default function TestimonialDetail() {
  const { id: routeId } = useParams();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const id = routeId || "new";
  const urlMode = id === "new" || pathname.endsWith("/edit") ? "edit" : "view";
  const [services, setServices] = useState([]);
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    adminRequest("/api/services/admin")
      .then(({ data }) => setServices(data))
      .catch(() => setServices([]));
    adminRequest("/api/projects/admin?limit=100")
      .then(({ data }) => setProjects(data))
      .catch(() => setProjects([]));
  }, []);

  const d = useContentDialog({
    id,
    initialMode: urlMode,
    endpoint: "/api/testimonials",
    toForm,
    toPayload,
    noun: "testimonial",
    deletePrompt: testimonialDeletePrompt,
    onClose: () => navigate(LIST_PATH),
    onSaved: (saved) => navigate(`${LIST_PATH}/${saved.id}`, { replace: true }),
    onDeleted: () => navigate(LIST_PATH, { replace: true }),
  });

  const { form, setField, setForm, record } = d;
  const hasUnsaved = d.mode === "edit" && d.dirty;

  // Warn before a reload or closing the tab loses edits
  useEffect(() => {
    if (!hasUnsaved) return undefined;
    const warn = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [hasUnsaved]);

  const switchMode = async (next) => {
    if (!(await d.changeMode(next))) return;
    navigate(next === "edit" ? `${LIST_PATH}/${record.id}/edit` : `${LIST_PATH}/${record.id}`, { replace: true });
  };

  const shown = d.mode === "edit" ? form : record;

  return (
    <>
      <Helmet>
        <title>{`${d.isNew ? "Add testimonial" : record ? `Testimonial from ${record.client_name}` : "Testimonial"} | Mcaludoh Consultancy Admin`}</title>
      </Helmet>

      <ContentPage
        backLabel="All testimonials"
        onBack={d.requestClose}
        eyebrow={d.isNew ? "Add testimonial" : d.mode === "edit" ? "Editing testimonial" : "Testimonial"}
        title={d.isNew ? form.client_name || "New testimonial" : record?.client_name}
        chips={shown && <TestimonialChips t={shown} record={record} />}
        loading={d.loading}
        unavailable={Boolean(d.loadError)}
        mode={d.mode}
        onModeChange={switchMode}
        isNew={d.isNew}
        error={d.error}
        dirty={d.dirty}
        saving={d.saving}
        onSave={d.save}
        onDiscard={d.discard}
        onDelete={d.remove}
        saveLabel={d.isNew ? "Add testimonial" : "Save changes"}
        viewActions={record && <TestimonialQuickActions t={record} saving={d.saving} patch={d.patch} />}
      >
        {d.loadError && (
          <Alert severity="error" sx={{ borderRadius: "12px" }}>
            {d.loadError}
          </Alert>
        )}
        {!d.loadError && d.mode === "view" && record && <TestimonialPreview t={record} />}
        {!d.loadError && d.mode === "edit" && (
          <TestimonialForm form={form} setField={setField} setForm={setForm} services={services} projects={projects} />
        )}
      </ContentPage>
    </>
  );
}
