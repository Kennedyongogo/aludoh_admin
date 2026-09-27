import React, { useState } from "react";
import { Alert, Autocomplete, Box, Button, TextField, Typography } from "@mui/material";
import {
  CalendarMonthRounded,
  CategoryRounded,
  PersonRounded,
  PublicOffRounded,
  PublicRounded,
  StarBorderRounded,
  StarRounded,
} from "@mui/icons-material";
import { Field, FieldGrid, FormTabs, ImageField, InfoGrid, InfoRow, Paragraph, Section, SwitchRow, fieldSx } from "./FormKit";
import { Pill, Thumb } from "./ListKit";
import { ARTICLE_STATUSES, GREEN, articleState, findOption, formatDate } from "./constants";

const EMPTY = {
  title: "",
  slug: "",
  category: "",
  excerpt: "",
  content: "",
  featured_image: "",
  author_name: "",
  author_role: "",
  is_featured: false,
  status: "draft",
  published_at: "",
  seo_title: "",
  seo_description: "",
};

const pad = (n) => String(n).padStart(2, "0");

// <input type="datetime-local"> works in local time without a timezone
const toLocalInput = (value) => {
  if (!value) return "";
  const d = new Date(value);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const toForm = (article) => {
  if (!article) return { ...EMPTY };
  const form = {};
  Object.keys(EMPTY).forEach((key) => {
    const value = article[key];
    form[key] = value === null || value === undefined ? EMPTY[key] : value;
  });
  form.published_at = toLocalInput(article.published_at);
  return form;
};

export const toPayload = (form) => ({
  ...form,
  published_at: form.published_at ? new Date(form.published_at).toISOString() : null,
});

export const articleDeletePrompt = (a) => ({
  title: "Delete this article?",
  text: `“${a.title}” will be removed from the Knowledge Center.`,
});

export const readingMinutes = (text = "") => Math.max(1, Math.round(String(text).split(/\s+/).filter(Boolean).length / 200));

// Mirrors the website: "## " starts a heading, "- " a bullet, blank lines split paragraphs
export function ArticleBody({ content }) {
  if (!content?.trim()) return <Paragraph empty="No article text yet" />;
  const blocks = [];
  let bullets = [];
  const flush = () => {
    if (bullets.length) blocks.push({ type: "list", items: bullets });
    bullets = [];
  };
  content.split("\n").forEach((raw) => {
    const line = raw.trim();
    if (line.startsWith("- ")) return bullets.push(line.slice(2));
    flush();
    if (!line) return undefined;
    if (line.startsWith("## ")) return blocks.push({ type: "heading", text: line.slice(3) });
    return blocks.push({ type: "text", text: line });
  });
  flush();

  return (
    <Box sx={{ color: GREEN.ink, "& p": { m: 0, mb: 1.5, lineHeight: 1.75, fontSize: "0.95rem" } }}>
      {blocks.map((b, i) => {
        if (b.type === "heading") {
          return (
            <Typography key={i} component="h3" sx={{ fontWeight: 800, fontSize: "1.1rem", color: GREEN.deep, mt: i ? 2.5 : 0, mb: 1 }}>
              {b.text}
            </Typography>
          );
        }
        if (b.type === "list") {
          return (
            <Box key={i} component="ul" sx={{ pl: 2.5, mt: 0, mb: 1.5, "& li": { mb: 0.5, lineHeight: 1.65, fontSize: "0.95rem" } }}>
              {b.items.map((item, j) => (
                <li key={j}>{item}</li>
              ))}
            </Box>
          );
        }
        return <p key={i}>{b.text}</p>;
      })}
    </Box>
  );
}

export function ArticleStatusPill({ article }) {
  return <Pill option={findOption(ARTICLE_STATUSES, articleState(article))} />;
}

export function ArticleChips({ article }) {
  return (
    <>
      <ArticleStatusPill article={article} />
      {article.category && <Pill option={{ label: article.category, bg: "rgba(255,255,255,0.18)", fg: "#fff" }} />}
      {article.is_featured && <Pill option={{ label: "Featured", bg: "#FFF4CC", fg: "#7A5A00" }} icon={<StarRounded />} />}
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

export function ArticleQuickActions({ article, saving, patch }) {
  const published = article.status === "published";
  return (
    <>
      <Button
        variant="outlined"
        disabled={saving}
        onClick={() => patch({ is_featured: !article.is_featured }, article.is_featured ? "Removed from featured" : "Marked as featured")}
        startIcon={article.is_featured ? <StarRounded sx={{ color: "#E0A100" }} /> : <StarBorderRounded />}
        sx={quickButtonSx}
      >
        {article.is_featured ? "Unfeature" : "Feature"}
      </Button>
      <Button
        variant="outlined"
        disabled={saving}
        onClick={() => patch({ status: published ? "draft" : "published" }, published ? "Moved back to drafts" : "Article published")}
        startIcon={published ? <PublicOffRounded /> : <PublicRounded />}
        sx={quickButtonSx}
      >
        {published ? "Unpublish" : "Publish"}
      </Button>
    </>
  );
}

export function ArticlePreview({ article }) {
  const state = articleState(article);
  return (
    <>
      {state === "draft" && (
        <Alert severity="info" sx={{ mb: 2, borderRadius: "12px" }}>
          Draft: only admins can see this article.
        </Alert>
      )}
      {state === "scheduled" && (
        <Alert severity="info" sx={{ mb: 2, borderRadius: "12px" }}>
          Scheduled: it goes live on the website on {formatDate(article.published_at)}.
        </Alert>
      )}

      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "260px minmax(0, 1fr)" }, mb: 2 }}>
        <Thumb src={article.featured_image} alt={article.title} size="100%" radius="18px" sx={{ aspectRatio: "16 / 10", height: "auto" }} />
        <Section title="Details" sx={{ mb: 0 }}>
          <InfoGrid>
            <InfoRow icon={CategoryRounded} label="Category" value={article.category || "Uncategorised"} />
            <InfoRow
              icon={PersonRounded}
              label="Author"
              value={[article.author_name, article.author_role].filter(Boolean).join(" · ") || "Not set"}
            />
            <InfoRow
              icon={CalendarMonthRounded}
              label={state === "scheduled" ? "Goes live" : "Published"}
              value={article.published_at ? formatDate(article.published_at) : "Not yet"}
            />
            <InfoRow icon={CalendarMonthRounded} label="Reading time" value={`About ${readingMinutes(article.content)} min`} />
          </InfoGrid>
        </Section>
      </Box>

      <Section title="Summary">
        <Paragraph empty="No summary yet. The website shows the first lines of the article instead.">{article.excerpt}</Paragraph>
      </Section>

      <Section title="Article">
        <ArticleBody content={article.content} />
      </Section>

      <Section title="Record">
        <InfoGrid>
          <InfoRow
            icon={PersonRounded}
            label="Created"
            value={`${formatDate(article.createdAt)}${article.creator ? ` by ${article.creator.name}` : ""}`}
          />
          <InfoRow
            icon={PersonRounded}
            label="Last updated"
            value={`${formatDate(article.updatedAt)}${article.updater ? ` by ${article.updater.name}` : ""}`}
          />
        </InfoGrid>
      </Section>
    </>
  );
}

