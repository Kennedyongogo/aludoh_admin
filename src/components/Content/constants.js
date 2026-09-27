export { GREEN, formatDate, timeAgo } from "../ServiceRequests/constants";

export const ROWS_PER_PAGE_OPTIONS = [10, 25, 50];

export const PUBLIC_SITE_URL = (
  import.meta.env.VITE_PUBLIC_SITE_URL || (import.meta.env.DEV ? "http://localhost:3001" : "")
).replace(/\/+$/, "");

export const publicLink = (path) => (PUBLIC_SITE_URL ? `${PUBLIC_SITE_URL}${path}` : "");

// Seeded content still points at the public site's /images folder; uploads come from the API
export const mediaUrl = (path) => {
  if (!path) return "";
  if (/^https?:\/\//i.test(path) || path.startsWith("/uploads/")) return path;
  return PUBLIC_SITE_URL ? `${PUBLIC_SITE_URL}${path}` : path;
};

export const SERVICE_STATUSES = [
  { value: "active", label: "Active", bg: "#D8F3DC", fg: "#1B4332" },
  { value: "draft", label: "Draft", bg: "#EEF0EE", fg: "#5B6660" },
];

export const PROJECT_STATUSES = [
  { value: "completed", label: "Completed", bg: "#D8F3DC", fg: "#1B4332" },
  { value: "ongoing", label: "Ongoing", bg: "#FFF1D6", fg: "#8A5A00" },
];

export const VISIBILITY = [
  { value: "published", label: "Published", bg: "#E3F0FF", fg: "#1D4E89" },
  { value: "draft", label: "Hidden", bg: "#EEF0EE", fg: "#5B6660" },
];

export const TESTIMONIAL_STATUSES = [
  { value: "pending", label: "Pending review", short: "Pending", bg: "#FFF1D6", fg: "#8A5A00" },
  { value: "approved", label: "Approved", short: "Approved", bg: "#D8F3DC", fg: "#1B4332" },
  { value: "rejected", label: "Rejected", short: "Rejected", bg: "#FDE2E1", fg: "#9B1C1C" },
];

export const TESTIMONIAL_SOURCES = [
  { value: "website", label: "Website form" },
  { value: "admin", label: "Added by admin" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "phone", label: "Phone call" },
  { value: "email", label: "Email" },
];

// "scheduled" is derived: published with a future publish date
export const ARTICLE_STATUSES = [
  { value: "published", label: "Published", bg: "#D8F3DC", fg: "#1B4332" },
  { value: "scheduled", label: "Scheduled", bg: "#E3F0FF", fg: "#1D4E89" },
  { value: "draft", label: "Draft", bg: "#EEF0EE", fg: "#5B6660" },
];

export const articleState = (a) => {
  if (!a || a.status !== "published") return "draft";
  return a.published_at && new Date(a.published_at) > new Date() ? "scheduled" : "published";
};

export const COURSE_LEVELS = ["Beginner", "Intermediate", "Advanced"].map((l) => ({ value: l, label: l }));
export const COURSE_MODES = ["Physical", "Online", "Physical / Online"].map((m) => ({ value: m, label: m }));

export const SESSION_STATUSES = [
  { value: "scheduled", label: "Scheduled", bg: "#D8F3DC", fg: "#1B4332" },
  { value: "cancelled", label: "Cancelled", bg: "#FDE2E1", fg: "#9B1C1C" },
];

export const BOOKING_STATUSES = [
  { value: "pending", label: "Pending", bg: "#FFF1D6", fg: "#8A5A00" },
  { value: "confirmed", label: "Confirmed", bg: "#E3F0FF", fg: "#1D4E89" },
  { value: "attended", label: "Attended", bg: "#D8F3DC", fg: "#1B4332" },
  { value: "cancelled", label: "Cancelled", bg: "#FDE2E1", fg: "#9B1C1C" },
];

export const PAYMENT_STATUSES = [
  { value: "unpaid", label: "Unpaid", bg: "#EEF0EE", fg: "#5B6660" },
  { value: "partial", label: "Part paid", bg: "#FFF1D6", fg: "#8A5A00" },
  { value: "paid", label: "Paid", bg: "#D8F3DC", fg: "#1B4332" },
];

export const BOOKING_SOURCES = [
  { value: "website", label: "Website form" },
  { value: "admin", label: "Added by admin" },
  { value: "phone", label: "Phone call" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "email", label: "Email" },
];

export const CERTIFICATE_STATUSES = [
  { value: "valid", label: "Valid", bg: "#D8F3DC", fg: "#1B4332" },
  { value: "revoked", label: "Revoked", bg: "#FDE2E1", fg: "#9B1C1C" },
];

export const formatKES = (amount) =>
  amount === null || amount === undefined || amount === "" ? "—" : `KES ${Number(amount).toLocaleString("en-KE")}`;

// Date-only values ("2026-10-07") are shown as calendar dates, without a timezone shift
export const formatDay = (value, { weekday = false } = {}) =>
  value
    ? new Date(`${String(value).slice(0, 10)}T00:00:00`).toLocaleDateString("en-KE", {
        ...(weekday && { weekday: "short" }),
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

export const formatDayRange = (start, end) => {
  if (!start) return "—";
  if (!end || end === start) return formatDay(start);
  const a = new Date(`${start}T00:00:00`);
  const b = new Date(`${end}T00:00:00`);
  const sameMonth = a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
  const startText = a.toLocaleDateString("en-KE", sameMonth ? { day: "numeric" } : { day: "numeric", month: "short" });
  return `${startText} – ${formatDay(end)}`;
};

export const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export const SERVICE_ICONS = [
  { value: "hydroponics", label: "Hydroponics" },
  { value: "greenhouse", label: "Greenhouse" },
  { value: "shadenet", label: "Shade net" },
  { value: "vertical", label: "Vertical garden" },
  { value: "irrigation", label: "Irrigation" },
  { value: "landscaping", label: "Landscaping" },
  { value: "consultancy", label: "Consultancy" },
  { value: "generic", label: "Generic leaf" },
];

export const BENEFIT_ICONS = [
  { value: "water", label: "Water" },
  { value: "yield", label: "Yield" },
  { value: "leaf", label: "Leaf" },
  { value: "space", label: "Space" },
  { value: "design", label: "Design" },
  { value: "eco", label: "Eco" },
  { value: "money", label: "Money" },
  { value: "shield", label: "Shield" },
  { value: "support", label: "Support" },
  { value: "clock", label: "Clock" },
  { value: "school", label: "Training" },
  { value: "doc", label: "Document" },
];

export const PACKAGE_UNITS = [
  { value: "from", label: "From (starting price)" },
  { value: "per month", label: "Per month" },
  { value: "custom", label: "Custom quote" },
];

export const KENYA_COUNTIES = [
  "Baringo", "Bomet", "Bungoma", "Busia", "Elgeyo-Marakwet", "Embu", "Garissa", "Homa Bay", "Isiolo",
  "Kajiado", "Kakamega", "Kericho", "Kiambu", "Kilifi", "Kirinyaga", "Kisii", "Kisumu", "Kitui", "Kwale",
  "Laikipia", "Lamu", "Machakos", "Makueni", "Mandera", "Marsabit", "Meru", "Migori", "Mombasa",
  "Murang'a", "Nairobi", "Nakuru", "Nandi", "Narok", "Nyamira", "Nyandarua", "Nyeri", "Samburu", "Siaya",
  "Taita-Taveta", "Tana River", "Tharaka-Nithi", "Trans Nzoia", "Turkana", "Uasin Gishu", "Vihiga",
  "Wajir", "West Pokot",
];

export const findOption = (options, value, fallback) =>
  options.find((o) => o.value === value) || fallback || options[0];

export const labelOf = (options, value) => options.find((o) => o.value === value)?.label || value || "";

export const initials = (name = "") =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("") || "?";
