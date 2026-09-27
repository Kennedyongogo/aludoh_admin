import React from "react";
import { Alert, Avatar, Box, Button, Rating, Typography } from "@mui/material";
import {
  BlockRounded,
  CheckCircleRounded,
  DesignServicesRounded,
  EmailRounded,
  EventRounded,
  FormatQuoteRounded,
  HowToRegRounded,
  PhoneRounded,
  PublicRounded,
  SourceRounded,
  StarBorderRounded,
  StarRounded,
  StickyNote2Rounded,
  WorkRounded,
} from "@mui/icons-material";
import { Field, FieldGrid, ImageField, InfoGrid, InfoRow, Section, SwitchRow } from "./FormKit";
import { Pill, Stars } from "./ListKit";
import {
  GREEN,
  TESTIMONIAL_SOURCES,
  TESTIMONIAL_STATUSES,
  findOption,
  formatDate,
  initials,
  labelOf,
  mediaUrl,
  timeAgo,
} from "./constants";

const EMPTY = {
  client_name: "",
  organization: "",
  role: "",
  rating: 5,
  content: "",
  photo: "",
  service_id: "",
  project_id: "",
  status: "approved",
  is_featured: false,
  source: "admin",
  email: "",
  phone: "",
  admin_note: "",
  sort_order: "",
};

export const toForm = (t) => {
  if (!t) return { ...EMPTY };
  const form = {};
  Object.keys(EMPTY).forEach((key) => {
    const value = t[key];
    form[key] = value === null || value === undefined ? (key === "rating" ? null : EMPTY[key]) : value;
  });
  form.sort_order = t.sort_order ?? "";
  return form;
};

export const toPayload = (form) => ({
  ...form,
  service_id: form.service_id || null,
  project_id: form.project_id || null,
  sort_order: form.sort_order === "" ? null : form.sort_order,
});

export const testimonialDeletePrompt = (t) => ({
  title: "Delete this testimonial?",
  text: `The testimonial from ${t.client_name} will be removed${t.status === "approved" ? " from the website" : ""}.`,
});

