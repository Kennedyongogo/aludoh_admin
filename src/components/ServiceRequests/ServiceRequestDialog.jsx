import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  FormControl,
  Grow,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Skeleton,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
} from "@mui/material";
import {
  AgricultureRounded,
  BusinessRounded,
  CloseRounded,
  DeleteOutlineRounded,
  EmailRounded,
  GrassRounded,
  PhoneRounded,
  SaveRounded,
  SquareFootRounded,
  TaskAltRounded,
  WhatsApp,
} from "@mui/icons-material";
import Swal from "sweetalert2";
import { adminRequest } from "../../utils/adminApi";
import { PriorityChip, StatusChip } from "./Badges";
import LocationInsight from "./LocationInsight";
import { GREEN, PRIORITIES, STATUSES, findPriority, findStatus, formatDate, timeAgo } from "./constants";

const toForm = (request) => ({
  status: request?.status || "pending",
  priority: request?.priority || "normal",
  handled_by: request?.handled_by || "",
  admin_response: request?.admin_response || "",
  admin_notes: request?.admin_notes || "",
});

const initials = (name = "") =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "12px",
    bgcolor: "#fff",
    "&.Mui-focused fieldset": { borderColor: GREEN.mid },
  },
  "& .MuiInputLabel-root.Mui-focused": { color: GREEN.main },
};

const cardSx = {
  bgcolor: "#fff",
  border: "1px solid rgba(45, 106, 79, 0.1)",
  borderRadius: "18px",
  p: { xs: 2, sm: 2.5 },
};

function SectionTitle({ children }) {
  return (
    <Typography
      sx={{
        fontSize: "0.7rem",
        fontWeight: 700,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: GREEN.mid,
        mb: 1.75,
      }}
    >
      {children}
    </Typography>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <Box sx={{ display: "flex", gap: 1.25, alignItems: "flex-start", minWidth: 0 }}>
      <Box
        sx={{
          width: 32,
          height: 32,
          flexShrink: 0,
          borderRadius: "10px",
          display: "grid",
          placeItems: "center",
          bgcolor: "#F1F7F3",
          color: GREEN.main,
        }}
      >
        <Icon sx={{ fontSize: 17 }} />
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontSize: "0.72rem", color: "text.secondary", lineHeight: 1.4 }}>{label}</Typography>
        <Typography sx={{ fontSize: "0.9rem", color: GREEN.ink, fontWeight: 500, wordBreak: "break-word" }}>
          {value}
        </Typography>
      </Box>
    </Box>
  );
}

function ContactButton({ href, icon, label }) {
  return (
    <Button
      component="a"
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel="noopener noreferrer"
      startIcon={icon}
      size="small"
      sx={{
        textTransform: "none",
        fontWeight: 600,
        borderRadius: "10px",
        px: 1.5,
        color: GREEN.main,
        border: "1px solid rgba(45, 106, 79, 0.25)",
      }}
    >
      {label}
    </Button>
  );
}

function Dot({ color }) {
  return <Box component="span" sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: color, flexShrink: 0 }} />;
}

function OptionLabel({ option }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <Dot color={option.fg} />
      {option.label}
    </Box>
  );
}

function Timeline({ request }) {
  const events = [
    { label: "Submitted", at: request.createdAt },
    { label: "Responded", at: request.responded_at },
    { label: request.status === "cancelled" ? "Cancelled" : "Resolved", at: request.resolved_at },
  ].filter((e) => e.at);

  return (
    <Box>
      {events.map((event, i) => (
        <Box key={event.label} sx={{ display: "flex", gap: 1.5 }}>
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <Box
              sx={{
                width: 12,
                height: 12,
                mt: 0.5,
                borderRadius: "50%",
                border: `3px solid ${i === events.length - 1 ? GREEN.light : GREEN.mist}`,
                bgcolor: "#fff",
              }}
            />
            {i < events.length - 1 && <Box sx={{ width: 2, flexGrow: 1, bgcolor: GREEN.mist, my: 0.5 }} />}
          </Box>
          <Box sx={{ pb: i < events.length - 1 ? 1.75 : 0 }}>
            <Typography sx={{ fontSize: "0.85rem", fontWeight: 600, color: GREEN.ink }}>{event.label}</Typography>
            <Typography sx={{ fontSize: "0.75rem", color: "text.secondary" }}>{formatDate(event.at)}</Typography>
          </Box>
        </Box>
      ))}
    </Box>
  );
}

