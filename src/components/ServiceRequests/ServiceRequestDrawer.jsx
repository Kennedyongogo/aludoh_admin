import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  Drawer,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Skeleton,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  CloseRounded,
  DeleteOutlineRounded,
  EmailRounded,
  PhoneRounded,
  SaveRounded,
  WhatsApp,
} from "@mui/icons-material";
import Swal from "sweetalert2";
import { adminRequest } from "../../utils/adminApi";
import { PriorityChip, StatusChip } from "./Badges";
import { GREEN, PRIORITIES, STATUSES, formatDate } from "./constants";

const toForm = (request) => ({
  status: request?.status || "pending",
  priority: request?.priority || "normal",
  handled_by: request?.handled_by || "",
  admin_response: request?.admin_response || "",
  admin_notes: request?.admin_notes || "",
});

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "12px",
    "&.Mui-focused fieldset": { borderColor: GREEN.mid },
  },
  "& .MuiInputLabel-root.Mui-focused": { color: GREEN.main },
};

function Section({ title, children }) {
  return (
    <Box sx={{ mb: 3 }}>
      <Typography
        sx={{
          fontSize: "0.72rem",
          fontWeight: 700,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: GREEN.mid,
          mb: 1.25,
        }}
      >
        {title}
      </Typography>
      {children}
    </Box>
  );
}

