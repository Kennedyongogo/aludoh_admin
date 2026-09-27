import React, { useState } from "react";
import { Alert, Autocomplete, Box, Button, TextField, Typography } from "@mui/material";
import {
  AccessTimeRounded,
  BusinessRounded,
  CalendarMonthRounded,
  DesignServicesRounded,
  PersonRounded,
  PlaceRounded,
  PublicOffRounded,
  PublicRounded,
  SquareFootRounded,
  StarBorderRounded,
  StarRounded,
} from "@mui/icons-material";
import {
  Field,
  FieldGrid,
  FormTabs,
  GalleryField,
  ImageField,
  InfoGrid,
  InfoRow,
  Paragraph,
  RepeaterField,
  Section,
  StringListField,
  SwitchRow,
  TagList,
  fieldSx,
} from "./FormKit";
import { Pill, Stars, Thumb } from "./ListKit";
import { GREEN, KENYA_COUNTIES, PROJECT_STATUSES, TESTIMONIAL_STATUSES, VISIBILITY, findOption, formatDate } from "./constants";

const EMPTY = {
  name: "",
  slug: "",
  service_id: "",
  client: "",
  location: "",
  county: "",
  year: "",
  status: "completed",
  size: "",
  duration: "",
  summary: "",
  challenge: "",
  solution: "",
  scope: [],
  results: [],
  cover_image: "",
  before_image: "",
  after_image: "",
  gallery: [],
  is_featured: false,
  is_published: true,
  sort_order: "",
  seo_title: "",
  seo_description: "",
};

export const toForm = (project) => {
  if (!project) return { ...EMPTY, year: String(new Date().getFullYear()) };
  const form = {};
  Object.keys(EMPTY).forEach((key) => {
    const value = project[key];
    form[key] = value === null || value === undefined ? EMPTY[key] : value;
  });
  form.year = project.year ? String(project.year) : "";
  form.sort_order = project.sort_order ?? "";
  form.gallery = (project.gallery || []).map((g) => ({ url: g.url, caption: g.caption || "" }));
  return form;
};

export const toPayload = (form) => ({
  ...form,
  service_id: form.service_id || null,
  year: form.year === "" ? null : form.year,
  sort_order: form.sort_order === "" ? null : form.sort_order,
});

const TABS = [
  { value: "basics", label: "Basics" },
  { value: "story", label: "Story & results" },
  { value: "media", label: "Photos" },
  { value: "seo", label: "SEO" },
];

function BeforeAfter({ before, after }) {
  if (!before && !after) return null;
  return (
    <Section title="Before & after">
      <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: "1fr 1fr" }}>
        {[
          ["Before", before],
          ["After", after],
        ].map(([label, src]) => (
          <Box key={label} sx={{ position: "relative" }}>
            <Thumb src={src} alt={label} size="100%" radius="14px" sx={{ aspectRatio: "4 / 3", height: "auto" }} />
            <Box
              sx={{
                position: "absolute",
                left: 10,
                top: 10,
                px: 1,
                py: 0.25,
                borderRadius: "8px",
                bgcolor: "rgba(27,67,50,0.85)",
                color: "#fff",
                fontSize: "0.72rem",
                fontWeight: 700,
              }}
            >
              {label}
            </Box>
          </Box>
        ))}
      </Box>
    </Section>
  );
}

