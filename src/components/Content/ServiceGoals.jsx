import React, { useEffect, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  Grow,
  IconButton,
  Switch,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
} from "@mui/material";
import {
  AddRounded,
  ArrowDownwardRounded,
  ArrowUpwardRounded,
  CloseRounded,
  ExploreRounded,
} from "@mui/icons-material";
import { adminRequest } from "../../utils/adminApi";
import { ActionIcons, ContentCard, EmptyState, ErrorBanner, ResponsiveList, primaryButtonSx } from "./ListKit";
import { Field, SwitchRow, fieldSx } from "./FormKit";
import { confirmDelete, confirmDiscard, toastSuccess } from "./feedback";
import { GREEN } from "./constants";

const MAX_SERVICES = 4;

function GoalDialog({ goal, services, onClose, onSaved }) {
  const fullScreen = useMediaQuery("(max-width:599px)");
  const isNew = goal === "new";
  const open = Boolean(goal);
  const blank = { label: "", service_ids: [], is_active: true };
  const [form, setForm] = useState(blank);
  const [initial, setInitial] = useState(blank);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!goal) return;
    const next = isNew
      ? { label: "", service_ids: [], is_active: true }
      : { label: goal.label, service_ids: goal.service_ids, is_active: goal.is_active };
    setForm(next);
    setInitial(next);
    setError("");
  }, [goal, isNew]);

  const dirty = JSON.stringify(form) !== JSON.stringify(initial);
  const selected = form.service_ids.map((id) => services.find((s) => s.id === id)).filter(Boolean);

  const close = async () => {
    if (saving) return;
    if (dirty && !(await confirmDiscard("this goal"))) return;
    onClose();
  };

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      await adminRequest(isNew ? "/api/service-goals" : `/api/service-goals/${goal.id}`, {
        method: isNew ? "POST" : "PUT",
        body: form,
      });
      toastSuccess(isNew ? "Goal added" : "Goal updated");
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={close}
      fullWidth
      maxWidth="sm"
      fullScreen={fullScreen}
      disableEnforceFocus
      slots={{ transition: Grow }}
      slotProps={{ paper: { sx: { borderRadius: fullScreen ? 0 : "24px", bgcolor: "#F7F8F5" } } }}
    >
      <Box sx={{ px: 3, py: 2.5, display: "flex", alignItems: "center", gap: 1.5, color: "#fff", background: `linear-gradient(135deg, ${GREEN.deep}, ${GREEN.mid})` }}>
        <ExploreRounded />
        <Typography sx={{ fontWeight: 800, fontSize: "1.15rem", flex: 1 }}>{isNew ? "Add finder goal" : "Edit finder goal"}</Typography>
        <IconButton onClick={close} sx={{ color: "#fff" }} aria-label="Close">
          <CloseRounded />
        </IconButton>
      </Box>
      <Box sx={{ p: 3, display: "grid", gap: 2.25 }}>
        <Typography sx={{ fontSize: "0.85rem", color: "text.secondary" }}>
          Goals power the “Not sure where to start?” finder on the Services page. Visitors pick a goal and see the
          matching services, best match first.
        </Typography>
        <Field label="Goal" value={form.label} onChange={(label) => setForm((f) => ({ ...f, label }))} max={80} required placeholder="e.g. Grow more food in less space" />
        <Autocomplete
          multiple
          options={services}
          value={selected}
          getOptionLabel={(s) => s.name}
          isOptionEqualToValue={(a, b) => a.id === b.id}
          getOptionDisabled={(s) => form.service_ids.length >= MAX_SERVICES && !form.service_ids.includes(s.id)}
          onChange={(_, value) => setForm((f) => ({ ...f, service_ids: value.map((s) => s.id) }))}
          renderValue={(value, getItemProps) =>
            value.map((s, index) => {
              const { key, ...itemProps } = getItemProps({ index });
              return (
                <Chip
                  key={key}
                  {...itemProps}
                  label={`${index + 1}. ${s.short_name || s.name}`}
                  size="small"
                  sx={{ bgcolor: index === 0 ? GREEN.main : GREEN.mist, color: index === 0 ? "#fff" : GREEN.deep, fontWeight: 600, "& .MuiChip-deleteIcon": { color: index === 0 ? "rgba(255,255,255,0.8)" : GREEN.mid } }}
                />
              );
            })
          }
          renderInput={(params) => (
            <TextField
              {...params}
              label="Matching services"
              size="small"
              helperText={`Pick in order of fit, up to ${MAX_SERVICES}. The first is shown as the best match.`}
              sx={fieldSx}
            />
          )}
        />
        <SwitchRow label="Show on website" description="Hidden goals are kept but not offered to visitors" checked={form.is_active} onChange={(is_active) => setForm((f) => ({ ...f, is_active }))} />
        {error && <Alert severity="error" sx={{ borderRadius: "12px" }}>{error}</Alert>}
      </Box>
      <Box sx={{ px: 3, py: 1.75, display: "flex", justifyContent: "flex-end", gap: 1, bgcolor: "#fff", borderTop: "1px solid rgba(45,106,79,0.12)", mt: "auto" }}>
        <Button onClick={close} sx={{ textTransform: "none", color: "text.secondary", borderRadius: "10px" }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={save}
          disabled={saving || (!dirty && !isNew)}
          startIcon={saving && <CircularProgress size={16} color="inherit" />}
          sx={{ ...primaryButtonSx, boxShadow: "none" }}
        >
          {isNew ? "Add goal" : "Save changes"}
        </Button>
      </Box>
    </Dialog>
  );
}

