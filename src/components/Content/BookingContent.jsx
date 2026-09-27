import React from "react";
import { Link as RouterLink } from "react-router-dom";
import { Alert, Box, Button, Link, Typography } from "@mui/material";
import {
  BusinessRounded,
  CalendarMonthRounded,
  CancelRounded,
  CheckCircleRounded,
  EmailRounded,
  EventAvailableRounded,
  GroupsRounded,
  HowToRegRounded,
  InboxRounded,
  PaymentsRounded,
  PersonRounded,
  PhoneRounded,
  PlaceRounded,
  ReplayRounded,
  SchoolRounded,
  WhatsApp,
  WorkspacePremiumRounded,
} from "@mui/icons-material";
import { Field, FieldGrid, InfoGrid, InfoRow, Paragraph, Section } from "./FormKit";
import { Pill } from "./ListKit";
import { confirmAction, promptText } from "./feedback";
import {
  BOOKING_SOURCES,
  BOOKING_STATUSES,
  CERTIFICATE_STATUSES,
  GREEN,
  PAYMENT_STATUSES,
  findOption,
  formatDate,
  formatDay,
  formatDayRange,
  formatKES,
  labelOf,
} from "./constants";

const EMPTY = {
  course_id: "",
  session_id: "",
  preferred_date: "",
  name: "",
  phone: "",
  email: "",
  organization: "",
  participants: 1,
  unit_fee: "",
  amount_paid: 0,
  status: "pending",
  source: "admin",
  admin_note: "",
};

export const toForm = (booking) => {
  if (!booking) return { ...EMPTY };
  const form = {};
  Object.keys(EMPTY).forEach((key) => {
    const value = booking[key];
    form[key] = value === null || value === undefined ? EMPTY[key] : value;
  });
  form.unit_fee = booking.unit_fee ?? "";
  return form;
};

// payment_status is left out so the API works it out from the amount paid
export const toPayload = (form) => ({
  ...form,
  session_id: form.session_id || null,
  preferred_date: form.session_id ? null : form.preferred_date || null,
  unit_fee: form.unit_fee === "" ? null : form.unit_fee,
  amount_paid: form.amount_paid === "" ? 0 : form.amount_paid,
});

export const bookingDeletePrompt = (b) => ({
  title: "Delete this booking?",
  text: `${b.name}'s booking ${b.reference} will be removed and its seats freed.`,
});

export const whatsappLink = (phone) => `https://wa.me/${String(phone || "").replace(/\D/g, "")}`;

export const bookingDateText = (b) => {
  if (b.session) return formatDayRange(b.session.start_date, b.session.end_date);
  if (b.preferred_date) return `Flexible · prefers ${formatDay(b.preferred_date)}`;
  return "No date chosen";
};

export const balanceOf = (b) => Math.max(0, (b.total_fee || 0) - (b.amount_paid || 0));

