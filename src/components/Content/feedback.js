import Swal from "sweetalert2";
import { GREEN } from "./constants";

export const confirmDiscard = async (what = "this item") => {
  const { isConfirmed } = await Swal.fire({
    icon: "question",
    title: "Discard your changes?",
    text: `You have unsaved changes to ${what}.`,
    showCancelButton: true,
    confirmButtonText: "Discard",
    cancelButtonText: "Keep editing",
    confirmButtonColor: GREEN.main,
    cancelButtonColor: "#6B7280",
    reverseButtons: true,
  });
  return isConfirmed;
};

export const confirmDelete = async ({ title, text, confirmText = "Delete" }) => {
  const { isConfirmed } = await Swal.fire({
    icon: "warning",
    title,
    text,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: "Cancel",
    confirmButtonColor: "#B42318",
    cancelButtonColor: "#6B7280",
    reverseButtons: true,
  });
  return isConfirmed;
};

export const confirmAction = async ({ title, text, confirmText = "Continue", icon = "question" }) => {
  const { isConfirmed } = await Swal.fire({
    icon,
    title,
    text,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: "Cancel",
    confirmButtonColor: GREEN.main,
    cancelButtonColor: "#6B7280",
    reverseButtons: true,
  });
  return isConfirmed;
};

// Resolves to the entered text, or null when cancelled
export const promptText = async ({ title, text, label, placeholder, value = "", input = "text", confirmText = "Save", required, validate, inputAttributes }) => {
  const result = await Swal.fire({
    title,
    text,
    input,
    inputLabel: label,
    inputPlaceholder: placeholder,
    inputValue: value,
    inputAttributes,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: "Cancel",
    confirmButtonColor: GREEN.main,
    cancelButtonColor: "#6B7280",
    reverseButtons: true,
    inputValidator: (entered) => {
      if (required && !String(entered).trim()) return "This is required";
      return validate?.(entered) || undefined;
    },
  });
  return result.isConfirmed ? String(result.value ?? "").trim() : null;
};

export const toastSuccess = (title) =>
  Swal.fire({
    icon: "success",
    title,
    iconColor: GREEN.mid,
    showConfirmButton: false,
    timer: 1500,
  });

export const toastError = (text) =>
  Swal.fire({
    icon: "error",
    title: "Something went wrong",
    text,
    confirmButtonColor: GREEN.main,
  });
