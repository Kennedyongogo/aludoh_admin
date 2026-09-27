import React, { useCallback, useEffect, useRef, useState } from "react";
import { Box, IconButton, Typography } from "@mui/material";
import { ChevronLeftRounded, ChevronRightRounded } from "@mui/icons-material";
import { GREEN } from "../ServiceRequests/constants";

export function SummaryCard({ label, count, active, color, onClick }) {
  return (
    <Box
      component="button"
      type="button"
      onClick={onClick}
      aria-pressed={active}
      sx={{
        textAlign: "left",
        cursor: "pointer",
        px: 2,
        py: 1.5,
        borderRadius: "16px 16px 16px 6px",
        border: "1px solid",
        borderColor: active ? GREEN.mid : "rgba(45, 106, 79, 0.12)",
        bgcolor: active ? GREEN.mist : "#fff",
        boxShadow: active ? "0 6px 18px rgba(45, 106, 79, 0.15)" : "none",
        transition: "all 0.2s ease",
        font: "inherit",
        "&:hover": { borderColor: GREEN.mid },
        "&:focus-visible": { outline: `2px solid ${GREEN.mid}`, outlineOffset: 2 },
      }}
    >
      <Typography sx={{ fontSize: "1.5rem", fontWeight: 700, color: color || GREEN.deep, lineHeight: 1.1 }}>
        {count ?? "–"}
      </Typography>
      <Typography
        noWrap
        title={label}
        sx={{ fontSize: "0.78rem", color: "text.secondary", fontWeight: 600 }}
      >
        {label}
      </Typography>
    </Box>
  );
}

const CAROUSEL_GAP = 12;

const arrowSx = {
  flexShrink: 0,
  width: 34,
  height: 34,
  color: GREEN.main,
  bgcolor: "#fff",
  border: "1px solid rgba(45, 106, 79, 0.25)",
  boxShadow: "0 2px 8px rgba(27, 67, 50, 0.08)",
  "&:hover": { bgcolor: GREEN.mist },
  "&.Mui-disabled": { opacity: 0.35, bgcolor: "#fff" },
};

// A row of SummaryCards on desktop, a two-up swipeable carousel on small screens
export function StatsLayout({ carousel, children }) {
  const scrollerRef = useRef(null);
  const [scroll, setScroll] = useState({ page: 0, pages: 1, canPrev: false, canNext: false });

  const measure = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const step = el.clientWidth + CAROUSEL_GAP;
    const max = el.scrollWidth - el.clientWidth;
    setScroll({
      page: Math.round(el.scrollLeft / step),
      pages: Math.max(Math.ceil((el.scrollWidth + CAROUSEL_GAP) / step), 1),
      canPrev: el.scrollLeft > 2,
      canNext: el.scrollLeft < max - 2,
    });
  }, []);

  useEffect(() => {
    if (!carousel) return undefined;
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [carousel, measure]);

  const goTo = (page) => {
    const el = scrollerRef.current;
    if (el) el.scrollTo({ left: page * (el.clientWidth + CAROUSEL_GAP), behavior: "smooth" });
  };

  if (!carousel) {
    return (
      <Box
        sx={{
          display: "flex",
          gap: 1.5,
          mb: 2.5,
          flexWrap: { md: "wrap", lg: "nowrap" },
          "& > button": { flex: { md: "1 1 128px", lg: "1 1 0" }, minWidth: { md: 128, lg: 0 } },
        }}
      >
        {children}
      </Box>
    );
  }

  return (
    <Box sx={{ mb: 2.5 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <IconButton
          onClick={() => goTo(scroll.page - 1)}
          disabled={!scroll.canPrev}
          aria-label="Previous stats"
          sx={arrowSx}
        >
          <ChevronLeftRounded />
        </IconButton>

        <Box
          ref={scrollerRef}
          onScroll={measure}
          sx={{
            flex: 1,
            minWidth: 0,
            display: "flex",
            gap: `${CAROUSEL_GAP}px`,
            overflowX: "auto",
            overflowY: "hidden",
            scrollSnapType: "x mandatory",
            scrollbarWidth: "none",
            "&::-webkit-scrollbar": { display: "none" },
            py: 1,
            "& > button": {
              flex: `0 0 calc((100% - ${CAROUSEL_GAP}px) / 2)`,
              minWidth: 0,
              scrollSnapAlign: "start",
            },
          }}
        >
          {children}
        </Box>

        <IconButton
          onClick={() => goTo(scroll.page + 1)}
          disabled={!scroll.canNext}
          aria-label="Next stats"
          sx={arrowSx}
        >
          <ChevronRightRounded />
        </IconButton>
      </Box>

      {scroll.pages > 1 && (
        <Box sx={{ display: "flex", justifyContent: "center", gap: 0.75, mt: 1.25 }}>
          {Array.from({ length: scroll.pages }, (_, i) => (
            <Box
              key={i}
              component="button"
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Show stats group ${i + 1}`}
              aria-current={scroll.page === i}
              sx={{
                p: 0,
                border: 0,
                cursor: "pointer",
                height: 6,
                width: scroll.page === i ? 20 : 6,
                borderRadius: 3,
                bgcolor: scroll.page === i ? GREEN.main : "rgba(45, 106, 79, 0.25)",
                transition: "all 0.25s ease",
              }}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}
