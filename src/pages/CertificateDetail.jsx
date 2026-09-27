import React, { useEffect, useMemo, useState } from "react";
import { Alert } from "@mui/material";
import { Helmet } from "react-helmet-async";
import { useSearchParams } from "react-router-dom";
import { adminRequest } from "../utils/adminApi";
import ContentPage from "../components/Content/ContentPage";
import useDetailPage from "../components/Content/useDetailPage";
import {
  CertificateChips,
  CertificateForm,
  CertificatePreview,
  CertificateQuickActions,
  certificateDeletePrompt,
  fromBooking,
  toForm,
  toPayload,
  verifyLink,
} from "../components/Content/CertificateContent";

export default function CertificateDetail() {
  const [params] = useSearchParams();
  const bookingParam = params.get("booking");
  const [courses, setCourses] = useState([]);
  const [prefillBooking, setPrefillBooking] = useState(null);
  const d = useDetailPage({
    listPath: "/certificates",
    endpoint: "/api/certificates",
    toForm,
    toPayload,
    noun: "certificate",
    deletePrompt: certificateDeletePrompt,
  });
  const { form, setForm, setField, record, isNew } = d;

  useEffect(() => {
    adminRequest("/api/courses/admin/sessions")
      .then(({ data }) => setCourses(data))
      .catch(() => setCourses([]));
  }, []);

  // Opened from a booking's "Issue certificate" button: /certificates/new?booking=<id>
  useEffect(() => {
    if (!isNew || !bookingParam) return undefined;
    let cancelled = false;
    adminRequest(`/api/training-bookings/admin/${bookingParam}`)
      .then(({ data }) => {
        if (cancelled) return;
        setPrefillBooking(data);
        setForm((prev) => ({ ...prev, ...fromBooking(data) }));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isNew, bookingParam, setForm]);

  const linkedBooking = useMemo(() => {
    if (isNew) return prefillBooking;
    return record?.booking ? { ...record.booking, course_name: record.course_name } : null;
  }, [isNew, prefillBooking, record]);

  return (
    <>
      <Helmet>
        <title>{`${isNew ? "Issue certificate" : record?.certificate_number || "Certificate"} | Mcaludoh Consultancy Admin`}</title>
      </Helmet>

      <ContentPage
        {...d.pageProps}
        backLabel="All certificates"
        eyebrow={isNew ? "Issue certificate" : d.mode === "edit" ? "Editing certificate" : "Training certificate"}
        title={isNew ? form.recipient_name || "New certificate" : record?.recipient_name}
        chips={record && <CertificateChips cert={record} />}
        siteUrl={record ? verifyLink(record.certificate_number) : ""}
        saveLabel={isNew ? "Issue certificate" : "Save changes"}
        viewActions={record && <CertificateQuickActions cert={record} saving={d.saving} patch={d.patch} />}
      >
        {d.loadError && (
          <Alert severity="error" sx={{ borderRadius: "12px" }}>
            {d.loadError}
          </Alert>
        )}
        {!d.loadError && d.mode === "view" && record && <CertificatePreview cert={record} />}
        {!d.loadError && d.mode === "edit" && (
          <CertificateForm form={form} setForm={setForm} setField={setField} courses={courses} linkedBooking={linkedBooking} isNew={isNew} />
        )}
      </ContentPage>
    </>
  );
}