export function ProjectPreview({ project }) {
  return (
    <>
      {!project.is_published && (
        <Alert severity="info" sx={{ mb: 2, borderRadius: "12px" }}>
          This project is hidden from the public website.
        </Alert>
      )}

      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "260px minmax(0, 1fr)" }, mb: 2 }}>
        <Thumb
          src={project.cover_image}
          alt={project.name}
          size="100%"
          radius="18px"
          sx={{ aspectRatio: "4 / 3", height: "auto" }}
        />
        <Section title="Project facts" sx={{ mb: 0 }}>
          <InfoGrid>
            <InfoRow icon={DesignServicesRounded} label="Service" value={project.service?.name || "Not linked"} />
            <InfoRow icon={BusinessRounded} label="Client" value={project.client} />
            <InfoRow
              icon={PlaceRounded}
              label="Location"
              value={[project.location, project.county && `${project.county} County`].filter(Boolean).join(" · ")}
            />
            <InfoRow icon={CalendarMonthRounded} label="Year" value={project.year} />
            <InfoRow icon={SquareFootRounded} label="Scale" value={project.size} />
            <InfoRow icon={AccessTimeRounded} label="Duration" value={project.duration} />
          </InfoGrid>
        </Section>
      </Box>

      <Section title="Summary">
        <Paragraph empty="No summary yet">{project.summary}</Paragraph>
      </Section>

      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" } }}>
        <Section title="The challenge" sx={{ mb: { xs: 0, md: 2 } }}>
          <Paragraph>{project.challenge}</Paragraph>
        </Section>
        <Section title="Our solution">
          <Paragraph>{project.solution}</Paragraph>
        </Section>
      </Box>

      {project.results?.length > 0 && (
        <Section title="Results">
          <Box
            sx={{
              display: "grid",
              gap: 1.5,
              gridTemplateColumns: { xs: "1fr 1fr", sm: `repeat(${Math.min(project.results.length, 4)}, 1fr)` },
            }}
          >
            {project.results.map((r, i) => (
              <Box
                key={i}
                sx={{
                  p: 1.75,
                  borderRadius: "14px",
                  textAlign: "center",
                  background: `linear-gradient(135deg, ${GREEN.mist}, #F1F9F3)`,
                }}
              >
                <Typography sx={{ fontWeight: 800, fontSize: "1.35rem", color: GREEN.deep }}>{r.value}</Typography>
                <Typography sx={{ fontSize: "0.78rem", color: GREEN.main, fontWeight: 600 }}>{r.label}</Typography>
              </Box>
            ))}
          </Box>
        </Section>
      )}

      <Section title="Scope of work">
        <TagList items={project.scope} />
      </Section>

      <BeforeAfter before={project.before_image} after={project.after_image} />

      {project.gallery?.length > 0 && (
        <Section title={`Gallery (${project.gallery.length})`}>
          <Box sx={{ display: "grid", gap: 1, gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))" }}>
            {project.gallery.map((g, i) => (
              <Box key={`${g.url}-${i}`}>
                <Thumb src={g.url} alt={g.caption} size="100%" sx={{ aspectRatio: "1", height: "auto" }} />
                {g.caption && (
                  <Typography
                    variant="caption"
                    sx={{ color: "text.secondary", display: "block", mt: 0.5 }}
                    noWrap
                    title={g.caption}
                  >
                    {g.caption}
                  </Typography>
                )}
              </Box>
            ))}
          </Box>
        </Section>
      )}

      <Section title={`Client testimonials (${project.testimonials?.length || 0})`}>
        {project.testimonials?.length ? (
          <Box sx={{ display: "grid", gap: 1.5 }}>
            {project.testimonials.map((t) => (
              <Box key={t.id} sx={{ p: 1.5, borderRadius: "14px", border: "1px solid rgba(45,106,79,0.12)" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.75, flexWrap: "wrap" }}>
                  <Typography sx={{ fontWeight: 700, fontSize: "0.88rem", color: GREEN.ink }}>{t.client_name}</Typography>
                  {t.role && (
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                      {t.role}
                    </Typography>
                  )}
                  <Box sx={{ ml: "auto", display: "flex", gap: 1, alignItems: "center" }}>
                    <Stars value={t.rating} size={14} />
                    <Pill option={findOption(TESTIMONIAL_STATUSES, t.status)} />
                  </Box>
                </Box>
                <Typography sx={{ fontSize: "0.85rem", color: "text.secondary", fontStyle: "italic" }}>“{t.content}”</Typography>
              </Box>
            ))}
          </Box>
        ) : (
          <Paragraph empty="No testimonials linked to this project. Link one from the Testimonials page." />
        )}
      </Section>

      <Section title="Record">
        <InfoGrid>
          <InfoRow
            icon={PersonRounded}
            label="Created"
            value={`${formatDate(project.createdAt)}${project.creator ? ` by ${project.creator.name}` : ""}`}
          />
          <InfoRow
            icon={PersonRounded}
            label="Last updated"
            value={`${formatDate(project.updatedAt)}${project.updater ? ` by ${project.updater.name}` : ""}`}
          />
        </InfoGrid>
      </Section>
    </>
  );
}

