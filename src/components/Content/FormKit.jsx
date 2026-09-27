import React, { useCallback, useRef, useState } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControlLabel,
  IconButton,
  MenuItem,
  Switch,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  AddRounded,
  AddPhotoAlternateRounded,
  ArrowDownwardRounded,
  ArrowUpwardRounded,
  ChevronLeftRounded,
  ChevronRightRounded,
  CloseRounded,
  CloudUploadRounded,
  DeleteOutlineRounded,
} from "@mui/icons-material";
import { uploadImages } from "../../utils/adminApi";
import { GREEN, mediaUrl } from "./constants";
import { toastError } from "./feedback";
import { Thumb } from "./ListKit";

export const fieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "12px",
    bgcolor: "#fff",
    "&.Mui-focused fieldset": { borderColor: GREEN.mid },
  },
  "& .MuiInputLabel-root.Mui-focused": { color: GREEN.main },
};

export const cardSx = {
  bgcolor: "#fff",
  border: "1px solid rgba(45, 106, 79, 0.1)",
  borderRadius: "18px",
  p: { xs: 2, sm: 2.5 },
};

export function SectionTitle({ children, action }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.75 }}>
      <Typography
        sx={{
          flexGrow: 1,
          fontSize: "0.7rem",
          fontWeight: 700,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: GREEN.mid,
        }}
      >
        {children}
      </Typography>
      {action}
    </Box>
  );
}

export function Section({ title, hint, action, children, sx }) {
  return (
    <Box sx={{ ...cardSx, mb: 2, ...sx }}>
      {title && <SectionTitle action={action}>{title}</SectionTitle>}
      {hint && (
        <Typography sx={{ fontSize: "0.8rem", color: "text.secondary", mt: -1, mb: 1.75 }}>{hint}</Typography>
      )}
      {children}
    </Box>
  );
}

export function FieldGrid({ children, columns = 2 }) {
  return (
    <Box
      sx={{
        display: "grid",
        gap: 2,
        gridTemplateColumns: { xs: "1fr", sm: `repeat(${columns}, minmax(0, 1fr))` },
        "& .span-all": { gridColumn: "1 / -1" },
      }}
    >
      {children}
    </Box>
  );
}

export function Field({ label, value, onChange, max, multiline, rows = 3, select, options, type, span, helper, required, placeholder, disabled, ...rest }) {
  const length = typeof value === "string" ? value.length : 0;
  return (
    <TextField
      label={label}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      size="small"
      fullWidth
      required={required}
      disabled={disabled}
      placeholder={placeholder}
      multiline={multiline}
      minRows={multiline ? rows : undefined}
      select={select}
      type={type}
      className={span ? "span-all" : undefined}
      helperText={helper || (max && length > max * 0.8 ? `${length}/${max}` : undefined)}
      error={Boolean(max && length > max)}
      slotProps={{ htmlInput: { maxLength: max ? max + 50 : undefined } }}
      sx={fieldSx}
      {...rest}
    >
      {select &&
        options.map((o) => (
          <MenuItem key={o.value} value={o.value}>
            {o.label}
          </MenuItem>
        ))}
    </TextField>
  );
}

export function SwitchRow({ label, description, checked, onChange, disabled }) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 2,
        p: 1.5,
        borderRadius: "14px",
        border: "1px solid rgba(45, 106, 79, 0.12)",
        bgcolor: checked ? "#F1F9F3" : "#fff",
        transition: "background-color 0.2s ease",
      }}
    >
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontWeight: 600, fontSize: "0.9rem", color: GREEN.ink }}>{label}</Typography>
        {description && (
          <Typography sx={{ fontSize: "0.78rem", color: "text.secondary" }}>{description}</Typography>
        )}
      </Box>
      <FormControlLabel
        sx={{ m: 0 }}
        label=""
        control={
          <Switch
            checked={Boolean(checked)}
            disabled={disabled}
            onChange={(e) => onChange(e.target.checked)}
            sx={{
              "& .MuiSwitch-switchBase.Mui-checked": { color: GREEN.main },
              "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { bgcolor: GREEN.light },
            }}
          />
        }
      />
    </Box>
  );
}