const TABS = [
  { value: "basics", label: "Basics" },
  { value: "content", label: "Article text" },
  { value: "publishing", label: "Publishing" },
  { value: "seo", label: "SEO" },
];

const EDITABLE_STATUSES = ARTICLE_STATUSES.filter((s) => s.value !== "scheduled");

export function ArticleForm({ form, setField, categories = [] }) {
  const [tab, setTab] = useState("basics");
  const scheduled = form.status === "published" && form.published_at && new Date(form.published_at) > new Date();

  return (
    <>
      <FormTabs tabs={TABS} value={tab} onChange={setTab} page />

      {tab === "basics" && (
        <Box sx={{ display: "grid", gap: { md: 2 }, gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1.5fr) minmax(0, 1fr)" }, alignItems: "start" }}>
          <Section title="Article">
            <FieldGrid>
              <Field label="Title" value={form.title} onChange={setField("title")} max={200} required span />
              <Autocomplete
                freeSolo
                options={categories}
                value={form.category || ""}
                onChange={(_, value) => setField("category")(value || "")}
                onInputChange={(_, value, reason) => reason === "input" && setField("category")(value)}
                renderInput={(params) => (
                  <TextField {...params} label="Category" size="small" sx={fieldSx} helperText="Pick one or type a new category" />
                )}
              />
              <Box />
              <Field label="Author" value={form.author_name} onChange={setField("author_name")} max={120} placeholder="e.g. Vincent Aludoh" />
              <Field label="Author role" value={form.author_role} onChange={setField("author_role")} max={120} placeholder="e.g. Lead agronomist" />
              <Field
                label="Summary"
                value={form.excerpt}
                onChange={setField("excerpt")}
                max={400}
                multiline
                rows={3}
                span
                helper={`Shown on article cards · ${form.excerpt.length}/400`}
              />
            </FieldGrid>
          </Section>
          <Section title="Cover image">
            <ImageField label="Cover" value={form.featured_image} onChange={setField("featured_image")} folder="articles" helper="Used on cards and at the top of the article." />
          </Section>
        </Box>
      )}

      {tab === "content" && (
        <Box sx={{ display: "grid", gap: { lg: 2 }, gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1fr) minmax(0, 1fr)" }, alignItems: "start" }}>
          <Section title="Write" hint="Start a line with “## ” for a heading and “- ” for a bullet point. Leave a blank line between paragraphs.">
            <Field
              label="Article text"
              value={form.content}
              onChange={setField("content")}
              max={100000}
              multiline
              rows={18}
              helper={`${form.content.split(/\s+/).filter(Boolean).length} words · about ${readingMinutes(form.content)} min read`}
            />
          </Section>
          <Section title="Preview">
            <ArticleBody content={form.content} />
          </Section>
        </Box>
      )}

      {tab === "publishing" && (
        <Section title="Publishing">
          <FieldGrid>
            <Field label="Status" value={form.status} onChange={setField("status")} select options={EDITABLE_STATUSES} />
            <Field
              label="Publish date"
              type="datetime-local"
              value={form.published_at}
              onChange={setField("published_at")}
              slotProps={{ inputLabel: { shrink: true } }}
              helper={
                scheduled
                  ? "In the future: the article goes live automatically on this date"
                  : "Leave empty to use the moment you publish"
              }
            />
            <Box className="span-all">
              <SwitchRow
                label="Featured"
                description="Pinned at the top of the Knowledge Center"
                checked={form.is_featured}
                onChange={setField("is_featured")}
              />
            </Box>
            <Field label="URL slug" value={form.slug} onChange={setField("slug")} max={160} placeholder="auto from title" helper="Leave empty to generate from the title" />
          </FieldGrid>
        </Section>
      )}

      {tab === "seo" && (
        <Section title="Search engines" hint="Optional. The title and summary are used when these are empty.">
          <FieldGrid>
            <Field label="SEO title" value={form.seo_title} onChange={setField("seo_title")} max={70} span helper={`${form.seo_title.length}/70`} />
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
          </FieldGrid>
        </Section>
      )}
    </>
  );
}