function QuoteCard({ t }) {
  return (
    <Box
      sx={{
        position: "relative",
        p: { xs: 2.5, sm: 3.5 },
        mb: 2,
        borderRadius: "22px",
        bgcolor: "#fff",
        border: "1px solid rgba(45, 106, 79, 0.1)",
        overflow: "hidden",
      }}
    >
      <FormatQuoteRounded sx={{ position: "absolute", right: 12, top: 4, fontSize: { xs: 80, sm: 110 }, color: GREEN.mist, transform: "scaleX(-1)" }} />
      <Box sx={{ position: "relative" }}>
        <Stars value={t.rating} size={20} />
        <Typography sx={{ mt: 1.5, fontSize: { xs: "1rem", sm: "1.12rem" }, lineHeight: 1.75, color: GREEN.ink, whiteSpace: "pre-line", overflowWrap: "anywhere" }}>
          “{t.content}”
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mt: 2.5 }}>
          <Avatar src={mediaUrl(t.photo) || undefined} sx={{ width: 48, height: 48, bgcolor: GREEN.main, fontWeight: 700 }}>
            {initials(t.client_name)}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontWeight: 700, color: GREEN.deep }}>{t.client_name}</Typography>
            <Typography sx={{ fontSize: "0.82rem", color: "text.secondary" }}>
              {[t.role, t.organization].filter(Boolean).join(", ") || "No role or organisation"}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export function TestimonialPreview({ t }) {
  return (
    <>
      {t.status === "pending" && (
        <Alert severity="warning" sx={{ mb: 2, borderRadius: "12px" }}>
          Waiting for review. Approve it to show it on the website, or reject it to keep it hidden.
        </Alert>
      )}
      {t.status === "rejected" && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: "12px" }}>
          Rejected, so it's hidden from the website.
        </Alert>
      )}

      <QuoteCard t={t} />

      <Box sx={{ display: "grid", gap: { md: 2 }, gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1fr) minmax(0, 1.4fr)" }, alignItems: "start" }}>
        <Section title="Linked to">
          <Box sx={{ display: "grid", gap: 2 }}>
            <InfoRow icon={DesignServicesRounded} label="Service" value={t.service?.name || "Not linked"} />
            <InfoRow
              icon={WorkRounded}
              label="Project"
              value={t.project ? `${t.project.name}${t.project.is_published ? "" : " (hidden)"}` : "Not linked"}
            />
          </Box>
        </Section>

        <Section title="Submission">
          <InfoGrid>
            <InfoRow icon={SourceRounded} label="Source" value={labelOf(TESTIMONIAL_SOURCES, t.source)} />
            <InfoRow icon={EventRounded} label="Received" value={`${formatDate(t.createdAt)} · ${timeAgo(t.createdAt)}`} />
            <InfoRow
              icon={EmailRounded}
              label="Email"
              value={
                t.email && (
                  <Box component="a" href={`mailto:${t.email}`} sx={{ color: GREEN.main, overflowWrap: "anywhere" }}>
                    {t.email}
                  </Box>
                )
              }
            />
            <InfoRow
              icon={PhoneRounded}
              label="Phone"
              value={
                t.phone && (
                  <Box component="a" href={`tel:${t.phone}`} sx={{ color: GREEN.main }}>
                    {t.phone}
                  </Box>
                )
              }
            />
            <InfoRow icon={PublicRounded} label="IP address" value={t.ip_address} />
            <InfoRow
              icon={HowToRegRounded}
              label="Reviewed"
              value={t.reviewed_at && `${formatDate(t.reviewed_at)}${t.reviewer ? ` by ${t.reviewer.name}` : ""}`}
            />
          </InfoGrid>
        </Section>
      </Box>

      {t.admin_note && (
        <Section title="Internal note">
          <Box sx={{ display: "flex", gap: 1.25 }}>
            <StickyNote2Rounded sx={{ color: "#C28A00", mt: 0.25 }} />
            <Typography sx={{ fontSize: "0.9rem", color: GREEN.ink, whiteSpace: "pre-line" }}>{t.admin_note}</Typography>
          </Box>
        </Section>
      )}
    </>
  );
}

export function TestimonialChips({ t, record }) {
  return (
    <>
      <Pill option={findOption(TESTIMONIAL_STATUSES, t.status)} />
      {t.is_featured && <Pill option={{ label: "Featured", bg: "#FFF4CC", fg: "#7A5A00" }} icon={<StarRounded />} />}
      {record && (
        <Typography sx={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.8)" }}>
          {labelOf(TESTIMONIAL_SOURCES, record.source)} · {timeAgo(record.createdAt)}
        </Typography>
      )}
    </>
  );
}

const reviewButtonSx = (color) => ({
  textTransform: "none",
  fontWeight: 700,
  borderRadius: "12px",
  color,
  borderColor: `${color}55`,
  "&:hover": { borderColor: color, bgcolor: `${color}0F` },
});

export function TestimonialQuickActions({ t, saving, patch }) {
  return (
    <>
      {t.status !== "rejected" && (
        <Button
          variant="outlined"
          disabled={saving}
          startIcon={<BlockRounded />}
          onClick={() => patch({ status: "rejected" }, "Testimonial rejected")}
          sx={reviewButtonSx("#B42318")}
        >
          Reject
        </Button>
      )}
      {t.status !== "approved" && (
        <Button
          variant="outlined"
          disabled={saving}
          startIcon={<CheckCircleRounded />}
          onClick={() => patch({ status: "approved" }, "Approved and live on the website")}
          sx={reviewButtonSx(GREEN.main)}
        >
          Approve
        </Button>
      )}
      {t.status === "approved" && (
        <Button
          variant="outlined"
          disabled={saving}
          startIcon={t.is_featured ? <StarRounded sx={{ color: "#E0A100" }} /> : <StarBorderRounded />}
          onClick={() => patch({ is_featured: !t.is_featured }, t.is_featured ? "Removed from featured" : "Marked as featured")}
          sx={reviewButtonSx("#8A6A00")}
        >
          {t.is_featured ? "Unfeature" : "Feature"}
        </Button>
      )}
    </>
  );
}

