import React, { useState } from "react";
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  Tooltip,
  IconButton,
} from "@mui/material";
import {
  Home,
  Logout,
  GridView,
  ChevronLeft,
  ChevronRight,
  SupportAgentRounded,
  DesignServicesRounded,
  WorkRounded,
  RateReviewRounded,
  PhotoLibraryRounded,
  SchoolRounded,
  EventAvailableRounded,
  WorkspacePremiumRounded,
  MenuBookRounded,
  MoreHorizRounded,
} from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import Swal from "sweetalert2";
import { getDisplayInitial, getDisplayName } from "../utils/userDisplay";

const EXPANDED_WIDTH = 260;
const COLLAPSED_WIDTH = 72;
const COLLAPSE_STORAGE_KEY = "navCollapsed";
const widthTransition = "width 225ms cubic-bezier(0.4, 0, 0.6, 1)";
const layoutTransition = `${widthTransition}, margin 225ms cubic-bezier(0.4, 0, 0.6, 1)`;

// `pinned` items sit in the mobile bottom bar; the rest open from "More"
const baseMenuItems = [
  { text: "Home", icon: <Home />, path: "/home", mobileLabel: "Home", pinned: true },
  { text: "Service Requests", icon: <SupportAgentRounded />, path: "/service-requests", mobileLabel: "Requests", pinned: true },
  { text: "Training Bookings", icon: <EventAvailableRounded />, path: "/bookings", mobileLabel: "Bookings", pinned: true },
  { group: "Website content", text: "Services", icon: <DesignServicesRounded />, path: "/services", mobileLabel: "Services", pinned: true },
  { group: "Website content", text: "Projects", icon: <WorkRounded />, path: "/projects", mobileLabel: "Projects" },
  { group: "Website content", text: "Testimonials", icon: <RateReviewRounded />, path: "/testimonials", mobileLabel: "Reviews" },
  { group: "Website content", text: "Gallery", icon: <PhotoLibraryRounded />, path: "/gallery", mobileLabel: "Gallery" },
  { group: "Website content", text: "Knowledge Center", icon: <MenuBookRounded />, path: "/knowledge", mobileLabel: "Articles" },
  { group: "Training", text: "Courses", icon: <SchoolRounded />, path: "/courses", mobileLabel: "Courses" },
  { group: "Training", text: "Certificates", icon: <WorkspacePremiumRounded />, path: "/certificates", mobileLabel: "Certificates" },
];

