import React, { useState } from "react";
import { Alert, Box, Chip, Typography } from "@mui/material";
import {
  AccessTimeRounded,
  CategoryRounded,
  FormatListNumberedRounded,
  PersonRounded,
  QueryStatsRounded,
  RateReviewRounded,
  WorkRounded,
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
  TagList,
} from "./FormKit";
import { Thumb } from "./ListKit";
import {
  BENEFIT_ICONS,
  GREEN,
  PACKAGE_UNITS,
  SERVICE_ICONS,
  SERVICE_STATUSES,
  findOption,
  formatDate,
  labelOf,
} from "./constants";

const EMPTY = {
  name: "",
  slug: "",
  short_name: "",
  icon: "generic",
  status: "active",
  sort_order: "",
  tagline: "",
  short_description: "",
  description: "",
  image: "",
  gallery: [],
  offerings: [],
  ideal_for: [],
  timeline: "",
  stat_value: "",
  stat_label: "",
  benefits: [],
  process_steps: [],
  packages: [],
  faqs: [],
  seo_title: "",
  seo_description: "",
};

export const toForm = (service) => {
  if (!service) return { ...EMPTY };
  const form = {};
  Object.keys(EMPTY).forEach((key) => {
    const value = service[key];
    form[key] = value === null || value === undefined ? EMPTY[key] : value;
  });
  form.sort_order = service.sort_order ?? "";
  form.gallery = (service.gallery || []).map((url) => ({ url, caption: "" }));
  form.packages = (service.packages || []).map((p) => ({ ...p, price: p.price ?? "", features: p.features || [] }));
  return form;
};

export const toPayload = (form) => ({
  ...form,
  sort_order: form.sort_order === "" ? null : form.sort_order,
  gallery: form.gallery.map((g) => g.url),
  packages: form.packages.map((p) => ({ ...p, price: p.price === "" ? null : p.price })),
});

export const formatPrice = (pkg) => {
  if (pkg.unit === "custom" || pkg.price === null || pkg.price === "") return "Custom quote";
  const amount = `KSh ${Number(pkg.price).toLocaleString("en-KE")}`;
  if (pkg.unit === "per month") return `${amount} / month`;
  return `From ${amount}`;
};

const TABS = [
  { value: "basics", label: "Basics" },
  { value: "media", label: "Images" },
  { value: "details", label: "Highlights" },
  { value: "benefits", label: "Benefits & process" },
  { value: "pricing", label: "Packages" },
  { value: "faqs", label: "FAQs" },
  { value: "seo", label: "SEO" },
];