function Detail({ label, value, multiline = false }) {
  if (!value) return null;
  return (
    <Box sx={{ mb: 1.25 }}>
      <Typography variant="caption" sx={{ color: "text.secondary" }}>
        {label}
      </Typography>
      <Typography
        sx={{
          color: GREEN.ink,
          fontSize: "0.92rem",
          whiteSpace: multiline ? "pre-line" : "normal",
          wordBreak: "break-word",
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}

function ContactButton({ href, icon, label }) {
  return (
    <Tooltip title={label}>
      <IconButton
        component="a"
        href={href}
        target={href.startsWith("http") ? "_blank" : undefined}
        rel="noopener noreferrer"
        aria-label={label}
        sx={{
          color: GREEN.main,
          border: "1px solid rgba(45, 106, 79, 0.25)",
          borderRadius: "10px",
          width: 36,
          height: 36,
          "&:hover": { bgcolor: "rgba(45, 106, 79, 0.08)" },
        }}
      >
        {icon}
      </IconButton>
    </Tooltip>
  );
}

export default function ServiceRequestDrawer({ requestId, admins, onClose, onSaved, onDeleted }) {
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [form, setForm] = useState(toForm(null));
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    if (!requestId) return undefined;
    let cancelled = false;
    setLoading(true);
    setLoadError("");
    setSaveError("");
    setRequest(null);

    adminRequest(`/api/service-requests/${requestId}`)
      .then(({ data }) => {
        if (cancelled) return;
        setRequest(data);
        setForm(toForm(data));
      })
      .catch((error) => !cancelled && setLoadError(error.message))
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [requestId]);

  const initial = useMemo(() => toForm(request), [request]);
  const dirty = Object.keys(form).some((key) => form[key] !== initial[key]);
  const change = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const save = async () => {
    const changes = Object.fromEntries(
      Object.keys(form)
        .filter((key) => form[key] !== initial[key])
        .map((key) => [key, form[key] === "" && key === "handled_by" ? null : form[key]])
    );
    setSaving(true);
    setSaveError("");
    try {
      const { data } = await adminRequest(`/api/service-requests/${request.id}`, {
        method: "PUT",
        body: changes,
      });
      setRequest(data);
      setForm(toForm(data));
      onSaved(data);
      Swal.fire({
        icon: "success",
        title: "Request updated",
        iconColor: GREEN.mid,
        showConfirmButton: false,
        timer: 1600,
        customClass: { container: "swal-container-class" },
      });
    } catch (error) {
      setSaveError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    const { isConfirmed } = await Swal.fire({
      icon: "warning",
      title: "Delete this request?",
      text: `${request.reference} from ${request.name} will be permanently removed.`,
      showCancelButton: true,
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#B42318",
      cancelButtonColor: "#6B7280",
      reverseButtons: true,
      customClass: { container: "swal-container-class" },
    });
    if (!isConfirmed) return;

    try {
      await adminRequest(`/api/service-requests/${request.id}`, { method: "DELETE" });
      onDeleted(request.id);
    } catch (error) {
      setSaveError(error.message);
    }
  };

  const whatsappNumber = request?.phone?.replace(/\D/g, "");

  return (
    <Drawer
      anchor="right"
      open={Boolean(requestId)}
      onClose={onClose}
      PaperProps={{ sx: { width: { xs: "100%", sm: 540 }, bgcolor: "#FCFCFA" } }}
    >
      <Box
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 1,
          display: "flex",
          alignItems: "flex-start",
          gap: 1.5,
          px: { xs: 2, sm: 3 },
          py: 2,
          bgcolor: "#fff",
          borderBottom: "1px solid rgba(45, 106, 79, 0.12)",
        }}
      >
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          {request ? (
            <>
              <Typography sx={{ fontWeight: 700, color: GREEN.deep, letterSpacing: "0.03em" }}>
                {request.reference}
              </Typography>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 0.75 }}>
                <StatusChip status={request.status} />
                <PriorityChip priority={request.priority} />
              </Box>
            </>
          ) : (
            <Skeleton width={160} height={28} />
          )}
        </Box>
        <IconButton onClick={onClose} aria-label="Close details">
          <CloseRounded />
        </IconButton>
      </Box>

      <Box sx={{ px: { xs: 2, sm: 3 }, py: 3, flexGrow: 1 }}>
        {loading && (
          <Box>
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} height={i % 3 === 0 ? 24 : 48} sx={{ mb: 1 }} />
            ))}
          </Box>
        )}

        {loadError && <Alert severity="error">{loadError}</Alert>}

        {request && !loading && (
          <>
            <Section title="Client">
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                <Typography sx={{ fontWeight: 700, fontSize: "1.05rem", color: GREEN.ink, flexGrow: 1 }}>
                  {request.name}
                </Typography>
                <ContactButton href={`tel:${request.phone}`} icon={<PhoneRounded fontSize="small" />} label={`Call ${request.phone}`} />
                <ContactButton href={`https://wa.me/${whatsappNumber}`} icon={<WhatsApp fontSize="small" />} label="WhatsApp" />
                {request.email && (
                  <ContactButton
                    href={`mailto:${request.email}?subject=${encodeURIComponent(`Your request ${request.reference}`)}`}
                    icon={<EmailRounded fontSize="small" />}
                    label={`Email ${request.email}`}
                  />
                )}
              </Box>
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, columnGap: 2 }}>
                <Detail label="Phone" value={request.phone} />
                <Detail label="Email" value={request.email} />
                <Detail label="Location" value={request.location} />
                <Detail label="Organization" value={request.organization} />
              </Box>
            </Section>

            <Section title="Request">
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, columnGap: 2 }}>
                <Detail label="Service" value={request.service} />
                <Detail label="Submitted" value={formatDate(request.createdAt)} />
                <Detail label="Farm size" value={request.farm_size} />
                <Detail label="Crop" value={request.crop} />
                <Detail label="Current farming method" value={request.farming_method} />
                <Detail label="Service required" value={request.service_required} />
              </Box>
              <Detail label="Additional information" value={request.message} multiline />
            </Section>

            <Divider sx={{ mb: 3 }} />

            <Section title="Manage">
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2, mb: 2 }}>
                <FormControl fullWidth size="small" sx={fieldSx}>
                  <InputLabel>Status</InputLabel>
                  <Select label="Status" value={form.status} onChange={change("status")}>
                    {STATUSES.map((s) => (
                      <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl fullWidth size="small" sx={fieldSx}>
                  <InputLabel>Priority</InputLabel>
                  <Select label="Priority" value={form.priority} onChange={change("priority")}>
                    {PRIORITIES.map((p) => (
                      <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl fullWidth size="small" sx={{ ...fieldSx, gridColumn: "1 / -1" }}>
                  <InputLabel>Handled by</InputLabel>
                  <Select label="Handled by" value={form.handled_by} onChange={change("handled_by")}>
                    <MenuItem value="">
                      <em>Unassigned</em>
                    </MenuItem>
                    {admins.map((admin) => (
                      <MenuItem key={admin.id} value={admin.id}>
                        {admin.name} · {admin.email}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              <TextField
                fullWidth
                multiline
                minRows={3}
                label="Response to client"
                value={form.admin_response}
                onChange={change("admin_response")}
                helperText={
                  request.responded_at
                    ? `Visible when the client tracks their request · last updated ${formatDate(request.responded_at)}`
                    : "Visible when the client tracks their request"
                }
                sx={{ ...fieldSx, mb: 2 }}
              />
              <TextField
                fullWidth
                multiline
                minRows={2}
                label="Internal notes"
                value={form.admin_notes}
                onChange={change("admin_notes")}
                helperText="Only visible to admins"
                sx={fieldSx}
              />

              {request.resolved_at && (
                <Typography variant="body2" sx={{ mt: 2, color: GREEN.main, fontWeight: 600 }}>
                  Resolved on {formatDate(request.resolved_at)}
                </Typography>
              )}
              {saveError && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {saveError}
                </Alert>
              )}
            </Section>
          </>
        )}
      </Box>

      {request && !loading && (
        <Box
          sx={{
            position: "sticky",
            bottom: 0,
            display: "flex",
            gap: 1.5,
            alignItems: "center",
            px: { xs: 2, sm: 3 },
            py: 1.75,
            bgcolor: "#fff",
            borderTop: "1px solid rgba(45, 106, 79, 0.12)",
          }}
        >
          <Button
            onClick={remove}
            color="error"
            startIcon={<DeleteOutlineRounded />}
            sx={{ textTransform: "none", fontWeight: 600, borderRadius: "10px" }}
          >
            Delete
          </Button>
          <Box sx={{ flexGrow: 1 }} />
          {dirty && (
            <Button
              onClick={() => setForm(initial)}
              disabled={saving}
              sx={{ textTransform: "none", color: "text.secondary", borderRadius: "10px" }}
            >
              Discard
            </Button>
          )}
          <Button
            variant="contained"
            onClick={save}
            disabled={!dirty || saving}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveRounded />}
            sx={{
              textTransform: "none",
              fontWeight: 700,
              borderRadius: "10px",
              px: 2.5,
              bgcolor: GREEN.main,
              "&:hover": { bgcolor: GREEN.deep },
            }}
          >
            {saving ? "Saving..." : "Save changes"}
          </Button>
        </Box>
      )}
    </Drawer>
  );
}
