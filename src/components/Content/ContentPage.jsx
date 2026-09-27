import React from "react";
import { Alert, Box, Button, CircularProgress, IconButton, Skeleton, Tooltip, Typography } from "@mui/material";
import {
  ArrowBackRounded,
  DeleteOutlineRounded,
  EditRounded,
  OpenInNewRounded,
  SaveRounded,
} from "@mui/icons-material";
import { ModeSwitch } from "./ContentDialog";
import { GREEN, mediaUrl } from "./constants";

const solidButtonSx = {
  textTransform: "none",
  fontWeight: 700,
  borderRadius: "12px",
  px: 2.75,
  py: 1,
  boxShadow: "none",
  bgcolor: GREEN.main,
  "&:hover": { bgcolor: GREEN.deep, boxShadow: "none" },
};

/**
 * Full-page counterpart of ContentDialog: back link, photo header, body,
 * and an action bar that stays in view at the bottom of the screen.
 */
export default function ContentPage({
  backLabel,
  onBack,
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
}) {
  const coverUrl = mediaUrl(cover);
  const editing = mode === "edit";

  return (
    <Box sx={{ maxWidth: 1100, mx: "auto" }}>
      <Button
        onClick={onBack}
        startIcon={<ArrowBackRounded />}
        sx={{ mb: 1.5, ml: -1, textTransform: "none", fontWeight: 600, color: GREEN.main, borderRadius: "10px" }}
      >
        {backLabel}
      </Button>

      <Box
        sx={{
          position: "relative",
          overflow: "hidden",
          borderRadius: { xs: "20px", sm: "26px" },
          px: { xs: 2.5, sm: 4 },
          pt: { xs: 2.5, sm: 3.5 },
          pb: { xs: 2.5, sm: 3 },
          mb: 3,
          color: "#fff",
          background: `linear-gradient(135deg, ${GREEN.deep} 0%, ${GREEN.main} 60%, ${GREEN.mid} 100%)`,
          boxShadow: "0 18px 40px rgba(27, 67, 50, 0.18)",
        }}
      >
        {coverUrl && (
          <Box
            aria-hidden
            sx={{
              position: "absolute",
              inset: 0,
              backgroundImage: `linear-gradient(120deg, rgba(27,67,50,0.95) 0%, rgba(27,67,50,0.8) 45%, rgba(27,67,50,0.35) 100%), url("${coverUrl}")`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
        )}
        <Box
          aria-hidden
          sx={{
            position: "absolute",
            width: 320,
            height: 320,
            top: -150,
            right: -80,
            borderRadius: "50%",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            boxShadow: "inset 0 0 0 40px rgba(255, 255, 255, 0.03)",
          }}
        />

        <Box sx={{ position: "relative", display: "flex", alignItems: "flex-start", gap: 2 }}>
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography
              sx={{
                fontSize: "0.72rem",
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
                <Skeleton sx={{ bgcolor: "rgba(255,255,255,0.18)", mt: 1 }} width="50%" height={46} />
                <Skeleton sx={{ bgcolor: "rgba(255,255,255,0.18)" }} width="30%" height={28} />
              </>
            ) : (
              <>
                <Typography
                  component="h1"
                  sx={{ mt: 1, fontWeight: 800, fontSize: { xs: "1.45rem", sm: "2rem" }, lineHeight: 1.2 }}
                >
                  {title}
                </Typography>
                {chips && (
                  <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 1, mt: 1.5 }}>{chips}</Box>
                )}
              </>
            )}
          </Box>
          {siteUrl && !isNew && (
            <Tooltip title="Open on website">
              <IconButton
                component="a"
                href={siteUrl}
                target="_blank"
                rel="noopener noreferrer"
                sx={{ flexShrink: 0, color: "#fff", bgcolor: "rgba(255,255,255,0.14)", "&:hover": { bgcolor: "rgba(255,255,255,0.24)" } }}
              >
                <OpenInNewRounded fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        {!isNew && onModeChange && !loading && !unavailable && (
          <Box sx={{ position: "relative", mt: 2.5 }}>
            <ModeSwitch mode={mode} onChange={onModeChange} />
          </Box>
        )}
      </Box>

      {loading ? (
        <Box sx={{ display: "grid", gap: 2 }}>
          <Skeleton variant="rounded" height={160} sx={{ borderRadius: "18px" }} />
          <Skeleton variant="rounded" height={260} sx={{ borderRadius: "18px" }} />
        </Box>
      ) : (
        children
      )}

      {!loading && !unavailable && (
        <Box
          sx={{
            position: "sticky",
            bottom: { xs: 82, md: 16 },
            zIndex: 4,
            mt: 3,
            borderRadius: "18px",
            overflow: "hidden",
            bgcolor: "#fff",
            border: "1px solid rgba(45, 106, 79, 0.14)",
            boxShadow: "0 12px 32px rgba(27, 67, 50, 0.14)",
          }}
        >
          {error && (
            <Alert severity="error" sx={{ borderRadius: 0 }}>
              {error}
            </Alert>
          )}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, px: { xs: 1.5, sm: 2.5 }, py: 1.5, flexWrap: "wrap" }}>
            {onDelete && !isNew && (
              <Button
                onClick={onDelete}
                color="error"
                aria-label="Delete"
                startIcon={<DeleteOutlineRounded />}
                sx={{
                  textTransform: "none",
                  fontWeight: 600,
                  borderRadius: "10px",
                  minWidth: 0,
                  "& .MuiButton-startIcon": { mr: { xs: 0, sm: 1 } },
                }}
              >
                <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
                  Delete
                </Box>
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
                  <Button onClick={onBack} disabled={saving} sx={{ textTransform: "none", color: "text.secondary", borderRadius: "10px" }}>
                    Cancel
                  </Button>
                )}
                <Button
                  variant="contained"
                  onClick={onSave}
                  disabled={(!dirty && !isNew) || saving}
                  startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveRounded />}
                  sx={solidButtonSx}
                >
                  {saving ? "Saving..." : saveLabel}
                </Button>
              </>
            ) : (
              <>
                {viewActions}
                <Button variant="contained" onClick={() => onModeChange?.("edit")} startIcon={<EditRounded />} sx={solidButtonSx}>
                  Edit
                </Button>
              </>
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
}
