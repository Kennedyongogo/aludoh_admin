import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
import {
  Route,
  Routes,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { Box, CircularProgress } from "@mui/material";
import Swal from "sweetalert2";
import { fetchWithTimeout } from "../utils/fetchWithTimeout";

import Navbar from "./Navbar";
import Dashboard from "../pages/Dashboard";
import ServiceRequests from "../pages/ServiceRequests";
import ServiceRequestsMap from "../pages/ServiceRequestsMap";
import Services from "../pages/Services";
import ServiceDetail from "../pages/ServiceDetail";
import Projects from "../pages/Projects";
import ProjectDetail from "../pages/ProjectDetail";
import Testimonials from "../pages/Testimonials";
import TestimonialDetail from "../pages/TestimonialDetail";
import Gallery from "../pages/Gallery";
import GalleryDetail from "../pages/GalleryDetail";
import Knowledge from "../pages/Knowledge";
import ArticleDetail from "../pages/ArticleDetail";
import Courses from "../pages/Courses";
import CourseDetail from "../pages/CourseDetail";
import Bookings from "../pages/Bookings";
import BookingDetail from "../pages/BookingDetail";
import Certificates from "../pages/Certificates";
import CertificateDetail from "../pages/CertificateDetail";
import Wallet from "../pages/Wallet";
import SuspensionGate from "./Suspension/SuspensionGate";
import SuspensionAppealModal from "./Suspension/SuspensionAppealModal";
import RatingPromptDialog from "./RatingPromptDialog";
import useServerSentEvents from "../hooks/useServerSentEvents";
import {
  getRatingPromptStatus,
  submitRatingTestimonial,
  dismissRatingPrompt,
} from "../utils/ratingPrompt";

function PageRoutes() {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [suspension, setSuspension] = useState(null);
  const [loadingSuspension, setLoadingSuspension] = useState(false);
  const [suspensionReady, setSuspensionReady] = useState(true); // Start as true to not block UI
  const initialSuspensionCheckRef = useRef(true);
  const prevUserIdRef = useRef(null);
  const [appealOpen, setAppealOpen] = useState(false);
  const [ratingPromptOpen, setRatingPromptOpen] = useState(false);
  const [ratingPromptLoading, setRatingPromptLoading] = useState(false);
  const [ratingPromptInfo, setRatingPromptInfo] = useState(null);

  const authToken = useMemo(() => localStorage.getItem("token"), [user]);

  const checkAuthentication = useCallback(() => {
    const savedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (savedUser && token) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser((prevUser) => {
          if (!prevUser || prevUser.id !== parsedUser.id) {
            initialSuspensionCheckRef.current = true;
            prevUserIdRef.current = parsedUser.id;
            return parsedUser;
          }
          return prevUser;
        });
        setLoading(false);
        return true;
      } catch (error) {
        localStorage.clear();
        setUser(null);
        setSuspensionReady(true);
        setLoading(false);
        navigate("/", { replace: true });
        return false;
      }
    }

    setUser(null);
    setSuspension(null);
    setAppealOpen(false);
    setSuspensionReady(true);
    initialSuspensionCheckRef.current = true;
    prevUserIdRef.current = null;
    setLoading(false);
    navigate("/", { replace: true });
    return false;
  }, [navigate]);

  const fetchSuspensionStatus = useCallback(
    async (shouldGate = false) => {
      const token = localStorage.getItem("token");
      if (!token || !user) {
        setSuspension(null);
        setSuspensionReady(true);
        initialSuspensionCheckRef.current = false;
        return;
      }

      try {
        setLoadingSuspension(true);
        // Don't block UI - allow skeleton loaders to show immediately
        // Only block if we're gating (showing SuspensionGate)
        if (shouldGate) {
          setSuspensionReady(false);
        }
        const response = await fetchWithTimeout(
          "/api/suspensions/me/status",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          },
          8000
        );

        const payload = await response.json();
        if (!response.ok) {
          throw new Error(
            payload.message || "Failed to load suspension status"
          );
        }

        const suspensionData = payload.data || null;
        setSuspension(suspensionData);
        if (!suspensionData) {
          setAppealOpen(false);
        }
      } catch (error) {
        console.error("[PageRoutes] fetchSuspensionStatus error:", error);
      } finally {
        setLoadingSuspension(false);
        setSuspensionReady(true);
        initialSuspensionCheckRef.current = false;
      }
    },
    [user]
  );

  const requestLogout = useCallback(async () => {
    const result = await Swal.fire({
      title: "Logout?",
      text: "Are you sure you want to logout?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, Logout",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#2D6A4F",
      cancelButtonColor: "#666",
      allowOutsideClick: false,
      allowEscapeKey: true,
      customClass: {
        popup: "swal-popup-brand",
      },
      didOpen: () => {
        const swal = document.querySelector(".swal2-popup");
        if (swal) {
          swal.style.borderRadius = "20px";
          swal.style.border = "1px solid rgba(45, 106, 79, 0.3)";
          swal.style.boxShadow = "0 20px 60px rgba(45, 106, 79, 0.25)";
        }
      },
    });

    if (!result.isConfirmed) {
      return;
    }

    const token = localStorage.getItem("token");
    if (token) {
      try {
        await fetchWithTimeout(
          "/api/public/logout",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          },
          5000
        );
      } catch (error) {
        console.error("Logout API call failed:", error);
      }
    }

    localStorage.clear();
    setUser(null);
    setSuspension(null);
    setAppealOpen(false);
    setSuspensionReady(true);
    initialSuspensionCheckRef.current = true;
    prevUserIdRef.current = null;
    setLoading(false);
    navigate("/", { replace: true });
  }, [navigate]);

  const handleSuspensionUpdated = useCallback((updated) => {
    if (!updated || updated.status === "revoked") {
      setSuspension(null);
      setAppealOpen(false);
      return;
    }

    setSuspension((prev) => ({
      ...(prev || {}),
      ...updated,
    }));
  }, []);

  const handleUserUpdated = useCallback(
    (updatedUserData) => {
      if (!updatedUserData) return;

      const updatedUser = { ...updatedUserData };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);

      // Also refresh suspension status when user is updated
      fetchSuspensionStatus(false);
    },
    [fetchSuspensionStatus]
  );

  const suspensionHandlers = useMemo(() => {
    if (!user) return {};

    return {
      "suspension:update": (payload) => {
        if (payload?.public_user_id !== user.id) return;
        handleSuspensionUpdated(payload);
      },
      "suspension:revoked": (payload) => {
        if (payload?.public_user_id !== user.id) return;
        handleSuspensionUpdated(null);
      },
      "suspension:message:new": (payload) => {
        const suspensionId =
          payload?.suspensionId || payload?.message?.suspension_id;
        if (!suspensionId || suspensionId !== suspension?.id) return;
        if (appealOpen) return;

        const unread =
          payload?.unreadCounts?.user ??
          (typeof payload?.unreadCounts === "number"
            ? payload.unreadCounts
            : undefined);

        handleSuspensionUpdated({
          ...(suspension || {}),
          unreadCount:
            unread !== undefined ? unread : suspension?.unreadCount || 0,
        });
      },
      "suspension:messages:read": (payload) => {
        if (payload?.suspensionId !== suspension?.id) return;
        const unread =
          payload?.unreadCounts?.user ??
          (typeof payload?.unreadCounts === "number"
            ? payload.unreadCounts
            : 0);

        handleSuspensionUpdated({
          ...(suspension || {}),
          unreadCount: unread,
        });
      },
      "user:update": (payload) => {
        if (payload?.id !== user.id) return;
        handleUserUpdated(payload);
      },
      "user:status": (payload) => {
        if (payload?.id !== user.id) return;
        handleUserUpdated(payload);
      },
    };
  }, [
    user,
    suspension,
    handleSuspensionUpdated,
    appealOpen,
    handleUserUpdated,
  ]);

  const checkRatingPrompt = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token || !user) {
      setRatingPromptOpen(false);
      setRatingPromptInfo(null);
      return;
    }

    try {
      const data = await getRatingPromptStatus(token);
      setRatingPromptInfo(data);
      setRatingPromptOpen(Boolean(data?.shouldPrompt));
    } catch (error) {
      console.error("[PageRoutes] rating prompt check failed:", error);
      setRatingPromptOpen(false);
    }
  }, [user]);

  const handleRatingSubmit = useCallback(async ({ rating, testimonial }) => {
    const token = localStorage.getItem("token");
    if (!token) {
      setRatingPromptOpen(false);
      return;
    }
    try {
      setRatingPromptLoading(true);
      await submitRatingTestimonial({ token, rating, testimonial });
      setRatingPromptOpen(false);
      setRatingPromptInfo({
        shouldPrompt: false,
        hasSubmitted: true,
        daysUntilNextPrompt: null,
      });
      Swal.fire({
        title: "Thank you!",
        text: "Your rating helps us make Mcaludoh Consultancy better.",
        icon: "success",
        confirmButtonColor: "#2D6A4F",
      });
    } catch (error) {
      console.error("[PageRoutes] rating submit failed:", error);
      Swal.fire({
        title: "Something went wrong",
        text: error.message || "Failed to submit rating. Please try again.",
        icon: "error",
        confirmButtonColor: "#2D6A4F",
      });
    } finally {
      setRatingPromptLoading(false);
    }
  }, []);

  const handleRatingDismiss = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setRatingPromptOpen(false);
      return;
    }
    try {
      setRatingPromptLoading(true);
      const data = await dismissRatingPrompt(token);
      setRatingPromptInfo((prev) => ({
        ...(prev || {}),
        shouldPrompt: false,
        hasSubmitted: false,
        daysUntilNextPrompt: 3,
        nextPromptDate: data?.nextPromptDate,
      }));
      setRatingPromptOpen(false);
    } catch (error) {
      console.error("[PageRoutes] rating dismiss failed:", error);
      setRatingPromptOpen(false);
    } finally {
      setRatingPromptLoading(false);
    }
  }, []);

  // Get SSE endpoint URL - memoize to prevent unnecessary reconnections
  const sseUrl = useMemo(() => {
    const isDev = import.meta.env.DEV;
    const protocol = window.location.protocol;
    const host = window.location.hostname;
    const apiPort = isDev ? "4000" : window.location.port || "";
    return isDev
      ? `${protocol}//${host}:${apiPort}/api/sse/events`
      : `${protocol}//${host}${apiPort ? `:${apiPort}` : ""}/api/sse/events`;
  }, []); // Only calculate once on mount

  const sseConnection = useServerSentEvents({
    url: sseUrl,
    token: authToken,
    enabled: Boolean(user && authToken),
    eventHandlers: suspensionHandlers,
  });

  useEffect(() => {
    checkAuthentication();
  }, [checkAuthentication]);

  useEffect(() => {
    if (user) {
      const isNewUser = prevUserIdRef.current !== user.id;
      if (isNewUser) {
        initialSuspensionCheckRef.current = true;
        prevUserIdRef.current = user.id;
      }

      // Parallelize suspension status and rating prompt checks for faster loading
      Promise.all([fetchSuspensionStatus(false), checkRatingPrompt()]).catch(
        (error) => {
          console.error(
            "[PageRoutes] Error in parallel user data fetch:",
            error
          );
        }
      );
    } else {
      setSuspension(null);
      setAppealOpen(false);
      setSuspensionReady(true);
      initialSuspensionCheckRef.current = false;
      prevUserIdRef.current = null;
      setRatingPromptOpen(false);
      setRatingPromptInfo(null);
    }
  }, [user, fetchSuspensionStatus, checkRatingPrompt]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");

    if (!token || !savedUser) {
      if (user) {
        setUser(null);
        setSuspensionReady(true);
        navigate("/", { replace: true });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  useEffect(() => {
    const handlePopState = () => {
      setTimeout(() => {
        const token = localStorage.getItem("token");
        const savedUser = localStorage.getItem("user");
        if (!token || !savedUser) {
          setSuspensionReady(true);
          navigate("/", { replace: true });
        }
      }, 0);
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [navigate]);

  // Initial fetch on mount/login - optimized to parallelize with suspension check
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || !user) return;

    // Only fetch if this is the first time or user changed
    if (prevUserIdRef.current !== user.id) {
      // Parallelize user data fetch with suspension check for faster initial load
      const fetchInitialStatus = async () => {
        try {
          // Use Promise.allSettled to prevent one failure from blocking the other
          // Increased timeout to 60 seconds (1 minute) to handle slow server responses
          const [userResponseResult, suspensionResponseResult] =
            await Promise.allSettled([
              fetchWithTimeout(
                "/api/public/me",
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                  },
                },
                60000
              ),
              fetchWithTimeout(
                "/api/suspensions/me/status",
                {
                  method: "GET",
                  headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                  },
                },
                60000
              ),
            ]);

          // Process user data (non-blocking - if it fails, user data from localStorage is used)
          if (
            userResponseResult.status === "fulfilled" &&
            userResponseResult.value.ok
          ) {
            try {
              const userData = await userResponseResult.value.json();
              if (userData.success && userData.data) {
                const updatedUser = { ...userData.data };
                localStorage.setItem("user", JSON.stringify(updatedUser));
                setUser(updatedUser);
              }
            } catch (parseError) {
              console.warn(
                "[PageRoutes] Failed to parse user data:",
                parseError
              );
              // Continue with existing user data from localStorage
            }
          } else {
            // User fetch failed or timed out - use existing data from localStorage
            console.warn(
              "[PageRoutes] User data fetch failed, using cached data"
            );
          }

          // Process suspension data (non-blocking)
          if (
            suspensionResponseResult.status === "fulfilled" &&
            suspensionResponseResult.value.ok
          ) {
            try {
              const suspensionData =
                await suspensionResponseResult.value.json();
              if (suspensionData.data !== undefined) {
                setSuspension(suspensionData.data || null);
                if (!suspensionData.data) {
                  setAppealOpen(false);
                }
              }
              setSuspensionReady(true);
              initialSuspensionCheckRef.current = false;
            } catch (parseError) {
              console.warn(
                "[PageRoutes] Failed to parse suspension data:",
                parseError
              );
              // Default to no suspension if parse fails
              setSuspension(null);
              setSuspensionReady(true);
              initialSuspensionCheckRef.current = false;
            }
          } else {
            // Suspension check failed - default to no suspension
            setSuspension(null);
            setSuspensionReady(true);
            initialSuspensionCheckRef.current = false;
          }
        } catch (error) {
          console.error("Failed to fetch initial user status:", error);
        }
      };

      fetchInitialStatus();
    }
    // Poll for suspension status updates (including unread counts)
    if (user?.id) {
      const pollInterval = setInterval(() => {
        fetchSuspensionStatus(false);
      }, 5000); // Poll every 5 seconds

      return () => clearInterval(pollInterval);
    }
  }, [user?.id, fetchSuspensionStatus]);

  useEffect(() => {
    if (!suspension) {
      setAppealOpen(false);
    }
  }, [suspension]);

  // Only show global loader if we're still checking authentication
  // Don't block UI for suspension check - let skeleton loaders show
  const showGlobalLoader = loading;

  if (showGlobalLoader) {
    return (
      <Box
        sx={{
          display: "flex",
          minHeight: "100vh",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#FAFAFA",
        }}
      >
        <CircularProgress sx={{ color: "#2D6A4F" }} />
      </Box>
    );
  }

  // If suspension check is still loading and we don't have user yet, show loader
  // Otherwise, show UI immediately with skeleton loaders
  if (!user) {
    return (
      <Box
        sx={{
          display: "flex",
          minHeight: "100vh",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#FAFAFA",
        }}
      >
        <CircularProgress sx={{ color: "#2D6A4F" }} />
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex" }}>
      <Navbar
        user={user}
        isSuspended={Boolean(suspension)}
        onLogout={requestLogout}
      />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3 },
          mt: { xs: 8, sm: 9 },
          pb: { xs: 10, md: 3 },
          backgroundColor: "#FAFAFA",
          // mt already offsets the fixed app bar, so subtract it to avoid a needless scroll
          minHeight: { xs: "calc(100vh - 64px)", sm: "calc(100vh - 72px)" },
          width: "100%",
          maxWidth: "100%",
          // clip (unlike hidden) doesn't create a scroll container, so position: sticky keeps working
          overflowX: "clip",
          boxSizing: "border-box",
        }}
      >
        {/* Show SuspensionGate if suspension exists, otherwise show routes immediately */}
        {/* Suspension check happens in background - don't block UI */}
        {suspension && suspensionReady ? (
          <SuspensionGate
            user={user}
            suspension={suspension}
            onAppealClick={() => setAppealOpen(true)}
            onLogout={requestLogout}
            loading={loadingSuspension}
          />
        ) : (
          <Routes>
            <Route path="home" element={<Dashboard />} />
            <Route path="service-requests" element={<ServiceRequests />} />
            <Route path="service-requests/map" element={<ServiceRequestsMap />} />
            <Route path="services" element={<Services />} />
            <Route path="services/new" element={<ServiceDetail />} />
            <Route path="services/:id" element={<ServiceDetail />} />
            <Route path="services/:id/edit" element={<ServiceDetail />} />
            <Route path="projects" element={<Projects />} />
            <Route path="projects/new" element={<ProjectDetail />} />
            <Route path="projects/:id" element={<ProjectDetail />} />
            <Route path="projects/:id/edit" element={<ProjectDetail />} />
            <Route path="testimonials" element={<Testimonials />} />
            <Route path="testimonials/new" element={<TestimonialDetail />} />
            <Route path="testimonials/:id" element={<TestimonialDetail />} />
            <Route path="testimonials/:id/edit" element={<TestimonialDetail />} />
            <Route path="gallery" element={<Gallery />} />
            <Route path="gallery/new" element={<GalleryDetail />} />
            <Route path="gallery/:id" element={<GalleryDetail />} />
            <Route path="gallery/:id/edit" element={<GalleryDetail />} />
            <Route path="knowledge" element={<Knowledge />} />
            <Route path="knowledge/new" element={<ArticleDetail />} />
            <Route path="knowledge/:id" element={<ArticleDetail />} />
            <Route path="knowledge/:id/edit" element={<ArticleDetail />} />
            <Route path="courses" element={<Courses />} />
            <Route path="courses/new" element={<CourseDetail />} />
            <Route path="courses/:id" element={<CourseDetail />} />
            <Route path="courses/:id/edit" element={<CourseDetail />} />
            <Route path="bookings" element={<Bookings />} />
            <Route path="bookings/new" element={<BookingDetail />} />
            <Route path="bookings/:id" element={<BookingDetail />} />
            <Route path="bookings/:id/edit" element={<BookingDetail />} />
            <Route path="certificates" element={<Certificates />} />
            <Route path="certificates/new" element={<CertificateDetail />} />
            <Route path="certificates/:id" element={<CertificateDetail />} />
            <Route path="certificates/:id/edit" element={<CertificateDetail />} />
            <Route
              path="wallet"
              element={<Wallet user={user} setUser={setUser} />}
            />
            <Route path="*" element={<Navigate to="/home" replace />} />
          </Routes>
        )}
      </Box>
      <SuspensionAppealModal
        open={appealOpen && Boolean(suspension)}
        onClose={() => setAppealOpen(false)}
        suspension={suspension}
        token={authToken}
        onSuspensionUpdated={handleSuspensionUpdated}
      />
      <RatingPromptDialog
        open={ratingPromptOpen}
        submitting={ratingPromptLoading}
        onDismiss={handleRatingDismiss}
        onSubmit={handleRatingSubmit}
        daysUntilNextPrompt={ratingPromptInfo?.daysUntilNextPrompt ?? null}
      />
    </Box>
  );
}

export default PageRoutes;