const quickButtonSx = {
  textTransform: "none",
  fontWeight: 600,
  borderRadius: "12px",
  color: GREEN.main,
  borderColor: "rgba(45, 106, 79, 0.35)",
  "&:hover": { borderColor: GREEN.main, bgcolor: "#F1F9F3" },
};

export const projectDeletePrompt = (p) => ({
  title: "Delete this project?",
  text: p.testimonial_count
    ? `${p.name} will be removed from the website. Its ${p.testimonial_count} testimonial(s) will stay but lose this link.`
    : `${p.name} will be removed from the website.`,
});

export function ProjectChips({ project }) {
  return (
    <>
      <Pill option={findOption(PROJECT_STATUSES, project.status)} />
      <Pill option={findOption(VISIBILITY, project.is_published ? "published" : "draft")} />
      {project.is_featured && <Pill option={{ label: "Featured", bg: "#FFF4CC", fg: "#7A5A00" }} icon={<StarRounded />} />}
    </>
  );
}

// Feature and publish toggles shown next to Edit while previewing
export function ProjectQuickActions({ project, saving, patch }) {
  return (
    <>
      <Button
        variant="outlined"
        disabled={saving}
        onClick={() =>
          patch({ is_featured: !project.is_featured }, project.is_featured ? "Removed from featured" : "Marked as featured")
        }
        startIcon={project.is_featured ? <StarRounded sx={{ color: "#E0A100" }} /> : <StarBorderRounded />}
        sx={quickButtonSx}
      >
        {project.is_featured ? "Unfeature" : "Feature"}
      </Button>
      <Button
        variant="outlined"
        disabled={saving}
        onClick={() =>
          patch({ is_published: !project.is_published }, project.is_published ? "Project hidden" : "Project published")
        }
        startIcon={project.is_published ? <PublicOffRounded /> : <PublicRounded />}
        sx={quickButtonSx}
      >
        {project.is_published ? "Hide" : "Publish"}
      </Button>
    </>
  );
}

