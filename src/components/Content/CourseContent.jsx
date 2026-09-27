import React, { useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { Alert, Autocomplete, Box, Button, IconButton, LinearProgress, TextField, Tooltip, Typography } from "@mui/material";
import {
  AccessTimeRounded,
  AddRounded,
  CategoryRounded,
  DeleteOutlineRounded,
  EventSeatRounded,
  LaptopRounded,
  PaymentsRounded,
  PersonRounded,
  PlaceRounded,
  PublicOffRounded,
  PublicRounded,
  SchoolRounded,
  StarBorderRounded,
  StarRounded,
  TrendingUpRounded,
  WorkspacePremiumRounded,
} from "@mui/icons-material";
import { adminRequest } from "../../utils/adminApi";
import {
  Field,
  FieldGrid,
  FormTabs,
  ImageField,
  InfoGrid,
  InfoRow,
  Paragraph,
  Section,
  StringListField,
  SwitchRow,
  fieldSx,
} from "./FormKit";
import { Pill, Thumb } from "./ListKit";
import { confirmAction, toastError, toastSuccess } from "./feedback";
import {
  COURSE_LEVELS,
  COURSE_MODES,
  GREEN,
  SESSION_STATUSES,
  VISIBILITY,
  findOption,
  formatDate,
  formatDayRange,
  formatKES,
  todayISO,
} from "./constants";

const MAX_SESSIONS = 30;

const EMPTY = {
  name: "",
  slug: "",
  category: "",
  level: "Beginner",
  short_description: "",
  description: "",
  image: "",
  duration: "",
  mode: "Physical",
  location: "",
  fee: "",
  outcomes: [],
  audience: "",
  is_featured: false,
  is_published: true,
  sort_order: "",
  seo_title: "",
  seo_description: "",
  sessions: [],
};

const toSessionForm = (s) => ({
  id: s.id,
  start_date: s.start_date || "",
  end_date: s.end_date && s.end_date !== s.start_date ? s.end_date : "",
  location: s.location || "",
  fee: s.fee ?? "",
  capacity: s.capacity ?? 20,
  status: s.status || "scheduled",
  seats_taken: s.seats_taken || 0,
});

export const toForm = (course) => {
  if (!course) return { ...EMPTY, sessions: [] };
  const form = {};
  Object.keys(EMPTY).forEach((key) => {
    const value = course[key];
    form[key] = value === null || value === undefined ? EMPTY[key] : value;
  });
  form.fee = course.fee ?? "";
  form.sort_order = course.sort_order ?? "";
  form.sessions = (course.sessions || []).map(toSessionForm);
  return form;
};

const blankToNull = (value) => (value === "" || value === undefined ? null : value);

export const toPayload = (form) => ({
  ...form,
  fee: blankToNull(form.fee),
  sort_order: blankToNull(form.sort_order),
  level: form.level || null,
  mode: form.mode || null,
  sessions: form.sessions.map((s) => ({
    ...(s.id && { id: s.id }),
    start_date: s.start_date,
    end_date: s.end_date || s.start_date,
    location: s.location,
    fee: blankToNull(s.fee),
    capacity: s.capacity === "" ? null : s.capacity,
    status: s.status,
  })),
});

export const courseDeletePrompt = (c) => ({
  title: "Delete this course?",
  text: `${c.name} and its dates will be removed from the website. Past bookings and certificates keep the course name.`,
});

export const upcomingSessions = (course) =>
  (course.sessions || []).filter((s) => s.status === "scheduled" && s.start_date >= todayISO());

export function CourseChips({ course }) {
  return (
    <>
      <Pill option={findOption(VISIBILITY, course.is_published ? "published" : "draft")} />
      {course.level && <Pill option={{ label: course.level, bg: "rgba(255,255,255,0.18)", fg: "#fff" }} />}
      {course.is_featured && <Pill option={{ label: "Featured", bg: "#FFF4CC", fg: "#7A5A00" }} icon={<StarRounded />} />}
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

export function CourseQuickActions({ course, saving, patch }) {
  return (
    <>
      <Button
        variant="outlined"
        disabled={saving}
        onClick={() => patch({ is_featured: !course.is_featured }, course.is_featured ? "Removed from featured" : "Marked as featured")}
        startIcon={course.is_featured ? <StarRounded sx={{ color: "#E0A100" }} /> : <StarBorderRounded />}
        sx={quickButtonSx}
      >
        {course.is_featured ? "Unfeature" : "Feature"}
      </Button>
      <Button
        variant="outlined"
        disabled={saving}
        onClick={() => patch({ is_published: !course.is_published }, course.is_published ? "Course hidden" : "Course published")}
        startIcon={course.is_published ? <PublicOffRounded /> : <PublicRounded />}
        sx={quickButtonSx}
      >
        {course.is_published ? "Hide" : "Publish"}
      </Button>
    </>
  );
}

function SeatsBar({ taken, capacity }) {
  const ratio = capacity ? Math.min(100, (taken / capacity) * 100) : 0;
  const full = capacity && taken >= capacity;
  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
        <Typography sx={{ fontSize: "0.78rem", color: "text.secondary" }}>
          {taken} of {capacity} seats booked
        </Typography>
        <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: full ? "#B42318" : GREEN.main }}>
          {full ? "Full" : `${capacity - taken} left`}
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={ratio}
        sx={{
          height: 6,
          borderRadius: 3,
          bgcolor: GREEN.mist,
          "& .MuiLinearProgress-bar": { bgcolor: full ? "#B42318" : GREEN.mid, borderRadius: 3 },
        }}
      />
    </Box>
  );
}

