import React from "react";
import { Chip } from "@mui/material";
import { findGeoStatus, findPriority, findStatus } from "./constants";

const chipSx = (option) => ({
  bgcolor: option.bg,
  color: option.fg,
  fontWeight: 700,
  fontSize: "0.72rem",
  height: 24,
  borderRadius: "8px",
});

export function StatusChip({ status, sx }) {
  const option = findStatus(status);
  return <Chip label={option.label} size="small" sx={{ ...chipSx(option), ...sx }} />;
}

export function GeoChip({ status, sx }) {
  const option = findGeoStatus(status);
  return <Chip label={option.label} size="small" sx={{ ...chipSx(option), ...sx }} />;
}

export function PriorityChip({ priority, sx }) {
  const option = findPriority(priority);
  return (
    <Chip
      label={option.label}
      size="small"
      variant="outlined"
      sx={{ ...chipSx(option), bgcolor: "transparent", borderColor: option.bg, ...sx }}
    />
  );
}