export function ServicePreview({ service }) {
  const status = findOption(SERVICE_STATUSES, service.status);
  return (
    <>
      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "240px minmax(0, 1fr)" }, mb: 2 }}>
        <Thumb src={service.image} alt={service.name} size="100%" radius="18px" sx={{ aspectRatio: "4 / 3", height: "auto" }} />
        <Section title="At a glance" sx={{ mb: 0 }}>
          <InfoGrid>
            <InfoRow icon={CategoryRounded} label="Illustration" value={labelOf(SERVICE_ICONS, service.icon)} />
            <InfoRow icon={AccessTimeRounded} label="Typical timeline" value={service.timeline} />
            <InfoRow
              icon={QueryStatsRounded}
              label="Headline stat"
              value={service.stat_value && `${service.stat_value} ${service.stat_label || ""}`}
            />
            <InfoRow icon={FormatListNumberedRounded} label="Display position" value={service.sort_order} />
            <InfoRow icon={WorkRounded} label="Projects" value={String(service.project_count ?? 0)} />
            <InfoRow icon={RateReviewRounded} label="Testimonials" value={String(service.testimonial_count ?? 0)} />
          </InfoGrid>
        </Section>
      </Box>

      {status.value === "draft" && (
        <Alert severity="info" sx={{ mb: 2, borderRadius: "12px" }}>
          This service is a draft and is hidden from the public website.
        </Alert>
      )}

      <Section title="Overview">
        {service.tagline && (
          <Typography sx={{ fontWeight: 700, color: GREEN.deep, fontSize: "1.05rem", mb: 1 }}>{service.tagline}</Typography>
        )}
        {service.short_description && (
          <Typography sx={{ color: "text.secondary", fontSize: "0.9rem", mb: 1.5 }}>{service.short_description}</Typography>
        )}
        <Paragraph empty="No description yet">{service.description}</Paragraph>
      </Section>

      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" } }}>
        <Section title="What's included" sx={{ mb: { xs: 0, md: 2 } }}>
          <TagList items={service.offerings} />
        </Section>
        <Section title="Ideal for">
          <TagList items={service.ideal_for} />
        </Section>
      </Box>

      {service.benefits?.length > 0 && (
        <Section title="Benefits">
          <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" } }}>
            {service.benefits.map((b, i) => (
              <Box key={i} sx={{ p: 1.5, borderRadius: "14px", bgcolor: "#F6FAF7", border: "1px solid rgba(45,106,79,0.1)" }}>
                <Chip
                  label={labelOf(BENEFIT_ICONS, b.icon)}
                  size="small"
                  sx={{ mb: 0.75, height: 20, fontSize: "0.68rem", bgcolor: GREEN.mist, color: GREEN.deep, fontWeight: 700 }}
                />
                <Typography sx={{ fontWeight: 700, color: GREEN.ink, fontSize: "0.9rem" }}>{b.title}</Typography>
                <Typography sx={{ color: "text.secondary", fontSize: "0.82rem" }}>{b.text}</Typography>
              </Box>
            ))}
          </Box>
        </Section>
      )}

      {service.process_steps?.length > 0 && (
        <Section title="How it works">
          <Box sx={{ display: "grid", gap: 1.5 }}>
            {service.process_steps.map((s, i) => (
              <Box key={i} sx={{ display: "flex", gap: 1.5 }}>
                <Box
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    bgcolor: GREEN.main,
                    color: "#fff",
                    display: "grid",
                    placeItems: "center",
                    fontWeight: 800,
                    fontSize: "0.8rem",
                    flexShrink: 0,
                  }}
                >
                  {i + 1}
                </Box>
                <Box>
                  <Typography sx={{ fontWeight: 700, color: GREEN.ink, fontSize: "0.9rem" }}>{s.title}</Typography>
                  <Typography sx={{ color: "text.secondary", fontSize: "0.82rem" }}>{s.text}</Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Section>
      )}

      {service.packages?.length > 0 && (
        <Section title="Packages">
          <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", sm: "repeat(auto-fit, minmax(190px, 1fr))" } }}>
            {service.packages.map((p, i) => (
              <Box
                key={i}
                sx={{
                  p: 1.75,
                  borderRadius: "16px",
                  border: "1.5px solid",
                  borderColor: p.popular ? GREEN.mid : "rgba(45,106,79,0.14)",
                  bgcolor: p.popular ? "#F1F9F3" : "#fff",
                  position: "relative",
                }}
              >
                {p.popular && (
                  <Chip
                    label="Most popular"
                    size="small"
                    sx={{
                      position: "absolute",
                      top: -11,
                      right: 12,
                      height: 22,
                      bgcolor: GREEN.main,
                      color: "#fff",
                      fontWeight: 700,
                      fontSize: "0.68rem",
                    }}
                  />
                )}
                <Typography sx={{ fontWeight: 700, color: GREEN.ink }}>{p.name}</Typography>
                <Typography sx={{ fontWeight: 800, color: GREEN.deep, fontSize: "1.05rem", my: 0.5 }}>
                  {formatPrice(p)}
                </Typography>
                <Box component="ul" sx={{ m: 0, pl: 2.25, color: "text.secondary", fontSize: "0.82rem" }}>
                  {(p.features || []).map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </Box>
              </Box>
            ))}
          </Box>
        </Section>
      )}

      {service.faqs?.length > 0 && (
        <Section title={`FAQs (${service.faqs.length})`}>
          <Box sx={{ display: "grid", gap: 1.5 }}>
            {service.faqs.map((f, i) => (
              <Box key={i} sx={{ pb: 1.5, borderBottom: i < service.faqs.length - 1 ? "1px dashed rgba(45,106,79,0.15)" : 0 }}>
                <Typography sx={{ fontWeight: 700, color: GREEN.ink, fontSize: "0.9rem" }}>{f.question}</Typography>
                <Typography sx={{ color: "text.secondary", fontSize: "0.85rem", mt: 0.25 }}>{f.answer}</Typography>
              </Box>
            ))}
          </Box>
        </Section>
      )}

      {service.gallery?.length > 0 && (
        <Section title="Gallery">
          <Box sx={{ display: "grid", gap: 1, gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))" }}>
            {service.gallery.map((url) => (
              <Thumb key={url} src={url} size="100%" sx={{ aspectRatio: "1", height: "auto" }} />
            ))}
          </Box>
        </Section>
      )}

      <Section title="Record">
        <InfoGrid>
          <InfoRow
            icon={PersonRounded}
            label="Created"
            value={`${formatDate(service.createdAt)}${service.creator ? ` by ${service.creator.name}` : ""}`}
          />
          <InfoRow
            icon={PersonRounded}
            label="Last updated"
            value={`${formatDate(service.updatedAt)}${service.updater ? ` by ${service.updater.name}` : ""}`}
          />
        </InfoGrid>
      </Section>
    </>
  );
}

