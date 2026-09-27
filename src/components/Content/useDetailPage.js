import { useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import useContentDialog from "./useContentDialog";

/**
 * Record page at <listPath>/new, <listPath>/:id and <listPath>/:id/edit.
 * The URL decides the mode; saving opens the view page and deleting returns to the list.
 */
export default function useDetailPage({ listPath, endpoint, toForm, toPayload, noun, deletePrompt }) {
  const { id: routeId } = useParams();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const id = routeId || "new";
  const urlMode = id === "new" || pathname.endsWith("/edit") ? "edit" : "view";

  const d = useContentDialog({
    id,
    initialMode: urlMode,
    endpoint,
    toForm,
    toPayload,
    noun,
    deletePrompt,
    onClose: () => navigate(listPath),
    onSaved: (saved) => navigate(`${listPath}/${saved.id}`, { replace: true }),
    onDeleted: () => navigate(listPath, { replace: true }),
  });

  const hasUnsaved = d.mode === "edit" && d.dirty;

  // Warn before a reload or closing the tab loses edits
  useEffect(() => {
    if (!hasUnsaved) return undefined;
    const warn = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [hasUnsaved]);

  const switchMode = async (next) => {
    if (!(await d.changeMode(next))) return;
    navigate(next === "edit" ? `${listPath}/${d.record.id}/edit` : `${listPath}/${d.record.id}`, { replace: true });
  };

  return {
    ...d,
    switchMode,
    // Spread into <ContentPage>
    pageProps: {
      onBack: d.requestClose,
      loading: d.loading,
      unavailable: Boolean(d.loadError),
      mode: d.mode,
      onModeChange: switchMode,
      isNew: d.isNew,
      error: d.error,
      dirty: d.dirty,
      saving: d.saving,
      onSave: d.save,
      onDiscard: d.discard,
      onDelete: d.remove,
    },
  };
}
