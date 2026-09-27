import React, { useEffect, useState } from "react";
import { Alert } from "@mui/material";
import { Helmet } from "react-helmet-async";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { adminRequest } from "../utils/adminApi";
import ContentPage from "../components/Content/ContentPage";
import useContentDialog from "../components/Content/useContentDialog";
import {
  ProjectChips,
  ProjectForm,
  ProjectPreview,
  ProjectQuickActions,
  projectDeletePrompt,
  toForm,
  toPayload,
} from "../components/Content/ProjectContent";
import { publicLink } from "../components/Content/constants";

const LIST_PATH = "/projects";

export default function ProjectDetail() {
  const { id: routeId } = useParams();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const id = routeId || "new";
  const urlMode = id === "new" || pathname.endsWith("/edit") ? "edit" : "view";
  const [services, setServices] = useState([]);

  useEffect(() => {
    adminRequest("/api/services/admin")
      .then(({ data }) => setServices(data))
      .catch(() => setServices([]));
  }, []);

  const d = useContentDialog({
    id,
    initialMode: urlMode,
    endpoint: "/api/projects",
    toForm,
    toPayload,
    noun: "project",
    deletePrompt: projectDeletePrompt,
    onClose: () => navigate(LIST_PATH),
    onSaved: (saved) => navigate(`${LIST_PATH}/${saved.id}`, { replace: true }),
    onDeleted: () => navigate(LIST_PATH, { replace: true }),
  });

  const { form, setField, record } = d;
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
  const serviceName = record?.service ? record.service.short_name || record.service.name : "";

  return (
    <>
      <Helmet>
        <title>{`${d.isNew ? "Add project" : record?.name || "Project"} | Mcaludoh Consultancy Admin`}</title>
      </Helmet>

      <ContentPage
        backLabel="All projects"
        onBack={d.requestClose}
        eyebrow={
          d.isNew ? "Add project" : `${d.mode === "edit" ? "Editing project" : "Project"}${serviceName ? ` · ${serviceName}` : ""}`
        }
        title={d.isNew ? form.name || "New project" : record?.name}
        cover={record?.cover_image}
        chips={shown && <ProjectChips project={shown} />}
        loading={d.loading}
        unavailable={Boolean(d.loadError)}
        mode={d.mode}
        onModeChange={switchMode}
        isNew={d.isNew}
        siteUrl={record?.is_published ? publicLink(`/projects/${record.slug}`) : ""}
        error={d.error}
        dirty={d.dirty}
        saving={d.saving}
        onSave={d.save}
        onDiscard={d.discard}
        onDelete={d.remove}
        saveLabel={d.isNew ? "Create project" : "Save changes"}
        viewActions={record && <ProjectQuickActions project={record} saving={d.saving} patch={d.patch} />}
      >
        {d.loadError && (
          <Alert severity="error" sx={{ borderRadius: "12px" }}>
            {d.loadError}
          </Alert>
        )}
        {!d.loadError && d.mode === "view" && record && <ProjectPreview project={record} />}
        {!d.loadError && d.mode === "edit" && <ProjectForm form={form} setField={setField} services={services} page />}
      </ContentPage>
    </>
  );
}