function SeoPreview({ title, description, slug }) {
  return (
    <Box sx={{ p: 2, borderRadius: "14px", bgcolor: "#fff", border: "1px solid rgba(0,0,0,0.08)" }}>
      <Typography sx={{ fontSize: "0.75rem", color: "#4D5156" }}>mcaludoh.co.ke › services › {slug || "new-service"}</Typography>
      <Typography sx={{ fontSize: "1.05rem", color: "#1A0DAB", fontWeight: 500, lineHeight: 1.3, my: 0.25 }}>
        {title || "Service title"}
      </Typography>
      <Typography sx={{ fontSize: "0.82rem", color: "#4D5156" }}>
        {description || "The search engine description will appear here."}
      </Typography>
    </Box>
  );
}

export const serviceDeletePrompt = (s) => ({
  title: "Delete this service?",
  text:
    s.project_count || s.testimonial_count
      ? `${s.name} will be removed from the website. Its ${s.project_count} project(s) and ${s.testimonial_count} testimonial(s) will stay but lose this link.`
      : `${s.name} will be removed from the website.`,
});

export function ServiceForm({ form, setField, record, page = false }) {
  const [tab, setTab] = useState("basics");

  return (
    <>
      <FormTabs tabs={TABS} value={tab} onChange={setTab} page={page} />

      {tab === "basics" && (
        <>
          <Section title="Identity">
            <FieldGrid>
              <Field label="Service name" value={form.name} onChange={setField("name")} max={150} required span />
              <Field
                label="Short name"
                value={form.short_name}
                onChange={setField("short_name")}
                max={40}
                helper="Used on small cards, e.g. “Hydroponics”"
              />
              <Field
                label="URL slug"
                value={form.slug}
                onChange={setField("slug")}
                placeholder="auto from name"
                helper="Leave empty to generate from the name"
              />
              <Field label="Illustration" value={form.icon} onChange={setField("icon")} select options={SERVICE_ICONS} />
              <Field
                label="Status"
                value={form.status}
                onChange={setField("status")}
                select
                options={SERVICE_STATUSES}
                helper="Drafts are hidden from the website"
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
          <Section title="Descriptions">
            <FieldGrid>
              <Field label="Tagline" value={form.tagline} onChange={setField("tagline")} max={200} span />
              <Field
                label="Short description"
                value={form.short_description}
                onChange={setField("short_description")}
                max={300}
                multiline
                rows={2}
                span
                helper="Shown on service cards"
              />
              <Field
                label="Full description"
                value={form.description}
                onChange={setField("description")}
                max={10000}
                multiline
                rows={6}
                span
              />
            </FieldGrid>
          </Section>
        </>
      )}

      {tab === "media" && (
        <>
          <Section title="Main image">
            <Box sx={{ maxWidth: 420 }}>
              <ImageField
                label="Cover photo"
                value={form.image}
                onChange={setField("image")}
                folder="services"
                helper="Landscape photos around 1600×1000 work best."
              />
            </Box>
          </Section>
          <Section title="Gallery" hint="Extra photos shown on the service page. Use the arrows to reorder.">
            <GalleryField value={form.gallery} onChange={setField("gallery")} folder="services" max={12} captions={false} />
          </Section>
        </>
      )}

      {tab === "details" && (
        <>
          <Section title="Key facts">
            <FieldGrid columns={3}>
              <Field
                label="Typical timeline"
                value={form.timeline}
                onChange={setField("timeline")}
                max={80}
                placeholder="e.g. 2–4 weeks"
              />
              <Field
                label="Stat value"
                value={form.stat_value}
                onChange={setField("stat_value")}
                max={20}
                placeholder="e.g. 90%"
              />
              <Field
                label="Stat label"
                value={form.stat_label}
                onChange={setField("stat_label")}
                max={160}
                placeholder="e.g. less water used"
              />
            </FieldGrid>
          </Section>
          <Section title="What's included">
            <StringListField
              label="Offering"
              value={form.offerings}
              onChange={setField("offerings")}
              max={30}
              placeholder="e.g. Site survey and design"
            />
          </Section>
          <Section title="Ideal for">
            <StringListField
              label="Audience"
              value={form.ideal_for}
              onChange={setField("ideal_for")}
              max={12}
              placeholder="e.g. Schools"
            />
          </Section>
        </>
      )}

      {tab === "benefits" && (
        <>
          <Section title="Benefits" hint="Up to 6 short selling points with an icon.">
            <RepeaterField
              value={form.benefits}
              onChange={setField("benefits")}
              max={6}
              newItem={{ icon: "leaf", title: "", text: "" }}
              itemTitle={(b) => b.title}
              addLabel="Add benefit"
              fields={[
                { key: "title", label: "Title", max: 80 },
                { key: "icon", label: "Icon", type: "select", options: BENEFIT_ICONS },
                { key: "text", label: "Description", type: "multiline", max: 300 },
              ]}
            />
          </Section>
          <Section title="Process steps" hint="How the work is delivered, in order.">
            <RepeaterField
              value={form.process_steps}
              onChange={setField("process_steps")}
              max={8}
              newItem={{ title: "", text: "" }}
              itemTitle={(s) => s.title}
              addLabel="Add step"
              fields={[
                { key: "title", label: "Step title", max: 80, span: true },
                { key: "text", label: "Description", type: "multiline", max: 300 },
              ]}
            />
          </Section>
        </>
      )}

      {tab === "pricing" && (
        <Section title="Packages" hint="Up to 6 price tiers. “Custom quote” packages don't show a price.">
          <RepeaterField
            value={form.packages}
            onChange={setField("packages")}
            max={6}
            newItem={{ name: "", price: "", unit: "from", popular: false, features: [] }}
            itemTitle={(p) => (p.name ? `${p.name} · ${formatPrice(p)}` : "")}
            addLabel="Add package"
            fields={[
              { key: "name", label: "Package name", max: 60, span: true },
              { key: "unit", label: "Pricing", type: "select", options: PACKAGE_UNITS },
              { key: "price", label: "Price (KSh)", placeholder: "e.g. 45000" },
              { key: "popular", label: "Highlight as most popular", type: "switch", span: true },
              { key: "features", label: "Feature", type: "tags", maxItems: 12, placeholder: "e.g. Free site visit" },
            ]}
          />
        </Section>
      )}

      {tab === "faqs" && (
        <Section title="Frequently asked questions">
          <RepeaterField
            value={form.faqs}
            onChange={setField("faqs")}
            max={20}
            newItem={{ question: "", answer: "" }}
            itemTitle={(f) => f.question}
            addLabel="Add question"
            fields={[
              { key: "question", label: "Question", max: 200, span: true },
              { key: "answer", label: "Answer", type: "multiline", max: 1000 },
            ]}
          />
        </Section>
      )}

      {tab === "seo" && (
        <Section title="Search engines" hint="Optional. The name and short description are used when these are empty.">
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
            <Box className="span-all">
              <SeoPreview
                title={form.seo_title || form.name}
                description={form.seo_description || form.short_description}
                slug={form.slug || record?.slug}
              />
            </Box>
          </FieldGrid>
        </Section>
      )}
    </>
  );
}
