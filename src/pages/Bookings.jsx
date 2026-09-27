import React, { useEffect, useState } from "react";
import { Box, Button, Typography, useMediaQuery } from "@mui/material";
import { AddRounded, EventSeatRounded } from "@mui/icons-material";
import { Helmet } from "react-helmet-async";
import { useNavigate, useSearchParams } from "react-router-dom";
import { adminRequest } from "../utils/adminApi";
import { StatsLayout, SummaryCard } from "../components/common/Stats";
import {
  ActionIcons,
  ClearFiltersButton,
  ContentCard,
  EmptyState,
  ErrorBanner,
  FilterSelect,
  PageHeader,
  Pill,
  ResponsiveList,
  SearchField,
  Toolbar,
  outlinedButtonSx,
  primaryButtonSx,
} from "../components/Content/ListKit";
import { confirmDelete, toastSuccess } from "../components/Content/feedback";
import useAdminList from "../components/Content/useAdminList";
import { bookingDateText, bookingDeletePrompt } from "../components/Content/BookingContent";
import {
  BOOKING_STATUSES,
  GREEN,
  PAYMENT_STATUSES,
  findOption,
  formatDayRange,
  formatKES,
  timeAgo,
} from "../components/Content/constants";

const STATUS_COLORS = { pending: "#8A5A00", confirmed: "#1D4E89", attended: "#1B4332", cancelled: "#9B1C1C" };

const VIEWS = [
  { value: "", label: "All bookings", count: (s) => s?.total },
  ...BOOKING_STATUSES.map((s) => ({ value: s.value, label: s.label, count: (sum) => sum?.[s.value], color: STATUS_COLORS[s.value] })),
];

