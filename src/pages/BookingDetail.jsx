import React, { useEffect, useState } from "react";
import { Alert } from "@mui/material";
import { Helmet } from "react-helmet-async";
import { adminRequest } from "../utils/adminApi";
import ContentPage from "../components/Content/ContentPage";
import useDetailPage from "../components/Content/useDetailPage";
import {
  BookingChips,
  BookingForm,
  BookingPreview,
  BookingQuickActions,
  bookingDeletePrompt,
  toForm,
  toPayload,
} from "../components/Content/BookingContent";

export default function BookingDetail() {
  const [courses, setCourses] = useState([]);
  const d = useDetailPage({
    listPath: "/bookings",
    endpoint: "/api/training-bookings",
    toForm,
    toPayload,
    noun: "booking",
    deletePrompt: bookingDeletePrompt,
  });
  const { form, setForm, setField, record } = d;

  // Reload after each save so seat counts include this booking's changes
  useEffect(() => {
    if (d.mode !== "edit") return;
    adminRequest("/api/courses/admin/sessions")
      .then(({ data }) => setCourses(data))
      .catch(() => setCourses([]));
  }, [d.mode]);

  const currentCourse = record?.course_id ? { id: record.course_id, name: record.course_name } : null;
  const currentSession = record?.session ? { ...record.session, course_id: record.course_id } : null;

  return (
    <>
      <Helmet>
        <title>{`${d.isNew ? "Add booking" : record?.name || "Booking"} | Mcaludoh Consultancy Admin`}</title>
      </Helmet>

      <ContentPage
        {...d.pageProps}
        backLabel="All bookings"
        eyebrow={d.isNew ? "Add booking" : `${d.mode === "edit" ? "Editing booking" : "Training booking"}${record ? ` · ${record.course_name}` : ""}`}
        title={d.isNew ? form.name || "New booking" : record?.name}
        chips={record && <BookingChips booking={record} />}
        saveLabel={d.isNew ? "Add booking" : "Save changes"}
        viewActions={record && <BookingQuickActions booking={record} saving={d.saving} patch={d.patch} />}
      >
        {d.loadError && (
          <Alert severity="error" sx={{ borderRadius: "12px" }}>
            {d.loadError}
          </Alert>
        )}
        {!d.loadError && d.mode === "view" && record && <BookingPreview booking={record} />}
        {!d.loadError && d.mode === "edit" && (
          <BookingForm form={form} setForm={setForm} setField={setField} courses={courses} currentCourse={currentCourse} currentSession={currentSession} />
        )}
      </ContentPage>
    </>
  );
}
