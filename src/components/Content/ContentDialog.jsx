import React from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  Grow,
  IconButton,
  Skeleton,
  Tooltip,
  Typography,
  useMediaQuery,
} from "@mui/material";
import {
  CloseRounded,
  DeleteOutlineRounded,
  EditRounded,
  OpenInNewRounded,
  SaveRounded,
  VisibilityRounded,
} from "@mui/icons-material";
import { GREEN, mediaUrl } from "./constants";

export function ModeSwitch({ mode, onChange }) {
  const options = [
    { value: "view", label: "Preview", icon: <VisibilityRounded sx={{ fontSize: 16 }} /> },
    { value: "edit", label: "Edit", icon: <EditRounded sx={{ fontSize: 16 }} /> },
  ];
  return (
    <Box
      role="tablist"
      sx={{
        display: "inline-flex",
        p: 0.4,
        borderRadius: "12px",
        bgcolor: "rgba(255,255,255,0.14)",
        border: "1px solid rgba(255,255,255,0.18)",
      }}
    >
      {options.map((o) => {
        const active = mode === o.value;
        return (
          <Box
            key={o.value}
            component="button"
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => !active && onChange(o.value)}
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 0.6,
              px: 1.4,
              py: 0.6,
              border: 0,
              borderRadius: "9px",
              cursor: active ? "default" : "pointer",
              font: "inherit",
              fontSize: "0.8rem",
              fontWeight: 700,
              color: active ? GREEN.deep : "rgba(255,255,255,0.85)",
              bgcolor: active ? "#fff" : "transparent",
              transition: "all 0.2s ease",
              "&:hover": { color: active ? GREEN.deep : "#fff" },
            }}
          >
            {o.icon}
            {o.label}
          </Box>
        );
      })}
    </Box>
  );
}

/**
 * Shared shell for the content dialogs: gradient (or photo) header, scrolling body,
 * and a footer that switches between view actions and save/discard.
 */
export default function ContentDialog({
  open,
  onClose,
  eyebrow,
  title,
  chips,
  cover,
  loading,
  unavailable,
  mode,
  onModeChange,
  isNew,
  siteUrl,
  children,
  error,
  dirty,
  saving,
  onSave,
  onDiscard,
  onDelete,
  saveLabel = "Save changes",
  viewActions,
  maxWidth = "md",
}) {
  const fullScreen = useMediaQuery("(max-width:699px)");
  const coverUrl = mediaUrl(cover);
  const editing = mode === "edit";

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth={maxWidth}
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
      aria-labelledby="content-dialog-title"
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
        {coverUrl && !editing && (
          <Box
            aria-hidden
            sx={{
              position: "absolute",
              inset: 0,
              backgroundImage: `linear-gradient(120deg, rgba(27,67,50,0.94) 0%, rgba(27,67,50,0.78) 45%, rgba(27,67,50,0.35) 100%), url("${coverUrl}")`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
        )}
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
              {eyebrow}
            </Typography>
            {loading ? (
              <>
                <Skeleton sx={{ bgcolor: "rgba(255,255,255,0.18)", mt: 1 }} width="55%" height={40} />
                <Skeleton sx={{ bgcolor: "rgba(255,255,255,0.18)" }} width="35%" height={28} />
              </>
            ) : (
              <>
                <Typography
                  id="content-dialog-title"
                  sx={{ mt: 1, fontWeight: 800, fontSize: { xs: "1.3rem", sm: "1.6rem" }, lineHeight: 1.2 }}
                >
                  {title}
                </Typography>
                {chips && (
                  <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 1, mt: 1.5 }}>
                    {chips}
                  </Box>
                )}
              </>
            )}
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexShrink: 0 }}>
            {siteUrl && !isNew && (
              <Tooltip title="Open on website">
                <IconButton
                  component="a"
                  href={siteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ color: "#fff", bgcolor: "rgba(255,255,255,0.12)", "&:hover": { bgcolor: "rgba(255,255,255,0.22)" } }}
                >
                  <OpenInNewRounded fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title="Close">
              <IconButton
                onClick={onClose}
                aria-label="Close"
                sx={{ color: "#fff", bgcolor: "rgba(255,255,255,0.12)", "&:hover": { bgcolor: "rgba(255,255,255,0.22)" } }}
              >
                <CloseRounded />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {!isNew && onModeChange && !loading && !unavailable && (
          <Box sx={{ position: "relative", mt: 2 }}>
            <ModeSwitch mode={mode} onChange={onModeChange} />
          </Box>
        )}
      </Box>

      <Box sx={{ flex: 1, overflowY: "auto", px: { xs: 2, sm: 3.5 }, py: { xs: 2, sm: 3 } }}>
        {loading ? (
          <Box sx={{ display: "grid", gap: 2 }}>
            <Skeleton variant="rounded" height={140} sx={{ borderRadius: "18px" }} />
            <Skeleton variant="rounded" height={220} sx={{ borderRadius: "18px" }} />
          </Box>
        ) : (
          children
        )}
      </Box>

      {error && !loading && (
        <Alert severity="error" sx={{ borderRadius: 0, flexShrink: 0, px: { xs: 2, sm: 3.5 } }}>
          {error}
        </Alert>
      )}

      {!loading && !unavailable && (
        <Box
          sx={{
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            gap: 1.25,
            px: { xs: 2, sm: 3.5 },
            py: 1.5,
            bgcolor: "#fff",
            borderTop: "1px solid rgba(45, 106, 79, 0.12)",
            flexWrap: "wrap",
          }}
        >
          {onDelete && !isNew && (
            <Button
              onClick={onDelete}
              color="error"
              startIcon={<DeleteOutlineRounded />}
              sx={{ textTransform: "none", fontWeight: 600, borderRadius: "10px" }}
            >
              Delete
            </Button>
          )}
          <Box sx={{ flexGrow: 1 }} />
          {editing ? (
            <>
              {dirty && !isNew && (
                <>
                  <Typography
                    sx={{ display: { xs: "none", sm: "block" }, fontSize: "0.8rem", color: "#8A5A00", fontWeight: 600 }}
                  >
                    Unsaved changes
                  </Typography>
                  <Button
                    onClick={onDiscard}
                    disabled={saving}
                    sx={{ textTransform: "none", color: "text.secondary", borderRadius: "10px" }}
                  >
                    Discard
                  </Button>
                </>
              )}
              {isNew && (
                <Button onClick={onClose} disabled={saving} sx={{ textTransform: "none", color: "text.secondary", borderRadius: "10px" }}>
                  Cancel
                </Button>
              )}
              <Button
                variant="contained"
                onClick={onSave}
                disabled={(!dirty && !isNew) || saving}
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
                {saving ? "Saving..." : saveLabel}
              </Button>
            </>
          ) : (
            <>
              {viewActions}
              <Button
                variant="contained"
                onClick={() => onModeChange?.("edit")}
                startIcon={<EditRounded />}
                sx={{
                  textTransform: "none",
                  fontWeight: 700,
                  borderRadius: "12px",
                  px: 2.5,
                  py: 1,
                  boxShadow: "none",
                  bgcolor: GREEN.main,
                  "&:hover": { bgcolor: GREEN.deep, boxShadow: "none" },
                }}
              >
                Edit
              </Button>
            </>
          )}
        </Box>
      )}
    </Dialog>
  );
}