function SessionCard({ session, course }) {
  const [issuing, setIssuing] = useState(false);
  const today = todayISO();
  const past = (session.end_date || session.start_date) < today;
  const started = session.start_date <= today;
  const cancelled = session.status === "cancelled";

  const issueCertificates = async () => {
    const ok = await confirmAction({
      title: "Issue certificates?",
      text: "Everyone marked as attended in this session who doesn't have a certificate yet will get one.",
      confirmText: "Issue certificates",
    });
    if (!ok) return;
    setIssuing(true);
    try {
      const { message } = await adminRequest("/api/certificates/issue-session", { method: "POST", body: { session_id: session.id } });
      toastSuccess(message);
    } catch (err) {
      toastError(err.message);
    } finally {
      setIssuing(false);
    }
  };

  return (
    <Box
      sx={{
        p: 1.75,
        borderRadius: "14px",
        border: "1px solid rgba(45,106,79,0.14)",
        bgcolor: cancelled || past ? "#FAFAF8" : "#fff",
        opacity: cancelled ? 0.75 : 1,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1, flexWrap: "wrap", mb: 1.25 }}>
        <Box sx={{ flex: 1, minWidth: 180 }}>
          <Typography sx={{ fontWeight: 700, color: GREEN.ink, fontSize: "0.95rem" }}>
            {formatDayRange(session.start_date, session.end_date)}
          </Typography>
          <Typography sx={{ fontSize: "0.8rem", color: "text.secondary" }}>
            {[session.location || course.location, formatKES(session.fee ?? course.fee)].filter(Boolean).join(" · ")}
          </Typography>
        </Box>
        {cancelled ? (
          <Pill option={findOption(SESSION_STATUSES, "cancelled")} />
        ) : (
          <Pill option={past ? { label: "Finished", bg: "#EEF0EE", fg: "#5B6660" } : started ? { label: "In progress", bg: "#FFF1D6", fg: "#8A5A00" } : { label: "Upcoming", bg: "#D8F3DC", fg: "#1B4332" }} />
        )}
      </Box>
      <SeatsBar taken={session.seats_taken || 0} capacity={session.capacity} />
      <Box sx={{ display: "flex", gap: 1, mt: 1.5, flexWrap: "wrap" }}>
        <Button
          component={RouterLink}
          to={`/bookings?course=${course.id}&session=${session.id}`}
          size="small"
          startIcon={<EventSeatRounded />}
          sx={{ textTransform: "none", fontWeight: 600, borderRadius: "10px", color: GREEN.main }}
        >
          Bookings
        </Button>
        {started && !cancelled && (
          <Button
            size="small"
            disabled={issuing}
            onClick={issueCertificates}
            startIcon={<WorkspacePremiumRounded />}
            sx={{ textTransform: "none", fontWeight: 600, borderRadius: "10px", color: "#8A6A00" }}
          >
            {issuing ? "Issuing..." : "Issue certificates"}
          </Button>
        )}
      </Box>
    </Box>
  );
}