export function BookingChips({ booking }) {
  return (
    <>
      <Pill option={findOption(BOOKING_STATUSES, booking.status)} />
      <Pill option={findOption(PAYMENT_STATUSES, booking.payment_status || "unpaid")} />
      {booking.reference && (
        <Typography sx={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.85)", fontFamily: "monospace" }}>{booking.reference}</Typography>
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

// Next-step buttons shown beside Edit while viewing a booking
export function BookingQuickActions({ booking, saving, patch }) {
  const setStatus = async (status, message, prompt) => {
    if (prompt && !(await confirmAction(prompt))) return;
    patch({ status }, message);
  };

  const recordPayment = async () => {
    const entered = await promptText({
      title: "Record payment",
      text: booking.total_fee ? `Total ${formatKES(booking.total_fee)} · balance ${formatKES(balanceOf(booking))}` : undefined,
      label: "Total amount paid so far (KES)",
      input: "number",
      value: String(booking.total_fee && !booking.amount_paid ? booking.total_fee : booking.amount_paid || 0),
      inputAttributes: { min: "0", step: "1" },
      required: true,
      validate: (v) => (Number(v) < 0 || !Number.isInteger(Number(v)) ? "Enter a whole amount in KES" : undefined),
    });
    if (entered === null) return;
    patch({ amount_paid: Number(entered) }, "Payment recorded");
  };

  const { status } = booking;
  return (
    <>
      {status === "pending" && (
        <Button variant="outlined" disabled={saving} startIcon={<CheckCircleRounded />} onClick={() => setStatus("confirmed", "Booking confirmed")} sx={quickButtonSx}>
          Confirm
        </Button>
      )}
      {status === "confirmed" && (
        <Button variant="outlined" disabled={saving} startIcon={<HowToRegRounded />} onClick={() => setStatus("attended", "Marked as attended")} sx={quickButtonSx}>
          Attended
        </Button>
      )}
      {status === "attended" && (
        <Button component={RouterLink} to={`/certificates/new?booking=${booking.id}`} variant="outlined" startIcon={<WorkspacePremiumRounded />} sx={quickButtonSx}>
          Certificate
        </Button>
      )}
      {status !== "cancelled" && (
        <Button variant="outlined" disabled={saving} startIcon={<PaymentsRounded />} onClick={recordPayment} sx={quickButtonSx}>
          Payment
        </Button>
      )}
      {(status === "pending" || status === "confirmed") && (
        <Button
          variant="outlined"
          disabled={saving}
          startIcon={<CancelRounded />}
          onClick={() =>
            setStatus("cancelled", "Booking cancelled", {
              title: "Cancel this booking?",
              text: `${booking.participants} seat(s) will be freed for other people.`,
              confirmText: "Cancel booking",
              icon: "warning",
            })
          }
          sx={{ ...quickButtonSx, color: "#B42318", borderColor: "rgba(180,35,24,0.35)", "&:hover": { borderColor: "#B42318", bgcolor: "#FEF3F2" } }}
        >
          Cancel
        </Button>
      )}
      {status === "cancelled" && (
        <Button variant="outlined" disabled={saving} startIcon={<ReplayRounded />} onClick={() => setStatus("pending", "Booking reopened")} sx={quickButtonSx}>
          Reopen
        </Button>
      )}
    </>
  );
}

export function BookingPreview({ booking }) {
  const session = booking.session;
  const certificates = booking.certificates || [];

  return (
    <>
      {booking.status === "pending" && (
        <Alert severity="warning" sx={{ mb: 2, borderRadius: "12px" }}>
          New booking: call {booking.name.split(" ")[0]} to confirm the date and payment, then mark it confirmed.
        </Alert>
      )}
      {session?.status === "cancelled" && booking.status !== "cancelled" && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: "12px" }}>
          This class date was cancelled. Move the booking to another date or cancel it.
        </Alert>
      )}

      <Box sx={{ display: "grid", gap: { md: 2 }, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" } }}>
        <Section title="Participant">
          <Box sx={{ display: "grid", gap: 2 }}>
            <InfoRow icon={PersonRounded} label="Name" value={booking.name} />
            <InfoRow
              icon={PhoneRounded}
              label="Phone"
              value={
                <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", alignItems: "center" }}>
                  <Link href={`tel:${booking.phone}`} underline="hover" sx={{ color: GREEN.main, fontWeight: 600 }}>
                    {booking.phone}
                  </Link>
                  <Link href={whatsappLink(booking.phone)} target="_blank" rel="noopener noreferrer" underline="hover" sx={{ color: "#128C7E", display: "inline-flex", alignItems: "center", gap: 0.5, fontSize: "0.85rem" }}>
                    <WhatsApp sx={{ fontSize: 16 }} /> WhatsApp
                  </Link>
                </Box>
              }
            />
            <InfoRow
              icon={EmailRounded}
              label="Email"
              value={
                booking.email && (
                  <Link href={`mailto:${booking.email}`} underline="hover" sx={{ color: GREEN.main }}>
                    {booking.email}
                  </Link>
                )
              }
            />
            <InfoRow icon={BusinessRounded} label="Organisation" value={booking.organization} />
          </Box>
        </Section>

        <Section title="Class">
          <Box sx={{ display: "grid", gap: 2 }}>
            <InfoRow
              icon={SchoolRounded}
              label="Course"
              value={
                booking.course ? (
                  <Link component={RouterLink} to={`/courses/${booking.course.id}`} underline="hover" sx={{ color: GREEN.main, fontWeight: 600 }}>
                    {booking.course_name || booking.course.name}
                  </Link>
                ) : (
                  booking.course_name
                )
              }
            />
            <InfoRow icon={CalendarMonthRounded} label="Date" value={bookingDateText(booking)} />
            <InfoRow icon={PlaceRounded} label="Venue" value={session?.location} />
            <InfoRow icon={GroupsRounded} label="Participants" value={booking.participants} />
          </Box>
        </Section>
      </Box>

      <Section title="Payment">
        <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(4, 1fr)" } }}>
          {[
            ["Per person", formatKES(booking.unit_fee)],
            ["Total", formatKES(booking.total_fee)],
            ["Paid", formatKES(booking.amount_paid || 0)],
            ["Balance", booking.total_fee === null || booking.total_fee === undefined ? "—" : formatKES(balanceOf(booking))],
          ].map(([label, value]) => (
            <Box key={label} sx={{ p: 1.5, borderRadius: "14px", background: `linear-gradient(135deg, ${GREEN.mist}, #F1F9F3)` }}>
              <Typography sx={{ fontSize: "0.75rem", color: GREEN.main, fontWeight: 600 }}>{label}</Typography>
              <Typography sx={{ fontWeight: 800, fontSize: "1.05rem", color: GREEN.deep }}>{value}</Typography>
            </Box>
          ))}
        </Box>
      </Section>

      <Section
        title={`Certificates (${certificates.length})`}
        action={
          booking.status === "attended" && (
            <Button component={RouterLink} to={`/certificates/new?booking=${booking.id}`} size="small" startIcon={<WorkspacePremiumRounded />} sx={{ textTransform: "none", fontWeight: 600, color: GREEN.main }}>
              Issue
            </Button>
          )
        }
      >
        {certificates.length ? (
          <Box sx={{ display: "grid", gap: 1 }}>
            {certificates.map((c) => (
              <Box
                key={c.id}
                component={RouterLink}
                to={`/certificates/${c.id}`}
                sx={{ display: "flex", alignItems: "center", gap: 1.5, p: 1.25, borderRadius: "12px", border: "1px solid rgba(45,106,79,0.12)", textDecoration: "none", color: "inherit", "&:hover": { borderColor: GREEN.mid } }}
              >
                <WorkspacePremiumRounded sx={{ color: "#B7791F" }} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 700, fontSize: "0.88rem", color: GREEN.ink, fontFamily: "monospace" }}>{c.certificate_number}</Typography>
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>
                    {c.recipient_name} · issued {formatDate(c.issued_at, false)}
                  </Typography>
                </Box>
                <Pill option={findOption(CERTIFICATE_STATUSES, c.status)} />
              </Box>
            ))}
          </Box>
        ) : (
          <Paragraph empty={booking.status === "attended" ? "No certificate yet." : "Certificates can be issued once the booking is marked as attended."} />
        )}
      </Section>

      <Section title="Internal note">
        <Paragraph empty="No notes">{booking.admin_note}</Paragraph>
      </Section>

      <Section title="Record">
        <InfoGrid>
          <InfoRow icon={InboxRounded} label="Received" value={`${formatDate(booking.createdAt)} · ${labelOf(BOOKING_SOURCES, booking.source)}`} />
          <InfoRow icon={EventAvailableRounded} label="Confirmed" value={booking.confirmed_at ? formatDate(booking.confirmed_at) : "Not yet"} />
          <InfoRow icon={PersonRounded} label="Handled by" value={booking.handler?.name || "Nobody yet"} />
        </InfoGrid>
      </Section>
    </>
  );
}

/**
 * courses: [{ id, name, fee, sessions: [{ id, start_date, end_date, location, fee, capacity, seats_left }] }]
 * currentCourse / currentSession: the booking's saved links, kept selectable even if deleted or cancelled
 */
export function BookingForm({ form, setForm, setField, courses, currentCourse, currentSession }) {
  const course = courses.find((c) => c.id === form.course_id);
  const sessions = [...(course?.sessions || [])].sort((a, b) => a.start_date.localeCompare(b.start_date));
  if (currentSession && form.course_id === currentSession.course_id && !sessions.some((s) => s.id === currentSession.id)) {
    sessions.unshift({ ...currentSession, missing: true });
  }
  const session = sessions.find((s) => s.id === form.session_id);

  // Picking another course or date resets the fee to that date's (or course's) price
  const feeFor = (c, s) => {
    const fee = s?.fee ?? c?.fee;
    return fee === null || fee === undefined ? "" : fee;
  };
  const chooseCourse = (id) => {
    const next = courses.find((c) => c.id === id);
    setForm((prev) => ({ ...prev, course_id: id, session_id: "", unit_fee: feeFor(next, null) }));
  };
  const chooseSession = (id) => {
    const next = sessions.find((s) => s.id === id);
    setForm((prev) => ({ ...prev, session_id: id, unit_fee: feeFor(course, next) }));
  };

  const courseOptions = courses.map((c) => ({ value: c.id, label: c.is_published ? c.name : `${c.name} (hidden)` }));
  if (currentCourse?.id && !courses.some((c) => c.id === currentCourse.id)) {
    courseOptions.unshift({ value: currentCourse.id, label: currentCourse.name });
  }
  const sessionOptions = [
    { value: "", label: "No date yet (flexible)" },
    ...sessions.map((s) => ({
      value: s.id,
      label: `${formatDayRange(s.start_date, s.end_date)}${s.missing ? " (cancelled)" : ` · ${s.seats_left} seat${s.seats_left === 1 ? "" : "s"} left`}`,
    })),
  ];
  const total = form.unit_fee === "" ? null : Number(form.unit_fee) * Number(form.participants || 0);

  return (
    <>
      <Box sx={{ display: "grid", gap: { md: 2 }, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, alignItems: "start" }}>
        <Section title="Participant">
          <FieldGrid columns={1}>
            <Field label="Full name" value={form.name} onChange={setField("name")} max={120} required />
            <Field label="Phone" value={form.phone} onChange={setField("phone")} max={20} required placeholder="e.g. 0712 345 678" />
            <Field label="Email" type="email" value={form.email} onChange={setField("email")} max={160} />
            <Field label="Organisation" value={form.organization} onChange={setField("organization")} max={160} placeholder="Optional" />
          </FieldGrid>
        </Section>

        <Section title="Class">
          <FieldGrid columns={1}>
            <Field label="Course" value={form.course_id} onChange={chooseCourse} select options={courseOptions} required />
            <Field
              label="Date"
              value={form.session_id}
              onChange={chooseSession}
              select
              options={sessionOptions}
              disabled={!course}
              helper={!course ? "Choose a course first" : session ? session.location || undefined : "Use this when the person wants another date"}
            />
            {!form.session_id && (
              <Field
                label="Preferred start date"
                type="date"
                value={form.preferred_date}
                onChange={setField("preferred_date")}
                slotProps={{ inputLabel: { shrink: true } }}
                helper="Optional"
              />
            )}
            <Field
              label="Participants"
              type="number"
              value={form.participants}
              onChange={setField("participants")}
              required
              slotProps={{ htmlInput: { min: 1, max: 100 } }}
              helper={session && !session.missing ? `${session.seats_left} seat(s) left on this date` : undefined}
            />
          </FieldGrid>
        </Section>
      </Box>

      <Section title="Payment" hint="The payment status (unpaid, part paid, paid) is worked out from the amount paid.">
        <FieldGrid columns={3}>
          <Field label="Fee per person (KES)" type="number" value={form.unit_fee} onChange={setField("unit_fee")} helper="Empty if the price isn't agreed yet" />
          <Field label="Total (KES)" value={total === null ? "—" : total.toLocaleString("en-KE")} onChange={() => {}} disabled helper="Fee × participants" />
          <Field label="Amount paid (KES)" type="number" value={form.amount_paid} onChange={setField("amount_paid")} slotProps={{ htmlInput: { min: 0 } }} />
        </FieldGrid>
      </Section>

      <Section title="Status">
        <FieldGrid>
          <Field label="Status" value={form.status} onChange={setField("status")} select options={BOOKING_STATUSES} />
          <Field label="How it came in" value={form.source} onChange={setField("source")} select options={BOOKING_SOURCES} />
          <Field label="Internal note" value={form.admin_note} onChange={setField("admin_note")} max={5000} multiline rows={3} span helper="Only admins see this" />
        </FieldGrid>
      </Section>
    </>
  );
}