// Free-text tags: type and press Enter, click a chip's x to remove it
export function StringListField({ label, value = [], onChange, placeholder, max = 30, helper }) {
  const [draft, setDraft] = useState("");

  const add = () => {
    const items = draft
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean)
      .filter((s) => !value.includes(s));
    if (!items.length) return;
    onChange([...value, ...items].slice(0, max));
    setDraft("");
  };

  return (
    <Box>
      <Box sx={{ display: "flex", gap: 1 }}>
        <TextField
          size="small"
          fullWidth
          label={label}
          placeholder={placeholder}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          disabled={value.length >= max}
          helperText={helper || `Press Enter to add · ${value.length}/${max}`}
          sx={fieldSx}
        />
        <Button
          onClick={add}
          disabled={!draft.trim()}
          variant="outlined"
          sx={{ alignSelf: "flex-start", height: 40, minWidth: 0, px: 1.5, borderRadius: "12px", color: GREEN.main, borderColor: "rgba(45,106,79,0.35)" }}
          aria-label={`Add ${label}`}
        >
          <AddRounded />
        </Button>
      </Box>
      {value.length > 0 && (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mt: 1.25 }}>
          {value.map((item, i) => (
            <Chip
              key={`${item}-${i}`}
              label={item}
              onDelete={() => onChange(value.filter((_, idx) => idx !== i))}
              sx={{
                bgcolor: GREEN.mist,
                color: GREEN.deep,
                fontWeight: 600,
                borderRadius: "10px",
                maxWidth: "100%",
                "& .MuiChip-deleteIcon": { color: GREEN.mid, "&:hover": { color: GREEN.deep } },
              }}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}

const move = (list, from, to) => {
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
};

/**
 * Editable list of objects (benefits, steps, packages, FAQs...).
 * fields: [{ key, label, type: "text" | "multiline" | "select" | "switch" | "tags", options, span, max }]
 */
export function RepeaterField({ value = [], onChange, fields, newItem, itemTitle, addLabel = "Add item", max = 20, emptyText }) {
  const update = (index, key, fieldValue) =>
    onChange(value.map((item, i) => (i === index ? { ...item, [key]: fieldValue } : item)));

  return (
    <Box sx={{ display: "grid", gap: 1.5 }}>
      {!value.length && (
        <Typography sx={{ fontSize: "0.85rem", color: "text.secondary", textAlign: "center", py: 2, border: "1px dashed rgba(45,106,79,0.25)", borderRadius: "14px" }}>
          {emptyText || "Nothing added yet."}
        </Typography>
      )}
      {value.map((item, index) => (
        <Box
          key={index}
          sx={{ border: "1px solid rgba(45, 106, 79, 0.14)", borderRadius: "14px", p: 1.75, bgcolor: "#FBFCFA" }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
            <Box
              sx={{
                width: 24,
                height: 24,
                borderRadius: "8px",
                display: "grid",
                placeItems: "center",
                fontSize: "0.75rem",
                fontWeight: 800,
                bgcolor: GREEN.mist,
                color: GREEN.deep,
                flexShrink: 0,
              }}
            >
              {index + 1}
            </Box>
            <Typography noWrap sx={{ flex: 1, fontWeight: 600, fontSize: "0.88rem", color: GREEN.ink }}>
              {itemTitle?.(item, index) || `Item ${index + 1}`}
            </Typography>
            <Tooltip title="Move up">
              <span>
                <IconButton size="small" disabled={index === 0} onClick={() => onChange(move(value, index, index - 1))} aria-label="Move up">
                  <ArrowUpwardRounded fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Move down">
              <span>
                <IconButton size="small" disabled={index === value.length - 1} onClick={() => onChange(move(value, index, index + 1))} aria-label="Move down">
                  <ArrowDownwardRounded fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Remove">
              <IconButton size="small" onClick={() => onChange(value.filter((_, i) => i !== index))} aria-label="Remove" sx={{ color: "#B42318" }}>
                <DeleteOutlineRounded fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
          <FieldGrid>
            {fields.map((f) => {
              if (f.type === "switch") {
                return (
                  <Box key={f.key} className={f.span ? "span-all" : undefined}>
                    <SwitchRow label={f.label} description={f.description} checked={item[f.key]} onChange={(v) => update(index, f.key, v)} />
                  </Box>
                );
              }
              if (f.type === "tags") {
                return (
                  <Box key={f.key} className="span-all">
                    <StringListField label={f.label} value={item[f.key] || []} onChange={(v) => update(index, f.key, v)} placeholder={f.placeholder} max={f.maxItems || 20} />
                  </Box>
                );
              }
              return (
                <Field
                  key={f.key}
                  label={f.label}
                  value={item[f.key]}
                  onChange={(v) => update(index, f.key, v)}
                  multiline={f.type === "multiline"}
                  rows={2}
                  select={f.type === "select"}
                  options={f.options}
                  span={f.span || f.type === "multiline"}
                  max={f.max}
                  placeholder={f.placeholder}
                />
              );
            })}
          </FieldGrid>
        </Box>
      ))}
      {value.length < max && (
        <Button
          onClick={() => onChange([...value, { ...newItem }])}
          startIcon={<AddRounded />}
          sx={{
            justifySelf: "start",
            textTransform: "none",
            fontWeight: 700,
            borderRadius: "12px",
            color: GREEN.main,
            bgcolor: "#F1F9F3",
            px: 2,
            "&:hover": { bgcolor: GREEN.mist },
          }}
        >
          {addLabel}
        </Button>
      )}
    </Box>
  );
}

function useUploader(folder) {
  const [uploading, setUploading] = useState(false);
  const upload = async (files) => {
    if (!files?.length) return [];
    setUploading(true);
    try {
      return await uploadImages(folder, files);
    } catch (error) {
      toastError(error.message);
      return [];
    } finally {
      setUploading(false);
    }
  };
  return { uploading, upload };
}

export function ImageField({ label, value, onChange, folder, helper, aspect = "16 / 10" }) {
  const inputRef = useRef(null);
  const { uploading, upload } = useUploader(folder);
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = async (files) => {
    const [path] = await upload(files);
    if (path) onChange(path);
  };

  return (
    <Box>
      <Typography sx={{ fontSize: "0.8rem", fontWeight: 600, color: GREEN.ink, mb: 0.75 }}>{label}</Typography>
      <Box
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        sx={{
          position: "relative",
          aspectRatio: aspect,
          borderRadius: "14px",
          overflow: "hidden",
          border: "1.5px dashed",
          borderColor: dragOver ? GREEN.mid : "rgba(45, 106, 79, 0.3)",
          bgcolor: dragOver ? GREEN.mist : "#F6FAF7",
          display: "grid",
          placeItems: "center",
          transition: "all 0.2s ease",
        }}
      >
        {value ? (
          <>
            <Box component="img" src={mediaUrl(value)} alt={label} sx={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
            <Box sx={{ position: "absolute", top: 8, right: 8, display: "flex", gap: 0.75 }}>
              <Tooltip title="Replace">
                <IconButton size="small" onClick={() => inputRef.current?.click()} sx={{ bgcolor: "rgba(255,255,255,0.92)", "&:hover": { bgcolor: "#fff" } }}>
                  <CloudUploadRounded fontSize="small" sx={{ color: GREEN.main }} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Remove">
                <IconButton size="small" onClick={() => onChange("")} sx={{ bgcolor: "rgba(255,255,255,0.92)", "&:hover": { bgcolor: "#fff" } }}>
                  <CloseRounded fontSize="small" sx={{ color: "#B42318" }} />
                </IconButton>
              </Tooltip>
            </Box>
          </>
        ) : (
          <Box sx={{ textAlign: "center", px: 2 }}>
            <AddPhotoAlternateRounded sx={{ fontSize: 34, color: GREEN.light }} />
            <Typography sx={{ fontSize: "0.82rem", color: "text.secondary", mb: 1 }}>Drop an image or</Typography>
            <Button
              size="small"
              variant="outlined"
              onClick={() => inputRef.current?.click()}
              sx={{ textTransform: "none", borderRadius: "10px", color: GREEN.main, borderColor: "rgba(45,106,79,0.35)", bgcolor: "#fff" }}
            >
              Choose file
            </Button>
          </Box>
        )}
        {uploading && (
          <Box sx={{ position: "absolute", inset: 0, bgcolor: "rgba(255,255,255,0.75)", display: "grid", placeItems: "center" }}>
            <CircularProgress size={28} sx={{ color: GREEN.main }} />
          </Box>
        )}
      </Box>
      {helper && <Typography sx={{ fontSize: "0.75rem", color: "text.secondary", mt: 0.75 }}>{helper}</Typography>}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        hidden
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </Box>
  );
}

// value: [{ url, caption }]
export function GalleryField({ value = [], onChange, folder, max = 12, captions = true }) {
  const inputRef = useRef(null);
  const { uploading, upload } = useUploader(folder);

  const handleFiles = async (files) => {
    const room = max - value.length;
    const paths = await upload(Array.from(files).slice(0, room));
    if (paths.length) onChange([...value, ...paths.map((url) => ({ url, caption: "" }))]);
  };

  return (
    <Box>
      <Box
        sx={{
          display: "grid",
          gap: 1.5,
          gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", sm: "repeat(3, minmax(0, 1fr))" },
        }}
      >
        {value.map((item, index) => (
          <Box key={`${item.url}-${index}`} sx={{ border: "1px solid rgba(45,106,79,0.14)", borderRadius: "14px", overflow: "hidden", bgcolor: "#fff" }}>
            <Box sx={{ position: "relative" }}>
              <Thumb src={item.url} size="100%" radius={0} sx={{ aspectRatio: "4 / 3", height: "auto" }} />
              <Box sx={{ position: "absolute", top: 6, right: 6, display: "flex", gap: 0.5 }}>
                <IconButton size="small" disabled={index === 0} onClick={() => onChange(move(value, index, index - 1))} aria-label="Move left" sx={{ bgcolor: "rgba(255,255,255,0.9)", "&:hover": { bgcolor: "#fff" }, "&.Mui-disabled": { bgcolor: "rgba(255,255,255,0.5)" } }}>
                  <ChevronLeftRounded fontSize="small" />
                </IconButton>
                <IconButton size="small" disabled={index === value.length - 1} onClick={() => onChange(move(value, index, index + 1))} aria-label="Move right" sx={{ bgcolor: "rgba(255,255,255,0.9)", "&:hover": { bgcolor: "#fff" }, "&.Mui-disabled": { bgcolor: "rgba(255,255,255,0.5)" } }}>
                  <ChevronRightRounded fontSize="small" />
                </IconButton>
                <IconButton size="small" onClick={() => onChange(value.filter((_, i) => i !== index))} aria-label="Remove photo" sx={{ bgcolor: "rgba(255,255,255,0.9)", color: "#B42318", "&:hover": { bgcolor: "#fff" } }}>
                  <CloseRounded fontSize="small" />
                </IconButton>
              </Box>
            </Box>
            {captions && (
              <TextField
                variant="standard"
                placeholder="Caption (optional)"
                value={item.caption || ""}
                onChange={(e) => onChange(value.map((g, i) => (i === index ? { ...g, caption: e.target.value } : g)))}
                fullWidth
                slotProps={{ input: { disableUnderline: true, sx: { fontSize: "0.8rem", px: 1.25, py: 0.75 } } }}
              />
            )}
          </Box>
        ))}
        {value.length < max && (
          <Box
            component="button"
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              handleFiles(e.dataTransfer.files);
            }}
            disabled={uploading}
            sx={{
              aspectRatio: "4 / 3",
              border: "1.5px dashed rgba(45,106,79,0.3)",
              borderRadius: "14px",
              bgcolor: "#F6FAF7",
              cursor: "pointer",
              display: "grid",
              placeItems: "center",
              font: "inherit",
              color: GREEN.main,
              "&:hover": { borderColor: GREEN.mid, bgcolor: GREEN.mist },
            }}
          >
            {uploading ? (
              <CircularProgress size={26} sx={{ color: GREEN.main }} />
            ) : (
              <Box sx={{ textAlign: "center" }}>
                <AddPhotoAlternateRounded />
                <Typography sx={{ fontSize: "0.8rem", fontWeight: 600 }}>Add photos</Typography>
                <Typography sx={{ fontSize: "0.7rem", color: "text.secondary" }}>
                  {value.length}/{max}
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </Box>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        hidden
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </Box>
  );
}

export function InfoRow({ icon: Icon, label, value }) {
  if (value === undefined || value === null || value === "") return null;
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
        <Typography component="div" sx={{ fontSize: "0.9rem", color: GREEN.ink, fontWeight: 500, wordBreak: "break-word" }}>
          {value}
        </Typography>
      </Box>
    </Box>
  );
}

export function InfoGrid({ children }) {
  return (
    <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" } }}>
      {children}
    </Box>
  );
}

export function Paragraph({ children, empty = "Not provided" }) {
  return (
    <Typography sx={{ fontSize: "0.92rem", color: children ? GREEN.ink : "text.secondary", lineHeight: 1.7, whiteSpace: "pre-line", fontStyle: children ? "normal" : "italic" }}>
      {children || empty}
    </Typography>
  );
}

export function TagList({ items = [], empty = "None" }) {
  if (!items.length) return <Paragraph empty={empty} />;
  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
      {items.map((item, i) => (
        <Chip key={`${item}-${i}`} label={item} size="small" sx={{ bgcolor: GREEN.mist, color: GREEN.deep, fontWeight: 600, borderRadius: "8px" }} />
      ))}
    </Box>
  );
}

// Keeps a dialog's form and its last-saved copy side by side
export function useEditableForm(emptyForm) {
  const [initial, setInitial] = useState(emptyForm);
  const [form, setForm] = useState(emptyForm);
  const dirty = JSON.stringify(form) !== JSON.stringify(initial);
  const setField = (key) => (value) => setForm((prev) => ({ ...prev, [key]: value }));
  const load = useCallback((next) => {
    setInitial(next);
    setForm(next);
  }, []);
  const reset = () => setForm(initial);
  return { form, setForm, setField, initial, dirty, load, reset };
}

// page: sits under the fixed app bar on a full page instead of the top of a dialog body
export function FormTabs({ tabs, value, onChange, page = false }) {
  return (
    <Box
      sx={{
        position: "sticky",
        top: page ? { xs: 57, sm: 65 } : { xs: -16, sm: -24 },
        zIndex: 3,
        mx: page ? 0 : { xs: -2, sm: -3.5 },
        mt: page ? 0 : { xs: -2, sm: -3 },
        mb: 2.5,
        px: page ? { xs: 0.5, sm: 1 } : { xs: 1, sm: 2.5 },
        bgcolor: page ? "rgba(250, 250, 250, 0.96)" : "rgba(247, 248, 245, 0.96)",
        backdropFilter: "blur(8px)",
        borderBottom: "1px solid rgba(45, 106, 79, 0.12)",
      }}
    >
      <Tabs
        value={value}
        onChange={(_, next) => onChange(next)}
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
        sx={{
          minHeight: 48,
          "& .MuiTab-root": { textTransform: "none", fontWeight: 600, minHeight: 48, color: "text.secondary" },
          "& .Mui-selected": { color: `${GREEN.deep} !important` },
          "& .MuiTabs-indicator": { bgcolor: GREEN.main, height: 3, borderRadius: "3px 3px 0 0" },
        }}
      >
        {tabs.map((t) => (
          <Tab key={t.value} value={t.value} label={t.label} />
        ))}
      </Tabs>
    </Box>
  );
}