export function CoursePreview({ course }) {
  const sessions = course.sessions || [];
  const today = todayISO();
  const upcoming = sessions.filter((s) => (s.end_date || s.start_date) >= today);
  const past = sessions.filter((s) => (s.end_date || s.start_date) < today).reverse();
  const counts = course.booking_counts || {};

  return (
    <>
      {!course.is_published && (
        <Alert severity="info" sx={{ mb: 2, borderRadius: "12px" }}>
          Hidden: this course isn't listed on the website's Training page.
        </Alert>
      )}
      {course.is_published && !upcomingSessions(course).length && (
        <Alert severity="warning" sx={{ mb: 2, borderRadius: "12px" }}>
          No upcoming dates. Visitors can still book and suggest a date that suits them.
        </Alert>
      )}

      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "260px minmax(0, 1fr)" }, mb: 2 }}>
        <Thumb src={course.image} alt={course.name} size="100%" radius="18px" sx={{ aspectRatio: "4 / 3", height: "auto" }} icon={<SchoolRounded sx={{ fontSize: 48 }} />} />
        <Section title="Course facts" sx={{ mb: 0 }}>
          <InfoGrid>
            <InfoRow icon={CategoryRounded} label="Category" value={course.category || "Uncategorised"} />
            <InfoRow icon={TrendingUpRounded} label="Level" value={course.level} />
            <InfoRow icon={AccessTimeRounded} label="Duration" value={course.duration} />
            <InfoRow icon={LaptopRounded} label="Mode" value={course.mode} />
            <InfoRow icon={PlaceRounded} label="Location" value={course.location} />
            <InfoRow icon={PaymentsRounded} label="Fee per person" value={course.fee !== null && course.fee !== undefined ? formatKES(course.fee) : "Not set"} />
          </InfoGrid>
        </Section>
      </Box>

      <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(3, 1fr)" }, mb: 2 }}>
        {[
          ["Upcoming dates", upcomingSessions(course).length],
          ["Bookings", counts.total ?? 0],
          ["Awaiting a call", counts.pending ?? 0],
        ].map(([label, value]) => (
          <Box key={label} sx={{ p: 1.75, borderRadius: "14px", textAlign: "center", background: `linear-gradient(135deg, ${GREEN.mist}, #F1F9F3)` }}>
            <Typography sx={{ fontWeight: 800, fontSize: "1.35rem", color: GREEN.deep }}>{value}</Typography>
            <Typography sx={{ fontSize: "0.78rem", color: GREEN.main, fontWeight: 600 }}>{label}</Typography>
          </Box>
        ))}
      </Box>

      <Section
        title={`Dates (${upcoming.length} upcoming)`}
        action={
          <Button component={RouterLink} to={`/bookings?course=${course.id}`} size="small" sx={{ textTransform: "none", fontWeight: 600, color: GREEN.main }}>
            All bookings
          </Button>
        }
      >
        {upcoming.length ? (
          <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" } }}>
            {upcoming.map((s) => (
              <SessionCard key={s.id} session={s} course={course} />
            ))}
          </Box>
        ) : (
          <Paragraph empty="No upcoming dates. Switch to Edit to add some." />
        )}
      </Section>

      {past.length > 0 && (
        <Section title={`Past dates (${past.length})`}>
          <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" } }}>
            {past.map((s) => (
              <SessionCard key={s.id} session={s} course={course} />
            ))}
          </Box>
        </Section>
      )}

      <Section title="Short description">
        <Paragraph>{course.short_description}</Paragraph>
      </Section>
      <Section title="About the course">
        <Paragraph>{course.description}</Paragraph>
      </Section>
      <Box sx={{ display: "grid", gap: { md: 2 }, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" } }}>
        <Section title="What participants learn">
          {course.outcomes?.length ? (
            <Box component="ul" sx={{ m: 0, pl: 2.5, "& li": { mb: 0.5, fontSize: "0.9rem", color: GREEN.ink } }}>
              {course.outcomes.map((o, i) => (
                <li key={i}>{o}</li>
              ))}
            </Box>
          ) : (
            <Paragraph />
          )}
        </Section>
        <Section title="Who it's for">
          <Paragraph>{course.audience}</Paragraph>
        </Section>
      </Box>

      <Section title="Record">
        <InfoGrid>
          <InfoRow icon={PersonRounded} label="Created" value={`${formatDate(course.createdAt)}${course.creator ? ` by ${course.creator.name}` : ""}`} />
          <InfoRow icon={PersonRounded} label="Last updated" value={`${formatDate(course.updatedAt)}${course.updater ? ` by ${course.updater.name}` : ""}`} />
        </InfoGrid>
      </Section>
    </>
  );
}