export default function Navbar({ user, isSuspended = false, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = useState(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem(COLLAPSE_STORAGE_KEY) === "true"
  );
  const drawerWidth = collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH;

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      localStorage.setItem(COLLAPSE_STORAGE_KEY, String(!prev));
      return !prev;
    });
  };

  const menuItems = isSuspended ? [] : baseMenuItems;
  // Sub-pages such as /service-requests/map keep their parent item highlighted
  const isPathActive = (path) =>
    location.pathname === path || location.pathname.startsWith(`${path}/`);
  const pinnedItems = menuItems.filter((item) => item.pinned);
  const moreItems = menuItems.filter((item) => !item.pinned);
  const pinnedIndex = pinnedItems.findIndex((item) => isPathActive(item.path));
  const moreActive = moreItems.some((item) => isPathActive(item.path));
  const bottomValue = moreActive ? "more" : pinnedIndex === -1 ? 0 : pinnedIndex;

  const handleProfileMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleProfileMenuClose = () => setAnchorEl(null);

  const handleLogout = async () => {
    handleProfileMenuClose();

    // Let the menu finish closing before the dialog opens
    await new Promise((resolve) => setTimeout(resolve, 100));

    if (onLogout) {
      await onLogout();
      return;
    }

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
    });

    if (result.isConfirmed) {
      localStorage.clear();
      navigate("/", { replace: true });
    }
  };

  const drawer = (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "flex-start",
          minHeight: "64px",
          height: "64px",
          px: collapsed ? 0.75 : 2,
          py: 0,
          overflow: "hidden",
          background:
            "linear-gradient(135deg, rgba(45, 106, 79, 0.1) 0%, rgba(216, 243, 220, 0.05) 100%)",
          borderBottom: "1px solid rgba(45, 106, 79, 0.2)",
        }}
      >
        <img
          src="/favicon.ico?v=2"
          alt="Mcaludoh Consultancy logo"
          style={{
            height: collapsed ? "28px" : "32px",
            width: collapsed ? "28px" : "32px",
            objectFit: "contain",
            flexShrink: 0,
          }}
        />
        {!collapsed && (
          <>
            <Box sx={{ ml: 1.25, minWidth: 0, lineHeight: 1 }}>
              <Typography
                sx={{
                  fontWeight: 700,
                  fontSize: "1rem",
                  lineHeight: 1.15,
                  whiteSpace: "nowrap",
                  background: "linear-gradient(45deg, #2D6A4F, #1B4332)",
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Mcaludoh
              </Typography>
              <Typography
                sx={{
                  fontSize: "0.68rem",
                  fontWeight: 600,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "#40916C",
                  whiteSpace: "nowrap",
                }}
              >
                Consultancy
              </Typography>
            </Box>
          </>
        )}
        <Tooltip
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          placement="right"
          arrow
        >
          <IconButton
            onClick={toggleCollapsed}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!collapsed}
            size="small"
            sx={{
              ml: collapsed ? 0.5 : "auto",
              p: 0,
              flexShrink: 0,
              color: "#2D6A4F",
              border: "1px solid rgba(45, 106, 79, 0.3)",
              borderRadius: collapsed ? "8px" : "10px",
              width: collapsed ? 24 : 32,
              height: collapsed ? 24 : 32,
            }}
          >
            {collapsed ? (
              <ChevronRight sx={{ fontSize: 18 }} />
            ) : (
              <ChevronLeft />
            )}
          </IconButton>
        </Tooltip>
      </Box>

      <Divider sx={{ borderColor: "rgba(45, 106, 79, 0.2)" }} />

      <List sx={{ flexGrow: 1, px: collapsed ? 1 : 2, pt: 2, overflowY: "auto", overflowX: "hidden" }}>
        {menuItems.map((item, index) => {
          const isActive = isPathActive(item.path);
          const startsGroup = item.group && item.group !== menuItems[index - 1]?.group;
          return (
            <React.Fragment key={item.text}>
            {startsGroup &&
              (collapsed ? (
                <Divider sx={{ my: 1, borderColor: "rgba(45, 106, 79, 0.15)" }} />
              ) : (
                <Typography
                  sx={{
                    px: 2,
                    pt: 1.5,
                    pb: 0.75,
                    fontSize: "0.68rem",
                    fontWeight: 700,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: "#40916C",
                  }}
                >
                  {item.group}
                </Typography>
              ))}
            <ListItem disablePadding sx={{ mb: 0.5 }}>
              <Tooltip
                title={collapsed ? item.text : ""}
                placement="right"
                arrow
              >
                <ListItemButton
                  onClick={() => navigate(item.path)}
                  aria-label={item.text}
                  sx={{
                    borderRadius: "12px",
                    justifyContent: collapsed ? "center" : "flex-start",
                    backgroundColor: isActive
                      ? "rgba(45, 106, 79, 0.15)"
                      : "transparent",
                    "&:hover": { backgroundColor: "rgba(45, 106, 79, 0.1)" },
                    py: 1.1,
                    px: collapsed ? 0 : 2,
                  }}
                >
                  <ListItemIcon
                    sx={{
                      color: isActive ? "#2D6A4F" : "rgba(26, 26, 26, 0.7)",
                      minWidth: collapsed ? 0 : 40,
                      justifyContent: "center",
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    sx={{ display: collapsed ? "none" : "block", m: 0 }}
                    primary={
                    <Typography
                      component="span"
                      sx={{
                        fontWeight: isActive ? 600 : 500,
                        color: isActive ? "#1a1a1a" : "rgba(26, 26, 26, 0.7)",
                        fontSize: "0.95rem",
                      }}
                    >
                      {item.text}
                    </Typography>
                    }
                  />
                </ListItemButton>
              </Tooltip>
            </ListItem>
            </React.Fragment>
          );
        })}
        {menuItems.length === 0 && !collapsed && (
          <Box
            sx={{
              mt: 3,
              p: 2,
              borderRadius: 2,
              border: "1px dashed rgba(45, 106, 79, 0.4)",
              backgroundColor: "rgba(45, 106, 79, 0.08)",
              color: "#7f8c8d",
            }}
          >
            <Typography variant="subtitle2" fontWeight={600}>
              Account Suspended
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              Access to navigation is temporarily disabled. Use the appeal
              button on the main screen to contact support or logout to return
              later.
            </Typography>
          </Box>
        )}
      </List>

      <Box
        sx={{
          p: collapsed ? 1 : 2,
          borderTop: "1px solid rgba(45, 106, 79, 0.2)",
          background:
            "linear-gradient(135deg, rgba(216, 243, 220, 0.2) 0%, rgba(255, 255, 255, 0.1) 100%)",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: collapsed ? "center" : "flex-start",
            p: collapsed ? 1 : 1.5,
            borderRadius: "12px",
            backgroundColor: "rgba(255, 255, 255, 0.5)",
          }}
        >
          <Tooltip
            title={
              collapsed
                ? getDisplayName(user, {
                    fallback: "User",
                    currentUserId: user?.id,
                  })
                : ""
            }
            placement="right"
            arrow
          >
            <Avatar
              sx={{
                width: 40,
                height: 40,
                bgcolor: "#2D6A4F",
                fontWeight: 600,
                flexShrink: 0,
              }}
            >
              {getDisplayInitial(user, {
                fallback: "U",
                currentUserId: user?.id,
              })}
            </Avatar>
          </Tooltip>
          <Box
            sx={{
              display: collapsed ? "none" : "block",
              ml: 1.5,
              flexGrow: 1,
              minWidth: 0,
            }}
          >
            <Typography
              variant="body2"
              sx={{
                fontWeight: 600,
                color: "#1a1a1a",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {getDisplayName(user, {
                fallback: "User",
                currentUserId: user?.id,
              })}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: "rgba(26, 26, 26, 0.6)",
                display: "block",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {user?.email || ""}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: "flex" }}>
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          transition: layoutTransition,
          backgroundColor: "rgba(255, 255, 255, 0.98)",
          backdropFilter: "blur(20px)",
          boxShadow: "0 4px 20px rgba(45, 106, 79, 0.1)",
          borderBottom: "1px solid rgba(45, 106, 79, 0.2)",
        }}
      >
        <Toolbar>
          <Box sx={{ flexGrow: 1 }} />
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Avatar
              src={
                user?.photo
                  ? user.photo.startsWith("http")
                    ? user.photo
                    : user.photo.startsWith("/")
                      ? user.photo
                      : `/uploads/${user.photo}`
                  : undefined
              }
              sx={{
                width: 36,
                height: 36,
                bgcolor: "#2D6A4F",
                fontWeight: 600,
                fontSize: "1rem",
                border: "2px solid rgba(45, 106, 79, 0.3)",
              }}
            >
              {getDisplayInitial(user, {
                fallback: "U",
                currentUserId: user?.id,
              })}
            </Avatar>
            <Tooltip title="Account" arrow>
              <Box
                component="button"
                onClick={handleProfileMenuOpen}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  border: "none",
                  background: "transparent",
                  padding: 0.5,
                  borderRadius: "8px",
                  transition: "all 0.3s ease",
                  "&:hover": { backgroundColor: "rgba(45, 106, 79, 0.1)" },
                }}
              >
                <GridView sx={{ fontSize: 28, color: "#2D6A4F" }} />
              </Box>
            </Tooltip>
          </Box>
          <Menu
            id="account-menu"
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleProfileMenuClose}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
            PaperProps={{
              sx: {
                borderRadius: "12px",
                mt: 1,
                minWidth: 200,
                boxShadow: "0 8px 32px rgba(45, 106, 79, 0.15)",
                border: "1px solid rgba(45, 106, 79, 0.2)",
              },
            }}
            disableScrollLock={true}
          >
            <MenuItem
              onClick={(e) => {
                e.preventDefault();
                handleLogout();
              }}
            >
              <Logout sx={{ mr: 2, color: "#2D6A4F" }} />
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{
          width: { md: drawerWidth },
          flexShrink: { md: 0 },
          transition: widthTransition,
        }}
      >
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", md: "block" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
              overflowX: "hidden",
              transition: widthTransition,
              borderRight: "1px solid rgba(45, 106, 79, 0.2)",
              background:
                "linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(216, 243, 220, 0.1) 100%)",
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {menuItems.length > 0 && (
        <Paper
          sx={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 1000,
            display: { xs: "block", md: "none" },
            borderTop: "1px solid rgba(45, 106, 79, 0.2)",
            boxShadow: "0 -4px 20px rgba(45, 106, 79, 0.1)",
            backgroundColor: "rgba(255, 255, 255, 0.98)",
            backdropFilter: "blur(20px)",
          }}
          elevation={3}
        >
          <BottomNavigation
            value={bottomValue}
            onChange={(event, newValue) => {
              if (newValue === "more") setMoreOpen(true);
              else navigate(pinnedItems[newValue].path);
            }}
            showLabels
            sx={{
              backgroundColor: "transparent",
              height: 70,
              "& .MuiBottomNavigationAction-root": {
                color: "rgba(26, 26, 26, 0.6)",
                minWidth: 0,
                padding: "6px 12px",
                outline: "none",
                "&:focus, &:focus-visible": { outline: "none" },
                "&.Mui-selected": { color: "#2D6A4F", fontWeight: 600 },
              },
              "& .MuiBottomNavigationAction-label": {
                fontSize: "0.7rem",
                fontWeight: 500,
                marginTop: "4px",
                "&.Mui-selected": { fontSize: "0.7rem", fontWeight: 600 },
              },
            }}
          >
            {pinnedItems.map((item, index) => (
              <BottomNavigationAction
                key={item.text}
                label={item.mobileLabel || item.text}
                icon={item.icon}
                value={index}
              />
            ))}
            {moreItems.length > 0 && (
              <BottomNavigationAction
                label="More"
                icon={<MoreHorizRounded />}
                value="more"
                onClick={() => setMoreOpen(true)}
              />
            )}
          </BottomNavigation>
        </Paper>
      )}

      <Drawer
        anchor="bottom"
        open={moreOpen}
        onClose={() => setMoreOpen(false)}
        sx={{ display: { md: "none" } }}
        PaperProps={{ sx: { borderTopLeftRadius: 22, borderTopRightRadius: 22, pb: 2 } }}
      >
        <Box sx={{ width: 40, height: 4, borderRadius: 2, bgcolor: "rgba(45, 106, 79, 0.25)", mx: "auto", mt: 1.25, mb: 1 }} />
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: 1,
            px: 2,
            pb: 1,
          }}
        >
          {moreItems.map((item) => {
            const isActive = isPathActive(item.path);
            return (
              <Box
                key={item.text}
                component="button"
                type="button"
                onClick={() => {
                  setMoreOpen(false);
                  navigate(item.path);
                }}
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 0.75,
                  py: 1.75,
                  px: 1,
                  border: "1px solid",
                  borderColor: isActive ? "rgba(45, 106, 79, 0.35)" : "rgba(45, 106, 79, 0.12)",
                  borderRadius: "16px",
                  bgcolor: isActive ? "rgba(45, 106, 79, 0.1)" : "#fff",
                  color: isActive ? "#2D6A4F" : "rgba(26, 26, 26, 0.75)",
                  font: "inherit",
                  fontSize: "0.78rem",
                  fontWeight: isActive ? 700 : 500,
                  cursor: "pointer",
                  textAlign: "center",
                  "& svg": { color: isActive ? "#2D6A4F" : "#40916C" },
                }}
              >
                {item.icon}
                {item.text}
              </Box>
            );
          })}
        </Box>
      </Drawer>
    </Box>
  );
}