function LoadingState() {
  return (
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1.15fr 1fr" }, gap: 2.5 }}>
      {[0, 1].map((col) => (
        <Box key={col} sx={cardSx}>
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} height={i === 0 ? 20 : 44} width={i === 0 ? "35%" : "100%"} sx={{ mb: 1 }} />
          ))}
        </Box>
      ))}
    </Box>
  );
}

export default function ServiceRequestDialog({ requestId, admins, onClose, onSaved, onDeleted }) {
  const fullScreen = useMediaQuery((theme) => theme.breakpoints.down("sm"));
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

  // Location lookups only touch geo fields, so unsaved edits in the form are kept
  const handleLocationUpdated = useCallback(
    (data) => {
      setRequest(data);
      onSaved(data);
    },
    [onSaved]
  );

  const requestClose = async () => {
    if (saving) return;
    if (dirty) {
      const { isConfirmed } = await Swal.fire({
        icon: "question",
        title: "Discard your changes?",
        text: "You have unsaved changes to this request.",
        showCancelButton: true,
        confirmButtonText: "Discard",
        cancelButtonText: "Keep editing",
        confirmButtonColor: GREEN.main,
        cancelButtonColor: "#6B7280",
        reverseButtons: true,
      });
      if (!isConfirmed) return;
    }
    onClose();
  };

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
  const ready = request && !loading;

  return (
    <Dialog
      open={Boolean(requestId)}
      onClose={requestClose}
      fullWidth
      maxWidth="md"
      fullScreen={fullScreen}
      scroll="paper"
      // SweetAlert confirmations open on top of the dialog and need to take focus
      disableEnforceFocus
      slots={{ transition: Grow }}
      slotProps={{
        paper: {
          sx: {
            borderRadius: fullScreen ? 0 : "26px",
            overflow: "hidden",
            bgcolor: "#F7F8F5",
            boxShadow: "0 40px 90px rgba(15, 40, 28, 0.28)",
          },
        },
        backdrop: { sx: { bgcolor: "rgba(15, 30, 22, 0.45)", backdropFilter: "blur(4px)" } },
      }}
      aria-labelledby="service-request-title"
    >
      <Box
        sx={{
          position: "relative",
          flexShrink: 0,
          px: { xs: 2.5, sm: 3.5 },
          pt: { xs: 2.5, sm: 3 },
          pb: { xs: 2.5, sm: 3 },
          color: "#fff",
          overflow: "hidden",
          background: `linear-gradient(135deg, ${GREEN.deep} 0%, ${GREEN.main} 60%, ${GREEN.mid} 100%)`,
        }}
      >
        <Box
          aria-hidden
          sx={{
            position: "absolute",
            width: 260,
            height: 260,
            top: -120,
            right: -60,
            borderRadius: "50%",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            boxShadow: "inset 0 0 0 36px rgba(255, 255, 255, 0.03)",
          }}
        />

        <Box sx={{ position: "relative", display: "flex", alignItems: "flex-start", gap: 2 }}>
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography
              sx={{
                fontSize: "0.7rem",
                fontWeight: 700,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "rgba(255, 255, 255, 0.7)",
              }}
            >
              Service request
              {request && (
                <Box component="span" sx={{ ml: 1, color: "#fff", letterSpacing: "0.08em" }}>
                  · {request.reference}
                </Box>
              )}
            </Typography>

            {request ? (
              <>
                <Typography
                  id="service-request-title"
                  sx={{ mt: 1, fontWeight: 800, fontSize: { xs: "1.35rem", sm: "1.65rem" }, lineHeight: 1.2 }}
                >
                  {request.service}
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 1, mt: 1.5 }}>
                  <StatusChip status={request.status} />
                  <PriorityChip priority={request.priority} sx={{ bgcolor: "#fff" }} />
                  <Typography sx={{ fontSize: "0.8rem", color: "rgba(255, 255, 255, 0.8)", ml: 0.5 }}>
                    Submitted {timeAgo(request.createdAt)}
                  </Typography>
                </Box>
              </>
            ) : (
              <>
                <Skeleton sx={{ bgcolor: "rgba(255,255,255,0.18)", mt: 1 }} width="55%" height={40} />
                <Skeleton sx={{ bgcolor: "rgba(255,255,255,0.18)" }} width="35%" height={28} />
              </>
            )}
          </Box>

          <Tooltip title="Close">
            <IconButton
              onClick={requestClose}
              aria-label="Close details"
              sx={{
                color: "#fff",
                bgcolor: "rgba(255, 255, 255, 0.12)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                "&:hover": { bgcolor: "rgba(255, 255, 255, 0.12)" },
              }}
            >
              <CloseRounded />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Box sx={{ flex: "1 1 auto", overflowY: "auto", px: { xs: 2, sm: 3.5 }, py: { xs: 2, sm: 3 } }}>
        {loading && <LoadingState />}
        {loadError && <Alert severity="error" sx={{ borderRadius: "12px" }}>{loadError}</Alert>}

        {ready && (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1.15fr 1fr" },
              gap: 2.5,
              alignItems: "start",
            }}
          >
            <Box sx={{ display: "grid", gap: 2.5, minWidth: 0 }}>
              <Box sx={cardSx}>
                <SectionTitle>Client</SectionTitle>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.75, mb: 2 }}>
                  <Box
                    sx={{
                      width: 50,
                      height: 50,
                      flexShrink: 0,
                      borderRadius: "16px 16px 16px 6px",
                      display: "grid",
                      placeItems: "center",
                      fontWeight: 800,
                      fontSize: "1.05rem",
                      color: GREEN.deep,
                      background: `linear-gradient(135deg, ${GREEN.mist}, #EEF8F0)`,
                    }}
                  >
                    {initials(request.name)}
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: "1.08rem", color: GREEN.ink, lineHeight: 1.3 }}>
                      {request.name}
                    </Typography>
                    {request.organization && (
                      <Typography sx={{ fontSize: "0.83rem", color: "text.secondary" }}>{request.organization}</Typography>
                    )}
                  </Box>
                </Box>

                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2.25 }}>
                  <ContactButton href={`tel:${request.phone}`} icon={<PhoneRounded />} label="Call" />
                  <ContactButton href={`https://wa.me/${whatsappNumber}`} icon={<WhatsApp />} label="WhatsApp" />
                  {request.email && (
                    <ContactButton
                      href={`mailto:${request.email}?subject=${encodeURIComponent(`Your request ${request.reference}`)}`}
                      icon={<EmailRounded />}
                      label="Email"
                    />
                  )}
                </Box>

                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
                  <InfoRow icon={PhoneRounded} label="Phone" value={request.phone} />
                  <InfoRow icon={EmailRounded} label="Email" value={request.email} />
                  <InfoRow icon={BusinessRounded} label="Organization" value={request.organization} />
                </Box>
              </Box>

              <Box sx={cardSx}>
                <SectionTitle>Location</SectionTitle>
                <LocationInsight request={request} onUpdated={handleLocationUpdated} fieldSx={fieldSx} />
              </Box>

              <Box sx={cardSx}>
                <SectionTitle>Request details</SectionTitle>
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
                  <InfoRow icon={TaskAltRounded} label="Service required" value={request.service_required} />
                  <InfoRow icon={SquareFootRounded} label="Farm size" value={request.farm_size} />
                  <InfoRow icon={GrassRounded} label="Crop" value={request.crop} />
                  <InfoRow icon={AgricultureRounded} label="Current farming method" value={request.farming_method} />
                </Box>
                {request.message && (
                  <Box
                    sx={{
                      mt: 2.25,
                      p: 2,
                      borderRadius: "14px",
                      bgcolor: GREEN.cream,
                      borderLeft: `4px solid ${GREEN.light}`,
                    }}
                  >
                    <Typography sx={{ fontSize: "0.72rem", color: "text.secondary", mb: 0.5 }}>Message from client</Typography>
                    <Typography sx={{ fontSize: "0.9rem", color: GREEN.ink, whiteSpace: "pre-line", lineHeight: 1.65 }}>
                      {request.message}
                    </Typography>
                  </Box>
                )}
              </Box>

              <Box sx={cardSx}>
                <SectionTitle>Activity</SectionTitle>
                <Timeline request={request} />
              </Box>
            </Box>

            <Box sx={{ ...cardSx, position: { md: "sticky" }, top: 0 }}>
              <SectionTitle>Manage request</SectionTitle>
              <Box sx={{ display: "grid", gap: 2 }}>
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}>
                  <FormControl fullWidth size="small" sx={fieldSx}>
                    <InputLabel>Status</InputLabel>
                    <Select
                      label="Status"
                      value={form.status}
                      onChange={change("status")}
                      renderValue={(value) => <OptionLabel option={findStatus(value)} />}
                    >
                      {STATUSES.map((s) => (
                        <MenuItem key={s.value} value={s.value}>
                          <OptionLabel option={s} />
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl fullWidth size="small" sx={fieldSx}>
                    <InputLabel>Priority</InputLabel>
                    <Select
                      label="Priority"
                      value={form.priority}
                      onChange={change("priority")}
                      renderValue={(value) => <OptionLabel option={findPriority(value)} />}
                    >
                      {PRIORITIES.map((p) => (
                        <MenuItem key={p.value} value={p.value}>
                          <OptionLabel option={p} />
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>

                <FormControl fullWidth size="small" sx={fieldSx}>
                  <InputLabel shrink>Handled by</InputLabel>
                  <Select label="Handled by" notched displayEmpty value={form.handled_by} onChange={change("handled_by")}>
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

                <TextField
                  fullWidth
                  multiline
                  minRows={4}
                  label="Response to client"
                  placeholder="Write an update the client will see when tracking this request"
                  value={form.admin_response}
                  onChange={change("admin_response")}
                  helperText={
                    request.responded_at
                      ? `Visible to the client · last updated ${formatDate(request.responded_at)}`
                      : "Visible to the client when they track their request"
                  }
                  sx={fieldSx}
                />
                <TextField
                  fullWidth
                  multiline
                  minRows={3}
                  label="Internal notes"
                  value={form.admin_notes}
                  onChange={change("admin_notes")}
                  helperText="Only visible to admins"
                  sx={fieldSx}
                />
              </Box>

              {saveError && (
                <Alert severity="error" sx={{ mt: 2, borderRadius: "12px" }}>
                  {saveError}
                </Alert>
              )}
            </Box>
          </Box>
        )}
      </Box>

      {ready && (
        <Box
          sx={{
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            px: { xs: 2, sm: 3.5 },
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
            <>
              <Typography sx={{ display: { xs: "none", sm: "block" }, fontSize: "0.8rem", color: "#8A5A00", fontWeight: 600 }}>
                Unsaved changes
              </Typography>
              <Button
                onClick={() => setForm(initial)}
                disabled={saving}
                sx={{ textTransform: "none", color: "text.secondary", borderRadius: "10px" }}
              >
                Discard
              </Button>
            </>
          )}
          <Button
            variant="contained"
            onClick={save}
            disabled={!dirty || saving}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveRounded />}
            sx={{
              textTransform: "none",
              fontWeight: 700,
              borderRadius: "12px",
              px: 2.75,
              py: 1,
              boxShadow: "none",
              bgcolor: GREEN.main,
              "&:hover": { bgcolor: GREEN.deep, boxShadow: "none" },
            }}
          >
            {saving ? "Saving..." : "Save changes"}
          </Button>
        </Box>
      )}
    </Dialog>
  );
}