export function TestimonialForm({ form, setField, setForm, services, projects }) {
  const serviceOptions = [{ value: "", label: "Not linked" }, ...services.map((s) => ({ value: s.id, label: s.name }))];
  const projectOptions = [
    { value: "", label: "Not linked" },
    ...projects.map((p) => ({ value: p.id, label: p.client ? `${p.name} — ${p.client}` : p.name })),
  ];

  // Picking a project brings its service along
  const chooseProject = (projectId) => {
    const project = projects.find((p) => p.id === projectId);
    setForm((f) => ({ ...f, project_id: projectId, service_id: project?.service_id || f.service_id }));
  };

  return (
    <>
      <Section title="Testimonial">
        <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", columnGap: 1.5, rowGap: 0.5, mb: 2 }}>
          <Typography sx={{ fontSize: "0.85rem", fontWeight: 600, color: GREEN.ink }}>Rating</Typography>
          <Rating value={form.rating} onChange={(_, value) => setField("rating")(value)} size="large" sx={{ color: "#E0A100" }} />
          <Typography sx={{ fontSize: "0.8rem", color: "text.secondary" }}>
            {form.rating ? `${form.rating}/5` : "No rating (click a star to set)"}
          </Typography>
        </Box>
        <FieldGrid>
          <Field label="What the client said" value={form.content} onChange={setField("content")} max={5000} multiline rows={6} span required />
        </FieldGrid>
      </Section>

      <Section title="Client">
        <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "180px minmax(0, 1fr)" }, alignItems: "start" }}>
          <Box sx={{ maxWidth: { xs: 180, sm: "none" } }}>
            <ImageField label="Photo" value={form.photo} onChange={setField("photo")} folder="testimonials" aspect="1 / 1" />
          </Box>
          <FieldGrid>
            <Field label="Name" value={form.client_name} onChange={setField("client_name")} max={120} required span />
            <Field label="Role" value={form.role} onChange={setField("role")} max={120} placeholder="e.g. Head teacher" />
            <Field label="Organisation / farm" value={form.organization} onChange={setField("organization")} max={160} />
            <Field label="Email" type="email" value={form.email} onChange={setField("email")} helper="Private, never shown" />
            <Field label="Phone" value={form.phone} onChange={setField("phone")} helper="Private, never shown" />
          </FieldGrid>
        </Box>
      </Section>

      <Box sx={{ display: "grid", gap: { md: 2 }, gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" }, alignItems: "start" }}>
        <Section title="Links" hint="Linked testimonials appear on that service's or project's page.">
          <Box sx={{ display: "grid", gap: 2 }}>
            <Field label="Project" value={form.project_id} onChange={chooseProject} select options={projectOptions} />
            <Field label="Service" value={form.service_id} onChange={setField("service_id")} select options={serviceOptions} />
          </Box>
        </Section>

        <Section title="Publishing">
          <FieldGrid>
            <Field
              label="Status"
              value={form.status}
              onChange={setField("status")}
              select
              options={TESTIMONIAL_STATUSES}
              helper="Only approved ones go live"
            />
            <Field label="Source" value={form.source} onChange={setField("source")} select options={TESTIMONIAL_SOURCES} />
            <Box className="span-all">
              <SwitchRow
                label="Featured"
                description="Shown first and in the testimonials carousel"
                checked={form.is_featured}
                onChange={setField("is_featured")}
              />
            </Box>
            <Field label="Display position" type="number" value={form.sort_order} onChange={setField("sort_order")} helper="Lower numbers show first" span />
          </FieldGrid>
        </Section>
      </Box>

      <Section title="Internal note">
        <FieldGrid>
          <Field label="Note" value={form.admin_note} onChange={setField("admin_note")} max={5000} multiline rows={3} span helper="Only visible to admins" />
        </FieldGrid>
      </Section>
    </>
  );
}
