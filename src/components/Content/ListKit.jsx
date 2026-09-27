import React, { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  ClearRounded,
  DeleteOutlineRounded,
  EditRounded,
  ImageRounded,
  InboxRounded,
  SearchRounded,
  StarRounded,
  VisibilityRounded,
} from "@mui/icons-material";
import { GREEN, ROWS_PER_PAGE_OPTIONS, mediaUrl } from "./constants";

export const filterSx = {
  minWidth: { xs: "100%", sm: 160 },
  "& .MuiOutlinedInput-root": {
    borderRadius: "12px",
    bgcolor: "#fff",
    "&.Mui-focused fieldset": { borderColor: GREEN.mid },
  },
  "& .MuiInputLabel-root.Mui-focused": { color: GREEN.main },
};

export const primaryButtonSx = {
  flexShrink: 0,
  textTransform: "none",
  fontWeight: 700,
  borderRadius: "12px",
  px: 2.25,
  bgcolor: GREEN.main,
  boxShadow: "0 6px 16px rgba(45, 106, 79, 0.25)",
  "&:hover": { bgcolor: GREEN.deep, boxShadow: "0 6px 16px rgba(45, 106, 79, 0.3)" },
};

export const outlinedButtonSx = {
  flexShrink: 0,
  textTransform: "none",
  fontWeight: 600,
  borderRadius: "12px",
  color: GREEN.main,
  borderColor: "rgba(45, 106, 79, 0.35)",
  bgcolor: "#fff",
  "&:hover": { borderColor: GREEN.main, bgcolor: "#fff" },
};

export function PageHeader({ title, subtitle, actions }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3, flexWrap: "wrap" }}>
      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
        <Typography
          component="h1"
          sx={{ fontWeight: 700, fontSize: { xs: "1.45rem", md: "1.85rem" }, color: GREEN.deep }}
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography sx={{ color: "text.secondary", fontSize: "0.82rem" }}>{subtitle}</Typography>
        )}
      </Box>
      {actions && <Box sx={{ display: "flex", gap: 1, flexShrink: 0 }}>{actions}</Box>}
    </Box>
  );
}

export function SearchField({ value, onChange, placeholder }) {
  return (
    <TextField
      size="small"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      sx={{ ...filterSx, flex: "1 1 280px" }}
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <SearchRounded sx={{ color: "text.secondary" }} />
            </InputAdornment>
          ),
          endAdornment: value && (
            <InputAdornment position="end">
              <IconButton size="small" onClick={() => onChange("")} aria-label="Clear search">
                <ClearRounded fontSize="small" />
              </IconButton>
            </InputAdornment>
          ),
        },
      }}
    />
  );
}

