export const GREEN = {
  deep: "#1B4332",
  main: "#2D6A4F",
  mid: "#40916C",
  light: "#52B788",
  mist: "#D8F3DC",
  cream: "#F7F4EC",
  ink: "#1B2A22",
};

export const STATUSES = [
  { value: "pending", label: "Pending", bg: "#EEF2F0", fg: "#44524B" },
  { value: "reviewing", label: "Under review", bg: "#FFF4DA", fg: "#8A5A00" },
  { value: "in_progress", label: "In progress", bg: "#E3F0FF", fg: "#1F4E8C" },
  { value: "scheduled", label: "Visit scheduled", bg: "#EDE7FB", fg: "#5B3FA0" },
  { value: "resolved", label: "Resolved", bg: GREEN.mist, fg: GREEN.deep },
  { value: "cancelled", label: "Cancelled", bg: "#FDECEA", fg: "#9B2C21" },
];

export const PRIORITIES = [
  { value: "low", label: "Low", bg: "#F1F3F2", fg: "#5F6B65" },
  { value: "normal", label: "Normal", bg: "#EAF4EE", fg: GREEN.main },
  { value: "high", label: "High", bg: "#FFF1E0", fg: "#A2560B" },
  { value: "urgent", label: "Urgent", bg: "#FDE3E1", fg: "#B42318" },
];

export const SORT_OPTIONS = [
  { value: "createdAt:DESC", label: "Newest first" },
  { value: "createdAt:ASC", label: "Oldest first" },
  { value: "updatedAt:DESC", label: "Recently updated" },
  { value: "priority:DESC", label: "Highest priority" },
];

export const HANDLER_FILTERS = [
  { value: "", label: "Anyone" },
  { value: "me", label: "Handled by me" },
  { value: "unassigned", label: "Unassigned" },
];

export const findStatus = (value) =>
  STATUSES.find((s) => s.value === value) || STATUSES[0];

export const findPriority = (value) =>
  PRIORITIES.find((p) => p.value === value) || PRIORITIES[1];

export const formatDate = (value, withTime = true) =>
  value
    ? new Date(value).toLocaleString("en-KE", {
        day: "numeric",
        month: "short",
        year: "numeric",
        ...(withTime && { hour: "2-digit", minute: "2-digit" }),
      })
    : "—";

export const timeAgo = (value) => {
  if (!value) return "";
  const seconds = Math.round((Date.now() - new Date(value).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const units = [
    [60 * 60 * 24 * 30, "mo"],
    [60 * 60 * 24 * 7, "w"],
    [60 * 60 * 24, "d"],
    [60 * 60, "h"],
    [60, "m"],
  ];
  const [size, unit] = units.find(([s]) => seconds >= s);
  return `${Math.floor(seconds / size)}${unit} ago`;
};