function SessionsEditor({ sessions, onChange, defaults }) {
  const update = (index, key) => (value) => onChange(sessions.map((s, i) => (i === index ? { ...s, [key]: value } : s)));
  const add = () =>
    onChange([...sessions, { start_date: "", end_date: "", location: defaults.location || "", fee: "", capacity: 20, status: "scheduled", seats_taken: 0 }]);
  const remove = (index) => onChange(sessions.filter((_, i) => i !== index));
  const dateProps = { type: "date", slotProps: { inputLabel: { shrink: true } } };

  return (
    <Box sx={{ display: "grid", gap: 1.5 }}>
      {!sessions.length && (
        <Typography sx={{ fontSize: "0.85rem", color: "text.secondary", textAlign: "center", py: 2, border: "1px dashed rgba(45,106,79,0.25)", borderRadius: "14px" }}>
          No dates yet. Visitors can still book and suggest a date.
        </Typography>
      )}
      {sessions.map((s, index) => {
        const booked = s.seats_taken || 0;
        return (
          <Box key={s.id || `new-${index}`} sx={{ border: "1px solid rgba(45, 106, 79, 0.14)", borderRadius: "14px", p: 1.75, bgcolor: "#FBFCFA" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
              <Typography noWrap sx={{ flex: 1, fontWeight: 600, fontSize: "0.88rem", color: GREEN.ink }}>
                {s.start_date ? formatDayRange(s.start_date, s.end_date || s.start_date) : `New date ${index + 1}`}
                {booked > 0 && (
                  <Box component="span" sx={{ ml: 1, fontWeight: 500, color: "text.secondary", fontSize: "0.8rem" }}>
                    · {booked} booked
                  </Box>
                )}
              </Typography>
              <Tooltip title={booked ? "Has bookings: set the status to Cancelled instead" : "Remove date"}>
                <span>
                  <IconButton size="small" disabled={booked > 0} onClick={() => remove(index)} aria-label="Remove date" sx={{ color: "#B42318" }}>
                    <DeleteOutlineRounded fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            </Box>
            <FieldGrid columns={3}>
              <Field label="Starts" value={s.start_date} onChange={update(index, "start_date")} required {...dateProps} />
              <Field label="Ends" value={s.end_date} onChange={update(index, "end_date")} helper="Empty for a one-day class" {...dateProps} />
              <Field label="Status" value={s.status} onChange={update(index, "status")} select options={SESSION_STATUSES} />
              <Field label="Venue" value={s.location} onChange={update(index, "location")} max={160} placeholder={defaults.location || "e.g. Ruiru demo farm"} />
              <Field
                label="Fee (KES)"
                type="number"
                value={s.fee}
                onChange={update(index, "fee")}
                helper={defaults.fee !== "" ? `Empty uses ${formatKES(defaults.fee)}` : "Empty uses the course fee"}
              />
              <Field
                label="Seats"
                type="number"
                value={s.capacity}
                onChange={update(index, "capacity")}
                required
                helper={booked ? `At least ${booked} (already booked)` : undefined}
                slotProps={{ htmlInput: { min: Math.max(1, booked), max: 1000 } }}
              />
            </FieldGrid>
          </Box>
        );
      })}
      {sessions.length < MAX_SESSIONS && (
        <Button
          onClick={add}
          startIcon={<AddRounded />}
          sx={{ justifySelf: "start", textTransform: "none", fontWeight: 700, borderRadius: "12px", color: GREEN.main, bgcolor: "#F1F9F3", px: 2, "&:hover": { bgcolor: GREEN.mist } }}
        >
          Add date
        </Button>
      )}
    </Box>
  );
}

const TABS = [
  { value: "basics", label: "Basics" },
  { value: "dates", label: "Dates & seats" },
  { value: "details", label: "Course details" },
  { value: "seo", label: "SEO" },
];

export function CourseForm({ form, setField, categories = [] }) {
  const [tab, setTab] = useState("basics");

  return (
    <>
      <FormTabs tabs={TABS} value={tab} onChange={setTab} page />

      {tab === "basics" && (
        <>
          <Box sx={{ display: "grid", gap: { md: 2 }, gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1.5fr) minmax(0, 1fr)" }, alignItems: "start" }}>
            <Section title="Course">
              <FieldGrid>
                <Field label="Course name" value={form.name} onChange={setField("name")} max={160} required span />
                <Autocomplete
                  freeSolo
                  options={categories}
                  value={form.category || ""}
                  onChange={(_, value) => setField("category")(value || "")}
                  onInputChange={(_, value, reason) => reason === "input" && setField("category")(value)}
                  renderInput={(params) => <TextField {...params} label="Category" size="small" sx={fieldSx} helperText="Pick one or type a new one" />}
                />
                <Field label="Level" value={form.level} onChange={setField("level")} select options={COURSE_LEVELS} />
                <Field label="Duration" value={form.duration} onChange={setField("duration")} max={60} placeholder="e.g. 3 days" />
                <Field label="Mode" value={form.mode} onChange={setField("mode")} select options={COURSE_MODES} />
                <Field label="Location" value={form.location} onChange={setField("location")} max={120} placeholder="e.g. Ruiru, Kiambu" />
                <Field label="Fee per person (KES)" type="number" value={form.fee} onChange={setField("fee")} helper="Empty shows “Contact us” on the website" />
                <Field
                  label="Short description"
                  value={form.short_description}
                  onChange={setField("short_description")}
                  max={200}
                  multiline
                  rows={2}
                  span
                  helper={`Shown on course cards · ${form.short_description.length}/200`}
                />
              </FieldGrid>
            </Section>
            <Section title="Course photo">
              <ImageField label="Photo" value={form.image} onChange={setField("image")} folder="courses" aspect="4 / 3" helper="Used on cards and the course page." />
            </Section>
          </Box>
          <Section title="Visibility">
            <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" } }}>
              <SwitchRow label="Published" description="Show on the Training page" checked={form.is_published} onChange={setField("is_published")} />
              <SwitchRow label="Featured" description="Highlight at the top of the Training page" checked={form.is_featured} onChange={setField("is_featured")} />
            </Box>
            <Box sx={{ mt: 2, display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" } }}>
              <Field label="URL slug" value={form.slug} onChange={setField("slug")} max={160} placeholder="auto from name" helper="Leave empty to generate from the name" />
              <Field label="Display position" type="number" value={form.sort_order} onChange={setField("sort_order")} helper="Lower numbers show first" />
            </Box>
          </Section>
        </>
      )}

      {tab === "dates" && (
        <Section
          title={`Class dates (${form.sessions.length})`}
          hint="Each date has its own seat limit. Dates with bookings can't be removed: set them to Cancelled and call the participants."
        >
          <SessionsEditor sessions={form.sessions} onChange={setField("sessions")} defaults={{ location: form.location, fee: form.fee }} />
        </Section>
      )}

      {tab === "details" && (
        <>
          <Section title="About the course">
            <FieldGrid>
              <Field label="Description" value={form.description} onChange={setField("description")} max={10000} multiline rows={6} span />
              <Field label="Who it's for" value={form.audience} onChange={setField("audience")} max={300} multiline rows={2} span placeholder="e.g. Farmers, schools and youth groups starting out" />
            </FieldGrid>
          </Section>
          <Section title="What participants learn" hint="Up to 15 points, shown as a checklist.">
            <StringListField label="Learning outcome" value={form.outcomes} onChange={setField("outcomes")} max={15} placeholder="e.g. Mix and monitor nutrient solutions" />
          </Section>
        </>
      )}

      {tab === "seo" && (
        <Section title="Search engines" hint="Optional. The course name and short description are used when these are empty.">
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
