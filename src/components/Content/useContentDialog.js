import { useEffect, useState } from "react";
import { adminRequest } from "../../utils/adminApi";
import { useEditableForm } from "./FormKit";
import { confirmDelete, confirmDiscard, toastSuccess } from "./feedback";

/**
 * Loading, view/edit switching, saving and deleting for one record.
 * id: a record id, "new" for the create form, or null when closed.
 */
export default function useContentDialog({
  id,
  initialMode = "view",
  endpoint,
  toForm,
  toPayload,
  noun,
  deletePrompt,
  onClose,
  onSaved,
  onDeleted,
}) {
  const isNew = id === "new";
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [mode, setMode] = useState(initialMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const editable = useEditableForm(() => toForm(null));
  const { load } = editable;

  useEffect(() => {
    if (!id) return;
    setMode(id === "new" ? "edit" : initialMode);
    setError("");
  }, [id, initialMode]);

  useEffect(() => {
    if (!id) return undefined;
    setLoadError("");
    if (id === "new") {
      setRecord(null);
      load(toForm(null));
      return undefined;
    }

    let cancelled = false;
    setLoading(true);
    adminRequest(`${endpoint}/admin/${id}`)
      .then(({ data }) => {
        if (cancelled) return;
        setRecord(data);
        load(toForm(data));
      })
      .catch((err) => !cancelled && setLoadError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
    // toForm is a module-level function in every caller
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, endpoint, load]);

  const creating = isNew && !record;

  const requestClose = async () => {
    if (saving) return;
    if (mode === "edit" && editable.dirty && !(await confirmDiscard(`this ${noun}`))) return;
    onClose();
  };

  // Resolves to false when the user chose to keep editing
  const changeMode = async (next) => {
    if (next === "view" && editable.dirty) {
      if (!(await confirmDiscard(`this ${noun}`))) return false;
      editable.reset();
    }
    setError("");
    setMode(next);
    return true;
  };

  const applySaved = (data, created) => {
    setRecord(data);
    load(toForm(data));
    onSaved?.(data, { created });
  };

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      const { data } = await adminRequest(creating ? endpoint : `${endpoint}/${record.id}`, {
        method: creating ? "POST" : "PUT",
        body: toPayload(editable.form),
      });
      applySaved(data, creating);
      setMode("view");
      toastSuccess(creating ? `${capitalize(noun)} created` : "Changes saved");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Quick one-field updates from the view mode (approve, publish, feature...)
  const patch = async (changes, message) => {
    setSaving(true);
    setError("");
    try {
      const { data } = await adminRequest(`${endpoint}/${record.id}`, { method: "PUT", body: changes });
      applySaved(data, false);
      if (message) toastSuccess(message);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!record || !(await confirmDelete(deletePrompt(record)))) return;
    try {
      await adminRequest(`${endpoint}/${record.id}`, { method: "DELETE" });
      onDeleted?.(record.id);
      toastSuccess(`${capitalize(noun)} deleted`);
    } catch (err) {
      setError(err.message);
    }
  };

  return {
    ...editable,
    isNew: creating,
    record,
    loading,
    loadError,
    mode,
    changeMode,
    saving,
    error,
    save,
    patch,
    remove,
    requestClose,
    discard: editable.reset,
  };
}

const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);