export default function Bookings() {
  const isDesktop = useMediaQuery("(min-width:900px)");
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [status, setStatus] = useState("");
  const [payment, setPayment] = useState("");
  const [courseId, setCourseId] = useState(params.get("course") || "");
  const [sessionId, setSessionId] = useState(params.get("session") || "");
  const [courses, setCourses] = useState([]);
  const list = useAdminList("/api/training-bookings/admin", {
    status,
    payment_status: payment,
    course_id: courseId,
    session_id: sessionId,
  });

  useEffect(() => {
    adminRequest("/api/courses/admin/sessions")
      .then(({ data }) => setCourses(data))
      .catch(() => setCourses([]));
  }, []);

  // Links from a course page arrive as ?course=&session=; keep the URL in step with those two filters
  useEffect(() => {
    const next = {};
    if (courseId) next.course = courseId;
    if (sessionId) next.session = sessionId;
    setParams(next, { replace: true });
  }, [courseId, sessionId, setParams]);

  const setFilter = (setter) => (value) => {
    setter(value);
    list.resetPage();
  };
  const chooseCourse = (value) => {
    setCourseId(value);
    setSessionId("");
    list.resetPage();
  };

  const hasFilters = Boolean(list.search || status || payment || courseId || sessionId);
  const clearFilters = () => {
    list.clearSearch();
    setStatus("");
    setPayment("");
    setCourseId("");
    setSessionId("");
  };

  const openBooking = (id, mode = "view") =>
    navigate(id === "new" ? "/bookings/new" : mode === "edit" ? `/bookings/${id}/edit` : `/bookings/${id}`);

  const removeBooking = async (booking) => {
    if (!(await confirmDelete(bookingDeletePrompt(booking)))) return;
    try {
      await adminRequest(`/api/training-bookings/${booking.id}`, { method: "DELETE" });
      toastSuccess("Booking deleted");
      list.refresh();
    } catch (err) {
      list.setError(err.message);
    }
  };

  const actions = (b) => (
    <ActionIcons label={`booking ${b.reference}`} onView={() => openBooking(b.id)} onEdit={() => openBooking(b.id, "edit")} onDelete={() => removeBooking(b)} />
  );

  const selectedCourse = courses.find((c) => c.id === courseId);
  const courseOptions = courses.map((c) => ({ value: c.id, label: c.name }));
  const sessionOptions = [
    { value: "none", label: "Flexible (no date)" },
    ...(selectedCourse?.sessions || []).map((s) => ({ value: s.id, label: formatDayRange(s.start_date, s.end_date) })),
  ];
  // A cancelled date linked from the course page isn't in the scheduled list, but the filter still applies
  if (sessionId && sessionId !== "none" && !sessionOptions.some((o) => o.value === sessionId)) {
    sessionOptions.push({ value: sessionId, label: "Selected date" });
  }

  const seatsText = (b) => `${b.participants} ${b.participants === 1 ? "person" : "people"}`;
  const statusPills = (b) => (
    <>
      <Pill option={findOption(BOOKING_STATUSES, b.status)} />
      {b.status !== "cancelled" && <Pill option={findOption(PAYMENT_STATUSES, b.payment_status)} variant="outlined" />}
    </>
  );

  const columns = [
    {
      key: "person",
      label: "Booked by",
      render: (b) => (
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontWeight: 700, color: GREEN.ink, fontSize: "0.9rem" }} noWrap>
            {b.name}
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }} noWrap>
            {b.phone} · {seatsText(b)}
            {b.organization ? ` · ${b.organization}` : ""}
          </Typography>
          <Typography variant="caption" sx={{ color: "text.disabled", fontFamily: "monospace" }}>
            {b.reference} · {timeAgo(b.createdAt)}
          </Typography>
        </Box>
      ),
    },
    {
      key: "class",
      label: "Course & date",
      render: (b) => (
        <Box sx={{ minWidth: 0, maxWidth: 360 }}>
          <Typography sx={{ fontSize: "0.86rem", color: GREEN.ink, fontWeight: 600 }} noWrap title={b.course_name}>
            {b.course_name}
          </Typography>
          <Typography variant="caption" sx={{ color: b.session ? "text.secondary" : "#8A5A00", display: "block" }}>
            {bookingDateText(b)}
          </Typography>
          <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap", mt: 0.75 }}>{statusPills(b)}</Box>
        </Box>
      ),
    },
    { key: "actions", label: "Actions", align: "right", width: 140, render: actions },
  ];

  const subtitle = list.summary
    ? `${formatKES(list.summary.collected)} collected · ${formatKES(list.summary.outstanding)} still to collect from confirmed bookings`
    : "Seats booked from the website's Training pages";

  return (
    <Box sx={{ maxWidth: 1280, mx: "auto" }}>
      <Helmet>
        <title>Training Bookings | Mcaludoh Consultancy Admin</title>
      </Helmet>

      <PageHeader
        title="Training Bookings"
        subtitle={subtitle}
        actions={
          <Button variant="contained" startIcon={<AddRounded />} onClick={() => openBooking("new")} sx={primaryButtonSx}>
            {isDesktop ? "Add booking" : "Add"}
          </Button>
        }
      />

      <StatsLayout carousel={!isDesktop}>
        {VIEWS.map((v) => (
          <SummaryCard
            key={v.value || "all"}
            label={v.label}
            count={v.count(list.summary)}
            color={v.color}
            active={status === v.value}
            onClick={() => setFilter(setStatus)(status === v.value ? "" : v.value)}
          />
        ))}
      </StatsLayout>

      <Toolbar>
        <SearchField value={list.searchInput} onChange={list.setSearchInput} placeholder="Search name, phone, reference, course..." />
        <FilterSelect label="Course" value={courseId} onChange={chooseCourse} options={courseOptions} anyLabel="All courses" />
        {courseId && <FilterSelect label="Date" value={sessionId} onChange={setFilter(setSessionId)} options={sessionOptions} anyLabel="All dates" />}
        <FilterSelect label="Payment" value={payment} onChange={setFilter(setPayment)} options={PAYMENT_STATUSES} anyLabel="Any payment" />
        {hasFilters && <ClearFiltersButton onClick={clearFilters} />}
      </Toolbar>

      <ErrorBanner error={list.error} onRetry={list.refresh} />

      <ResponsiveList
        {...list.listProps}
        isDesktop={isDesktop}
        columns={columns}
        minWidth={600}
        renderCard={(b) => (
          <ContentCard
            title={b.name}
            subtitle={`${b.phone} · ${seatsText(b)}`}
            body={
              <Box>
                <Typography variant="body2" sx={{ color: GREEN.ink, fontWeight: 600 }}>
                  {b.course_name}
                </Typography>
                <Typography variant="body2" sx={{ color: b.session ? "text.secondary" : "#8A5A00" }}>
                  {bookingDateText(b)}
                </Typography>
              </Box>
            }
            chips={statusPills(b)}
            meta={timeAgo(b.createdAt)}
            actions={actions(b)}
          />
        )}
        empty={
          <EmptyState
            icon={<EventSeatRounded sx={{ fontSize: 48, color: GREEN.light, mb: 1 }} />}
            title={hasFilters ? "No bookings match your filters" : "No bookings yet"}
            text={
              hasFilters
                ? "Try a different search or clear the filters."
                : "Bookings made on the website appear here. You can also add phone or WhatsApp bookings."
            }
            action={
              hasFilters ? (
                <Button onClick={clearFilters} variant="outlined" sx={outlinedButtonSx}>
                  Clear filters
                </Button>
              ) : (
                <Button onClick={() => openBooking("new")} variant="contained" startIcon={<AddRounded />} sx={primaryButtonSx}>
                  Add booking
                </Button>
              )
            }
          />
        }
      />
    </Box>
  );
}