export function ProjectForm({ form, setField, services, page = false }) {
  const [tab, setTab] = useState("basics");
  const serviceOptions = [
    { value: "", label: "Not linked" },
    ...services.map((s) => ({ value: s.id, label: s.status === "draft" ? `${s.name} (draft)` : s.name })),
  ];

  return (
    <>
      <FormTabs tabs={TABS} value={tab} onChange={setTab} page={page} />

      {tab === "basics" && (
        <>
          <Section title="Project">
            <FieldGrid>
              <Field label="Project name" value={form.name} onChange={setField("name")} max={200} required span />
              <Field
                label="Service"
                value={form.service_id}
                onChange={setField("service_id")}
                select
                options={serviceOptions}
                helper="Linked testimonials follow this service"
              />
              <Field
                label="Client"
                value={form.client}
                onChange={setField("client")}
                max={160}
                placeholder="e.g. Green Valley School"
              />
              <Field label="Status" value={form.status} onChange={setField("status")} select options={PROJECT_STATUSES} />
              <Field
                label="Year"
                type="number"
                value={form.year}
                onChange={setField("year")}
                slotProps={{ htmlInput: { min: 1990, max: new Date().getFullYear() + 1 } }}
              />
              <Field
                label="Location"
                value={form.location}
                onChange={setField("location")}
                max={160}
                placeholder="e.g. Karen, Nairobi"
              />
              <Autocomplete
                freeSolo
                options={KENYA_COUNTIES}
                value={form.county || ""}
                onChange={(_, value) => setField("county")(value || "")}
                onInputChange={(_, value, reason) => reason === "input" && setField("county")(value)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="County"
                    size="small"
                    sx={fieldSx}
                    helperText="Used for the county filter on the website"
                  />
                )}
              />
              <Field
                label="Scale"
                value={form.size}
                onChange={setField("size")}
                max={120}
                placeholder="e.g. 2 greenhouses, 480 m²"
              />
              <Field label="Duration" value={form.duration} onChange={setField("duration")} max={80} placeholder="e.g. 6 weeks" />
              <Field
                label="Summary"
                value={form.summary}
                onChange={setField("summary")}
                max={500}
                multiline
                rows={3}
                span
                helper={`Shown on project cards · ${form.summary.length}/500`}
              />
            </FieldGrid>
          </Section>
          <Section title="Visibility">
            <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" } }}>
              <SwitchRow
                label="Published"
                description="Show on the Projects page"
                checked={form.is_published}
                onChange={setField("is_published")}
              />
              <SwitchRow
                label="Featured"
                description="Highlight on the home page"
                checked={form.is_featured}
                onChange={setField("is_featured")}
              />
            </Box>
            <Box sx={{ mt: 2, maxWidth: { sm: "50%" } }}>
              <Field
                label="URL slug"
                value={form.slug}
                onChange={setField("slug")}
                placeholder="auto from name"
                helper="Leave empty to generate from the name"
              />
            </Box>
          </Section>
        </>
      )}

      {tab === "story" && (
        <>
          <Section title="Case study">
            <FieldGrid>
              <Field
                label="The challenge"
                value={form.challenge}
                onChange={setField("challenge")}
                max={10000}
                multiline
                rows={5}
                span
              />
              <Field
                label="Our solution"
                value={form.solution}
                onChange={setField("solution")}
                max={10000}
                multiline
                rows={5}
                span
              />
            </FieldGrid>
          </Section>
          <Section title="Scope of work">
            <StringListField
              label="Scope item"
              value={form.scope}
              onChange={setField("scope")}
              max={20}
              placeholder="e.g. Drip irrigation layout"
            />
          </Section>
          <Section title="Results" hint="Up to 6 headline numbers, e.g. “3×” — “higher yield”.">
            <RepeaterField
              value={form.results}
              onChange={setField("results")}
              max={6}
              newItem={{ value: "", label: "" }}
              itemTitle={(r) => [r.value, r.label].filter(Boolean).join(" ")}
              addLabel="Add result"
              fields={[
                { key: "value", label: "Value", max: 20, placeholder: "e.g. 60%" },
                { key: "label", label: "Label", max: 120, placeholder: "e.g. less water used" },
              ]}
            />
          </Section>
        </>
      )}

      {tab === "media" && (
        <>
          <Section title="Cover photo">
            <Box sx={{ maxWidth: 420 }}>
              <ImageField
                label="Cover"
                value={form.cover_image}
                onChange={setField("cover_image")}
                folder="projects"
                helper="Used on cards and as the page header."
              />
            </Box>
          </Section>
          <Section title="Before & after" hint="Optional pair shown side by side on the project page.">
            <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" } }}>
              <ImageField
                label="Before"
                value={form.before_image}
                onChange={setField("before_image")}
                folder="projects"
                aspect="4 / 3"
              />
              <ImageField
                label="After"
                value={form.after_image}
                onChange={setField("after_image")}
                folder="projects"
                aspect="4 / 3"
              />
            </Box>
          </Section>
          <Section title="Gallery" hint="Up to 24 photos. Captions are optional; use the arrows to reorder.">
            <GalleryField value={form.gallery} onChange={setField("gallery")} folder="projects" max={24} />
          </Section>
        </>
      )}

      {tab === "seo" && (
        <Section title="Search engines" hint="Optional. The project name and summary are used when these are empty.">
          <FieldGrid>
            <Field
              label="SEO title"
              value={form.seo_title}
              onChange={setField("seo_title")}
              max={70}
              span
              helper={`${form.seo_title.length}/70`}
            />
            <Field
              label="SEO description"
              value={form.seo_description}
              onChange={setField("seo_description")}
              max={170}
              multiline
              rows={2}
              span
              helper={`${form.seo_description.length}/170`}
            />
            <Field
              label="Display position"
              type="number"
              value={form.sort_order}
              onChange={setField("sort_order")}
              helper="Lower numbers show first; empty puts it last"
            />
          </FieldGrid>
        </Section>
      )}
    </>
  );
}