export default function ServiceGoals({ services, isDesktop, onCountChange }) {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    adminRequest("/api/service-goals/admin")
      .then(({ data }) => {
        if (cancelled) return;
        setGoals(data);
        onCountChange?.(data.length);
      })
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [reloadKey, onCountChange]);

  const refresh = () => setReloadKey((k) => k + 1);

  const moveGoal = async (index, delta) => {
    const next = [...goals];
    const [item] = next.splice(index, 1);
    next.splice(index + delta, 0, item);
    setGoals(next);
    setBusy(true);
    try {
      await adminRequest("/api/service-goals/reorder", { method: "PUT", body: { ids: next.map((g) => g.id) } });
    } catch (err) {
      setError(err.message);
      refresh();
    } finally {
      setBusy(false);
    }
  };

  const toggleActive = async (goal) => {
    setGoals((prev) => prev.map((g) => (g.id === goal.id ? { ...g, is_active: !g.is_active } : g)));
    try {
      await adminRequest(`/api/service-goals/${goal.id}`, { method: "PUT", body: { is_active: !goal.is_active } });
    } catch (err) {
      setError(err.message);
      refresh();
    }
  };

  const removeGoal = async (goal) => {
    if (!(await confirmDelete({ title: "Delete this goal?", text: `“${goal.label}” will be removed from the service finder.` }))) return;
    try {
      await adminRequest(`/api/service-goals/${goal.id}`, { method: "DELETE" });
      toastSuccess("Goal deleted");
      refresh();
    } catch (err) {
      setError(err.message);
    }
  };

  const serviceChips = (goal) => (
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
      {goal.services.map((s, i) => (
        <Chip
          key={s.id}
          size="small"
          label={s.short_name || s.name}
          sx={{
            height: 22,
            fontSize: "0.72rem",
            fontWeight: 600,
            borderRadius: "7px",
            bgcolor: i === 0 ? GREEN.main : GREEN.mist,
            color: i === 0 ? "#fff" : GREEN.deep,
            opacity: s.status === "draft" ? 0.55 : 1,
          }}
        />
      ))}
      {!goal.services.length && (
        <Typography variant="caption" sx={{ color: "#B42318" }}>
          No services – hidden from visitors
        </Typography>
      )}
    </Box>
  );

  const orderButtons = (index) => (
    <Box sx={{ display: "inline-flex" }} onClick={(e) => e.stopPropagation()}>
      <Tooltip title="Move up">
        <span>
          <IconButton size="small" disabled={busy || index === 0} onClick={() => moveGoal(index, -1)} aria-label="Move up">
            <ArrowUpwardRounded fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip title="Move down">
        <span>
          <IconButton size="small" disabled={busy || index === goals.length - 1} onClick={() => moveGoal(index, 1)} aria-label="Move down">
            <ArrowDownwardRounded fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
    </Box>
  );

  const indexOf = (goal) => goals.findIndex((g) => g.id === goal.id);

  const columns = [
    { key: "order", label: "Order", width: 96, render: (g) => orderButtons(indexOf(g)) },
    {
      key: "label",
      label: "Visitor goal",
      render: (g) => <Typography sx={{ fontWeight: 700, color: GREEN.ink, fontSize: "0.9rem" }}>{g.label}</Typography>,
    },
    { key: "services", label: "Matching services (best first)", render: serviceChips },
    {
      key: "active",
      label: "On website",
      width: 110,
      render: (g) => (
        <Switch
          size="small"
          checked={g.is_active}
          onClick={(e) => e.stopPropagation()}
          onChange={() => toggleActive(g)}
          slotProps={{ input: { "aria-label": `Show ${g.label} on website` } }}
          sx={{ "& .Mui-checked": { color: `${GREEN.main} !important` }, "& .Mui-checked + .MuiSwitch-track": { bgcolor: `${GREEN.light} !important` } }}
        />
      ),
    },
    {
      key: "actions",
      label: "Actions",
      align: "right",
      width: 110,
      render: (g) => <ActionIcons label="goal" onEdit={() => setEditing(g)} onDelete={() => removeGoal(g)} />,
    },
  ];

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2, flexWrap: "wrap" }}>
        <Typography sx={{ flex: "1 1 280px", fontSize: "0.88rem", color: "text.secondary" }}>
          The goals visitors choose from in the “Not sure where to start?” finder, and the services each one leads to.
        </Typography>
        <Button variant="contained" startIcon={<AddRounded />} onClick={() => setEditing("new")} sx={primaryButtonSx}>
          Add goal
        </Button>
      </Box>

      <ErrorBanner error={error} onRetry={refresh} />

      <ResponsiveList
        isDesktop={isDesktop}
        columns={columns}
        rows={goals}
        loading={loading}
        minWidth={760}
        onRowClick={(g) => setEditing(g)}
        renderCard={(g) => (
          <ContentCard
            title={g.label}
            onClick={() => setEditing(g)}
            body={serviceChips(g)}
            chips={
              <Chip
                size="small"
                label={g.is_active ? "On website" : "Hidden"}
                sx={{ height: 22, fontWeight: 700, fontSize: "0.7rem", bgcolor: g.is_active ? GREEN.mist : "#EEF0EE", color: g.is_active ? GREEN.deep : "#5B6660" }}
              />
            }
            actions={
              <Box sx={{ display: "flex", alignItems: "center" }}>
                {orderButtons(indexOf(g))}
                <ActionIcons label="goal" onEdit={() => setEditing(g)} onDelete={() => removeGoal(g)} />
              </Box>
            }
          />
        )}
        empty={
          <EmptyState
            icon={<ExploreRounded sx={{ fontSize: 48, color: GREEN.light, mb: 1 }} />}
            title="No finder goals yet"
            text="Add goals like “Save water” or “Grow food at school” to guide visitors to the right service."
          />
        }
      />

      <GoalDialog
        goal={editing}
        services={services}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          refresh();
        }}
      />
    </Box>
  );
}
