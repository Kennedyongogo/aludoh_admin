import React, { useEffect } from "react";
import { Alert, Typography } from "@mui/material";
import { Helmet } from "react-helmet-async";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import ContentPage from "../components/Content/ContentPage";
import useContentDialog from "../components/Content/useContentDialog";
import { Pill } from "../components/Content/ListKit";
import { ServiceForm, ServicePreview, serviceDeletePrompt, toForm, toPayload } from "../components/Content/ServiceContent";
import { SERVICE_STATUSES, findOption, publicLink } from "../components/Content/constants";

const LIST_PATH = "/services";

export default function ServiceDetail() {
  const { id: routeId } = useParams();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const id = routeId || "new";
  const urlMode = id === "new" || pathname.endsWith("/edit") ? "edit" : "view";

  const d = useContentDialog({
    id,
    initialMode: urlMode,
    endpoint: "/api/services",
    toForm,
    toPayload,
    noun: "service",
    deletePrompt: serviceDeletePrompt,
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

  const status = findOption(SERVICE_STATUSES, (d.mode === "edit" ? form.status : record?.status) || "active");
  const title = d.isNew ? form.name || "New service" : record?.name;

  return (
    <>
      <Helmet>
        <title>{`${d.isNew ? "Add service" : record?.name || "Service"} | Mcaludoh Consultancy Admin`}</title>
      </Helmet>

      <ContentPage
        backLabel="All services"
        onBack={d.requestClose}
        eyebrow={d.isNew ? "Add service" : d.mode === "edit" ? "Editing service" : "Service"}
        title={title}
        cover={record?.image}
        chips={
          (record || d.isNew) && (
            <>
              <Pill option={status} />
              {record?.short_name && (
                <Typography sx={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.85)" }}>{record.short_name}</Typography>
              )}
              {record && <Typography sx={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.7)" }}>/{record.slug}</Typography>}
            </>
          )
        }
        loading={d.loading}
        unavailable={Boolean(d.loadError)}
        mode={d.mode}
        onModeChange={switchMode}
        isNew={d.isNew}
        siteUrl={record?.status === "active" ? publicLink(`/services/${record.slug}`) : ""}
        error={d.error}
        dirty={d.dirty}
        saving={d.saving}
        onSave={d.save}
        onDiscard={d.discard}
        onDelete={d.remove}
        saveLabel={d.isNew ? "Create service" : "Save changes"}
      >
        {d.loadError && (
          <Alert severity="error" sx={{ borderRadius: "12px" }}>
            {d.loadError}
          </Alert>
        )}
        {!d.loadError && d.mode === "view" && record && <ServicePreview service={record} />}
        {!d.loadError && d.mode === "edit" && <ServiceForm form={form} setField={setField} record={record} page />}
      </ContentPage>
    </>
  );
}
