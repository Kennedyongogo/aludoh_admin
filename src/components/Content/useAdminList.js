import { useCallback, useEffect, useState } from "react";
import { adminRequest, buildQuery } from "../../utils/adminApi";

/**
 * Paged admin list with a debounced search box.
 * filters: extra query params; call resetPage() whenever one of them changes.
 */
export default function useAdminList(endpoint, filters = {}) {
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const filterKey = JSON.stringify(filters);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(0);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    adminRequest(`${endpoint}${buildQuery({ page: page + 1, limit: rowsPerPage, search, ...JSON.parse(filterKey) })}`)
      .then(({ data, summary: counts, pagination }) => {
        if (cancelled) return;
        if (!data.length && pagination.total > 0 && page > 0) {
          setPage(Math.max(pagination.totalPages - 1, 0));
          return;
        }
        setRows(data);
        setSummary(counts || null);
        setTotal(pagination.total);
      })
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [endpoint, page, rowsPerPage, search, filterKey, reloadKey]);

  const refresh = useCallback(() => setReloadKey((k) => k + 1), []);
  const resetPage = useCallback(() => setPage(0), []);
  const clearSearch = useCallback(() => {
    setSearchInput("");
    setSearch("");
    setPage(0);
  }, []);

  return {
    rows,
    summary,
    loading,
    error,
    setError,
    search,
    searchInput,
    setSearchInput,
    clearSearch,
    refresh,
    resetPage,
    // Spread into <ResponsiveList>
    listProps: {
      rows,
      loading,
      count: total,
      page,
      rowsPerPage,
      onPageChange: setPage,
      onRowsPerPageChange: (n) => {
        setRowsPerPage(n);
        setPage(0);
      },
    },
  };
}