export function FilterSelect({ label, value, onChange, options, anyLabel }) {
  return (
    <FormControl size="small" sx={filterSx}>
      <InputLabel>{label}</InputLabel>
      <Select label={label} value={value} onChange={(e) => onChange(e.target.value)}>
        <MenuItem value="">{anyLabel || `Any ${label.toLowerCase()}`}</MenuItem>
        {options.map((o) => (
          <MenuItem key={o.value} value={o.value}>
            {o.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

export function Toolbar({ children }) {
  return <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, mb: 2.5, alignItems: "center" }}>{children}</Box>;
}

export function ClearFiltersButton({ onClick }) {
  return (
    <Button onClick={onClick} sx={{ textTransform: "none", color: GREEN.main, fontWeight: 600 }}>
      Clear filters
    </Button>
  );
}

export function ErrorBanner({ error, onRetry }) {
  if (!error) return null;
  return (
    <Alert
      severity="error"
      sx={{ mb: 2, borderRadius: "12px" }}
      action={
        onRetry && (
          <Button color="inherit" size="small" onClick={onRetry}>
            Retry
          </Button>
        )
      }
    >
      {error}
    </Alert>
  );
}

export function Pill({ option, variant, icon, sx }) {
  if (!option) return null;
  const outlined = variant === "outlined";
  return (
    <Chip
      size="small"
      icon={icon}
      label={option.short || option.label}
      variant={outlined ? "outlined" : "filled"}
      sx={{
        bgcolor: outlined ? "transparent" : option.bg,
        color: option.fg,
        borderColor: outlined ? option.bg : undefined,
        fontWeight: 700,
        fontSize: "0.72rem",
        height: 24,
        borderRadius: "8px",
        "& .MuiChip-icon": { color: option.fg, fontSize: 16, ml: "4px" },
        ...sx,
      }}
    />
  );
}

export function FeaturedBadge({ sx }) {
  return (
    <Tooltip title="Featured">
      <StarRounded sx={{ fontSize: 18, color: "#E0A100", verticalAlign: "middle", ...sx }} />
    </Tooltip>
  );
}

export function Thumb({ src, alt = "", size = 48, icon, radius = "12px", sx }) {
  const [failed, setFailed] = useState(false);
  const url = mediaUrl(src);
  return (
    <Box
      sx={{
        width: size,
        height: size,
        flexShrink: 0,
        borderRadius: radius,
        overflow: "hidden",
        bgcolor: GREEN.mist,
        color: GREEN.mid,
        display: "grid",
        placeItems: "center",
        ...sx,
      }}
    >
      {url && !failed ? (
        <Box
          component="img"
          src={url}
          alt={alt}
          loading="lazy"
          onError={() => setFailed(true)}
          sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      ) : (
        icon || <ImageRounded sx={{ fontSize: size * 0.45 }} />
      )}
    </Box>
  );
}

export function Stars({ value, size = 16 }) {
  if (!value) {
    return (
      <Typography variant="caption" sx={{ color: "text.secondary" }}>
        No rating
      </Typography>
    );
  }
  return (
    <Box sx={{ display: "inline-flex", alignItems: "center" }} aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <StarRounded key={n} sx={{ fontSize: size, color: n <= value ? "#E0A100" : "rgba(0,0,0,0.15)" }} />
      ))}
    </Box>
  );
}

const actionSx = (color) => ({
  width: 34,
  height: 34,
  color,
  border: "1px solid transparent",
  "&:hover": { bgcolor: `${color}14`, borderColor: `${color}33` },
});

// Row actions; clicks never bubble up to the row or card they sit in
export function ActionIcons({ onView, onEdit, onDelete, children, label = "item" }) {
  const stop = (handler) => (e) => {
    e.stopPropagation();
    handler();
  };
  return (
    <Box
      sx={{ display: "inline-flex", gap: 0.5, alignItems: "center" }}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      {children}
      {onView && (
        <Tooltip title="View">
          <IconButton size="small" aria-label={`View ${label}`} onClick={stop(onView)} sx={actionSx(GREEN.mid)}>
            <VisibilityRounded fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
      {onEdit && (
        <Tooltip title="Edit">
          <IconButton size="small" aria-label={`Edit ${label}`} onClick={stop(onEdit)} sx={actionSx("#1D4E89")}>
            <EditRounded fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
      {onDelete && (
        <Tooltip title="Delete">
          <IconButton size="small" aria-label={`Delete ${label}`} onClick={stop(onDelete)} sx={actionSx("#B42318")}>
            <DeleteOutlineRounded fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
}

export function EmptyState({ icon, title, text, action }) {
  return (
    <Box sx={{ textAlign: "center", py: 8, px: 2, bgcolor: "#fff" }}>
      {icon || <InboxRounded sx={{ fontSize: 48, color: GREEN.light, mb: 1 }} />}
      <Typography sx={{ fontWeight: 700, color: GREEN.deep }}>{title}</Typography>
      {text && (
        <Typography sx={{ color: "text.secondary", fontSize: "0.9rem", mb: action ? 2 : 0 }}>{text}</Typography>
      )}
      {action}
    </Box>
  );
}

/**
 * Table on desktop, stacked cards on mobile, with pagination underneath.
 * columns: [{ key, label, render(row), align, width, sx }]
 */
export function ResponsiveList({
  isDesktop,
  columns,
  rows,
  loading,
  renderCard,
  onRowClick,
  empty,
  count,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  minWidth = 860,
}) {
  const showSkeleton = loading && !rows.length;

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: "20px",
        border: "1px solid",
        overflow: "hidden",
        bgcolor: isDesktop ? "#fff" : "transparent",
        borderColor: isDesktop ? "rgba(45, 106, 79, 0.12)" : "transparent",
        opacity: loading && rows.length ? 0.6 : 1,
        transition: "opacity 0.2s ease",
      }}
    >
      {isDesktop ? (
        <TableContainer>
          <Table sx={{ minWidth }}>
            <TableHead>
              <TableRow
                sx={{
                  "& th": {
                    bgcolor: GREEN.cream,
                    color: GREEN.deep,
                    fontWeight: 700,
                    fontSize: "0.8rem",
                    whiteSpace: "nowrap",
                  },
                }}
              >
                {columns.map((col) => (
                  <TableCell key={col.key} align={col.align} sx={{ width: col.width }}>
                    {col.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {showSkeleton &&
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    {columns.map((col) => (
                      <TableCell key={col.key}>
                        <Skeleton />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              {rows.map((row) => (
                <TableRow
                  key={row.id}
                  hover={Boolean(onRowClick)}
                  tabIndex={onRowClick ? 0 : undefined}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  onKeyDown={onRowClick ? (e) => (e.key === "Enter" || e.key === " ") && onRowClick(row) : undefined}
                  sx={{
                    cursor: onRowClick ? "pointer" : "default",
                    "&:last-child td": { borderBottom: 0 },
                    "&:focus-visible": { outline: `2px solid ${GREEN.mid}`, outlineOffset: -2 },
                  }}
                >
                  {columns.map((col) => (
                    <TableCell key={col.key} align={col.align} sx={{ fontSize: "0.86rem", ...col.sx }}>
                      {col.render(row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Box>
          {showSkeleton &&
            [...Array(4)].map((_, i) => (
              <Skeleton key={i} variant="rounded" height={132} sx={{ mb: 1.5, borderRadius: "16px" }} />
            ))}
          {rows.map((row) => (
            <React.Fragment key={row.id}>{renderCard(row)}</React.Fragment>
          ))}
        </Box>
      )}

      {!loading && !rows.length && (
        <Box sx={{ borderRadius: isDesktop ? 0 : "20px", overflow: "hidden" }}>{empty}</Box>
      )}

      {onPageChange && (
        <TablePagination
          component="div"
          count={count}
          page={count ? page : 0}
          onPageChange={(_, next) => onPageChange(next)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => onRowsPerPageChange(parseInt(e.target.value, 10))}
          rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
          labelRowsPerPage={isDesktop ? "Rows per page" : "Rows"}
          sx={{
            bgcolor: "#fff",
            mt: !isDesktop ? 1.5 : 0,
            borderTop: isDesktop ? "1px solid rgba(45, 106, 79, 0.12)" : "none",
            borderRadius: isDesktop ? 0 : "16px",
            "& .MuiTablePagination-toolbar": { px: { xs: 1, sm: 2 } },
          }}
        />
      )}
    </Paper>
  );
}

// Mobile card; when onClick is given, tapping the card opens the item
export function ContentCard({ media, title, subtitle, body, chips, meta, actions, onClick }) {
  return (
    <Box
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (e) => (e.key === "Enter" || e.key === " ") && onClick() : undefined}
      sx={{
        p: 1.75,
        mb: 1.5,
        cursor: onClick ? "pointer" : "default",
        borderRadius: "16px 16px 16px 6px",
        border: "1px solid rgba(45, 106, 79, 0.12)",
        bgcolor: "#fff",
        transition: "border-color 0.2s ease",
        "&:hover": onClick ? { borderColor: GREEN.mid } : undefined,
        "&:focus-visible": { outline: `2px solid ${GREEN.mid}`, outlineOffset: 2 },
      }}
    >
      <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
        {media}
        {(title || subtitle) && (
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography sx={{ fontWeight: 700, color: GREEN.ink, lineHeight: 1.3 }}>{title}</Typography>
            {subtitle && (
              <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.25 }}>
                {subtitle}
              </Typography>
            )}
          </Box>
        )}
      </Box>
      {body && <Box sx={{ mt: 1.25 }}>{body}</Box>}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          flexWrap: "wrap",
          mt: 1.25,
          pt: 1.25,
          borderTop: "1px dashed rgba(45, 106, 79, 0.15)",
        }}
      >
        {chips}
        {meta && (
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            {meta}
          </Typography>
        )}
        <Box sx={{ ml: "auto" }}>{actions}</Box>
      </Box>
    </Box>
  );
}
