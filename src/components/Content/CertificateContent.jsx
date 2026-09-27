import React, { useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { Alert, Autocomplete, Box, Button, IconButton, Link, TextField, Tooltip, Typography } from "@mui/material";
import {
  BlockRounded,
  CalendarMonthRounded,
  ContentCopyRounded,
  EventSeatRounded,
  OpenInNewRounded,
  RestoreRounded,
  SchoolRounded,
  VerifiedRounded,
  WorkspacePremiumRounded,
} from "@mui/icons-material";
import { adminRequest, buildQuery } from "../../utils/adminApi";
import { Field, FieldGrid, InfoGrid, InfoRow, Paragraph, Section, fieldSx } from "./FormKit";
import { Pill } from "./ListKit";
import { promptText, toastError, toastSuccess } from "./feedback";
import { CERTIFICATE_STATUSES, GREEN, findOption, formatDate, formatDay, publicLink, todayISO } from "./constants";

const EMPTY = {
  booking_id: "",
  course_id: "",
  recipient_name: "",
  recipient_email: "",
  organization: "",
  course_name: "",
  completed_on: "",
  issued_at: "",
  status: "valid",
  revoked_reason: "",
  notes: "",
};

const localDay = (value) => {
  if (!value) return "";
  const d = new Date(value);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export const toForm = (cert) => {
  if (!cert) return { ...EMPTY, issued_at: todayISO() };
  const form = {};
  Object.keys(EMPTY).forEach((key) => {
    const value = cert[key];
    form[key] = value === null || value === undefined ? EMPTY[key] : value;
  });
  form.issued_at = localDay(cert.issued_at);
  return form;
};

// Issue dates are picked as a day; noon keeps them on that day in every timezone
export const toPayload = (form) => ({
  ...form,
  booking_id: form.booking_id || null,
  course_id: form.course_id || null,
  completed_on: form.completed_on || null,
  issued_at: form.issued_at ? new Date(`${form.issued_at}T12:00:00`).toISOString() : null,
  revoked_reason: form.status === "revoked" ? form.revoked_reason : null,
});

// Form fields filled in from a booking (and its class date)
export const fromBooking = (booking) => ({
  booking_id: booking.id,
  course_id: booking.course_id || "",
  recipient_name: booking.name || "",
  recipient_email: booking.email || "",
  organization: booking.organization || "",
  course_name: booking.course_name || "",
  completed_on: booking.session?.end_date || "",
});

export const certificateDeletePrompt = (c) => ({
  title: "Delete this certificate?",
  text: `${c.certificate_number} will stop verifying on the website. To keep a record, revoke it instead.`,
});

export const verifyLink = (number) => publicLink(`/verify/${number}`);

export const copyVerifyLink = async (number) => {
  const link = verifyLink(number);
  if (!link) return toastError("The website address isn't set (VITE_PUBLIC_SITE_URL).");
  try {
    await navigator.clipboard.writeText(link);
    return toastSuccess("Verification link copied");
  } catch {
    return toastError(link);
  }
};

export function CertificateChips({ cert }) {
  return (
    <>
      <Pill option={findOption(CERTIFICATE_STATUSES, cert.status)} />
      {cert.certificate_number && (
        <Typography sx={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.85)", fontFamily: "monospace" }}>{cert.certificate_number}</Typography>
      )}
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

export function CertificateQuickActions({ cert, saving, patch }) {
  const revoke = async () => {
    const reason = await promptText({
      title: "Revoke this certificate?",
      text: "It will show as revoked when someone checks the number on the website.",
      label: "Reason",
      placeholder: "e.g. Issued with the wrong name",
      confirmText: "Revoke",
      required: true,
    });
    if (reason === null) return;
    patch({ status: "revoked", revoked_reason: reason }, "Certificate revoked");
  };

  return (
    <>
      <Button variant="outlined" startIcon={<ContentCopyRounded />} onClick={() => copyVerifyLink(cert.certificate_number)} sx={quickButtonSx}>
        Copy link
      </Button>
      {cert.status === "valid" ? (
        <Button
          variant="outlined"
          disabled={saving}
          startIcon={<BlockRounded />}
          onClick={revoke}
          sx={{ ...quickButtonSx, color: "#B42318", borderColor: "rgba(180,35,24,0.35)", "&:hover": { borderColor: "#B42318", bgcolor: "#FEF3F2" } }}
        >
          Revoke
        </Button>
      ) : (
        <Button variant="outlined" disabled={saving} startIcon={<RestoreRounded />} onClick={() => patch({ status: "valid" }, "Certificate restored")} sx={quickButtonSx}>
          Restore
        </Button>
      )}
    </>
  );
}

// A small replica of the printed certificate
function CertificateCard({ cert }) {
  const revoked = cert.status === "revoked";
  return (
    <Box
      sx={{
        position: "relative",
        p: { xs: 2.5, sm: 4 },
        borderRadius: "18px",
        textAlign: "center",
        bgcolor: "#FFFDF7",
        border: "1px solid #E9DFC4",
        boxShadow: "inset 0 0 0 6px #FFFDF7, inset 0 0 0 7px #E9DFC4",
        overflow: "hidden",
      }}
    >
      {revoked && (
        <Box
          sx={{
            position: "absolute",
            top: 22,
            right: -38,
            transform: "rotate(35deg)",
            bgcolor: "#B42318",
            color: "#fff",
            px: 6,
            py: 0.5,
            fontWeight: 800,
            fontSize: "0.75rem",
            letterSpacing: "0.12em",
          }}
        >
          REVOKED
        </Box>
      )}
      <WorkspacePremiumRounded sx={{ fontSize: 40, color: "#B7791F" }} />
      <Typography sx={{ fontSize: "0.72rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "#8A6A00", fontWeight: 700, mt: 0.5 }}>
        Certificate of completion
      </Typography>
      <Typography sx={{ fontSize: "0.82rem", color: "text.secondary", mt: 2 }}>This certifies that</Typography>
      <Typography sx={{ fontFamily: "Georgia, serif", fontSize: { xs: "1.5rem", sm: "1.9rem" }, color: GREEN.deep, fontWeight: 700, my: 0.5 }}>
        {cert.recipient_name}
      </Typography>
      {cert.organization && <Typography sx={{ fontSize: "0.85rem", color: "text.secondary" }}>{cert.organization}</Typography>}
      <Typography sx={{ fontSize: "0.82rem", color: "text.secondary", mt: 1.5 }}>has completed</Typography>
      <Typography sx={{ fontWeight: 700, fontSize: "1.05rem", color: GREEN.ink }}>{cert.course_name}</Typography>
      <Box sx={{ display: "flex", justifyContent: "center", gap: { xs: 2, sm: 5 }, mt: 2.5, flexWrap: "wrap" }}>
        <Box>
          <Typography sx={{ fontSize: "0.7rem", color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.08em" }}>Completed</Typography>
          <Typography sx={{ fontSize: "0.85rem", fontWeight: 600, color: GREEN.ink }}>{formatDay(cert.completed_on)}</Typography>
        </Box>
        <Box>
          <Typography sx={{ fontSize: "0.7rem", color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.08em" }}>Certificate no.</Typography>
          <Typography sx={{ fontSize: "0.85rem", fontWeight: 700, color: GREEN.ink, fontFamily: "monospace" }}>{cert.certificate_number}</Typography>
        </Box>
      </Box>
    </Box>
  );
}

export function CertificatePreview({ cert }) {
  const link = verifyLink(cert.certificate_number);
  const booking = cert.booking;

  return (
    <>
      {cert.status === "revoked" && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: "12px" }}>
          Revoked {formatDate(cert.revoked_at, false)}
          {cert.revoked_reason ? `: ${cert.revoked_reason}` : ""}. The website shows this certificate as not valid.
        </Alert>
      )}

      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1.3fr) minmax(0, 1fr)" }, mb: 2, alignItems: "start" }}>
        <CertificateCard cert={cert} />
        <Section title="Online verification" sx={{ mb: 0 }}>
          <Typography sx={{ fontSize: "0.85rem", color: "text.secondary", mb: 1.5 }}>
            Anyone can check this certificate by entering its number on the website, or by opening this link:
          </Typography>
          {link ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, p: 1, pl: 1.5, borderRadius: "12px", bgcolor: "#F1F7F3", minWidth: 0 }}>
              <Typography sx={{ flex: 1, fontSize: "0.8rem", fontFamily: "monospace", color: GREEN.ink, wordBreak: "break-all" }}>{link}</Typography>
              <Tooltip title="Copy">
                <IconButton size="small" onClick={() => copyVerifyLink(cert.certificate_number)} aria-label="Copy verification link">
                  <ContentCopyRounded fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Open">
                <IconButton size="small" component="a" href={link} target="_blank" rel="noopener noreferrer" aria-label="Open verification page">
                  <OpenInNewRounded fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          ) : (
            <Paragraph empty="Set VITE_PUBLIC_SITE_URL to show the verification link." />
          )}
        </Section>
      </Box>

      <Section title="Details">
        <InfoGrid>
          <InfoRow
            icon={SchoolRounded}
            label="Course"
            value={
              cert.course ? (
                <Link component={RouterLink} to={`/courses/${cert.course.id}`} underline="hover" sx={{ color: GREEN.main, fontWeight: 600 }}>
                  {cert.course_name}
                </Link>
              ) : (
                cert.course_name
              )
            }
          />
          <InfoRow
            icon={EventSeatRounded}
            label="Booking"
            value={
              booking ? (
                <Link component={RouterLink} to={`/bookings/${booking.id}`} underline="hover" sx={{ color: GREEN.main, fontWeight: 600 }}>
                  {booking.reference} · {booking.name}
                </Link>
              ) : (
                "Not linked to a booking"
              )
            }
          />
          <InfoRow icon={VerifiedRounded} label="Recipient email" value={cert.recipient_email} />
          <InfoRow icon={CalendarMonthRounded} label="Issued" value={`${formatDate(cert.issued_at, false)}${cert.issuer ? ` by ${cert.issuer.name}` : ""}`} />
        </InfoGrid>
      </Section>

      <Section title="Internal notes">
        <Paragraph empty="No notes">{cert.notes}</Paragraph>
      </Section>
    </>
  );
}

// Search attended bookings by name, phone or reference
function BookingPicker({ value, onPick, onClear }) {
  const [input, setInput] = useState("");
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      setLoading(true);
      adminRequest(`/api/training-bookings/admin${buildQuery({ status: "attended", search: input.trim(), limit: 15 })}`)
        .then(({ data }) => !cancelled && setOptions(data))
        .catch(() => !cancelled && setOptions([]))
        .finally(() => !cancelled && setLoading(false));
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [input]);

  const label = (b) => `${b.name} · ${b.course_name} · ${b.reference}`;

  return (
    <Autocomplete
      value={value}
      options={value && !options.some((o) => o.id === value.id) ? [value, ...options] : options}
      loading={loading}
      filterOptions={(x) => x}
      getOptionLabel={(b) => (b ? label(b) : "")}
      isOptionEqualToValue={(a, b) => a.id === b.id}
      onChange={(_, picked) => (picked ? onPick(picked) : onClear())}
      onInputChange={(_, text, reason) => reason === "input" && setInput(text)}
      noOptionsText={input ? "No attended bookings match" : "No attended bookings yet"}
      renderInput={(params) => (
        <TextField {...params} label="Booking" size="small" sx={fieldSx} helperText="Optional. Picking an attended booking fills in the details below." />
      )}
    />
  );
}

export function CertificateForm({ form, setForm, setField, courses = [], linkedBooking, isNew }) {
  const [picked, setPicked] = useState(linkedBooking || null);

  useEffect(() => {
    setPicked(linkedBooking || null);
  }, [linkedBooking]);

  const pickBooking = (booking) => {
    setPicked(booking);
    setForm((prev) => ({ ...prev, ...fromBooking(booking) }));
  };
  const clearBooking = () => {
    setPicked(null);
    setForm((prev) => ({ ...prev, booking_id: "" }));
  };

  const courseOptions = [{ value: "", label: "Not linked" }, ...courses.map((c) => ({ value: c.id, label: c.name }))];
  if (form.course_id && !courses.some((c) => c.id === form.course_id)) {
    courseOptions.push({ value: form.course_id, label: form.course_name || "Current course" });
  }
  const chooseCourse = (id) => {
    const course = courses.find((c) => c.id === id);
    setForm((prev) => ({ ...prev, course_id: id, course_name: course ? course.name : prev.course_name }));
  };

  return (
    <>
      {isNew && (
        <Alert severity="info" sx={{ mb: 2, borderRadius: "12px" }}>
          The certificate number is created automatically when you save.
        </Alert>
      )}

      <Section title="Link">
        <FieldGrid>
          <Box className="span-all">
            <BookingPicker value={picked} onPick={pickBooking} onClear={clearBooking} />
          </Box>
          <Field label="Course" value={form.course_id} onChange={chooseCourse} select options={courseOptions} helper="Picking a course fills in its name" />
          <Field label="Course name on certificate" value={form.course_name} onChange={setField("course_name")} max={200} required />
        </FieldGrid>
      </Section>

      <Section title="Recipient">
        <FieldGrid>
          <Field label="Full name" value={form.recipient_name} onChange={setField("recipient_name")} max={160} required helper="Printed exactly as typed" />
          <Field label="Email" type="email" value={form.recipient_email} onChange={setField("recipient_email")} max={160} />
          <Field label="Organisation" value={form.organization} onChange={setField("organization")} max={160} span />
        </FieldGrid>
      </Section>

      <Section title="Dates & status">
        <FieldGrid>
          <Field label="Completed on" type="date" value={form.completed_on} onChange={setField("completed_on")} slotProps={{ inputLabel: { shrink: true } }} />
          <Field label="Issued on" type="date" value={form.issued_at} onChange={setField("issued_at")} slotProps={{ inputLabel: { shrink: true } }} />
          <Field label="Status" value={form.status} onChange={setField("status")} select options={CERTIFICATE_STATUSES} />
          {form.status === "revoked" && (
            <Field label="Reason for revoking" value={form.revoked_reason} onChange={setField("revoked_reason")} max={300} />
          )}
          <Field label="Internal notes" value={form.notes} onChange={setField("notes")} max={5000} multiline rows={3} span helper="Only admins see this" />
        </FieldGrid>
      </Section>
    </>
  );
}

export function RecipientCell({ cert }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography sx={{ fontWeight: 700, color: GREEN.ink, fontSize: "0.9rem" }} noWrap>
        {cert.recipient_name}
      </Typography>
      <Typography variant="caption" sx={{ color: "text.secondary" }} noWrap>
        {cert.organization || cert.recipient_email || (cert.booking ? `Booking ${cert.booking.reference}` : "")}
      </Typography>
    </Box>
  );
}