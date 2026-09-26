import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Collapse,
  IconButton,
  InputAdornment,
  Link,
  TextField,
  Typography,
} from "@mui/material";
import {
  ArrowBackRounded,
  ArrowForwardRounded,
  AssignmentTurnedInOutlined,
  CheckCircleRounded,
  KeyboardCapslockRounded,
  LockOutlined,
  MailOutlineRounded,
  MenuBookOutlined,
  SchoolOutlined,
  ShieldOutlined,
  SpaRounded,
  VisibilityOffOutlined,
  VisibilityOutlined,
} from "@mui/icons-material";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

const GREEN = {
  deep: "#1B4332",
  main: "#2D6A4F",
  mid: "#40916C",
  light: "#52B788",
  mist: "#D8F3DC",
  cream: "#F7F4EC",
  ink: "#1B2A22",
};

// The page is locked to the viewport; these tiers progressively drop
// secondary content so it never needs to scroll on short screens.
const H = {
  760: "@media (max-height: 760px)",
  700: "@media (max-height: 700px)",
  560: "@media (max-height: 560px)",
  460: "@media (max-height: 460px)",
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const BACKGROUNDS = ["/images/login-1.jpg", "/images/login-2.jpg", "/images/login-3.jpg"];
const LOGO = "/images/logo.png";

const FEATURES = [
  { icon: AssignmentTurnedInOutlined, title: "Service requests & clients", text: "Track every enquiry from first call to signed proposal." },
  { icon: SpaRounded, title: "Projects & gallery", text: "Publish case studies, before-and-after photos and results." },
  { icon: SchoolOutlined, title: "Training & certificates", text: "Schedule sessions, manage bookings and issue certificates." },
  { icon: MenuBookOutlined, title: "Knowledge centre", text: "Write articles and approve client testimonials." },
];

class AuthError extends Error {}

async function requestLogin(email, password) {
  let response;
  let payload = {};
  try {
    response = await fetch("/api/users/login", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ email, password }),
    });
    payload = await response.json().catch(() => ({}));
  } catch {
    response = null;
  }

  if (response?.ok && payload.success && payload.data?.token) return payload.data;
  if (response && [400, 401, 403].includes(response.status)) {
    throw new AuthError(payload.message || "Invalid email or password.");
  }

  throw new Error("We can't reach the server right now. Please check your connection and try again.");
}

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "14px",
    backgroundColor: "#FFFFFF",
    transition: "box-shadow 0.2s ease",
    "& fieldset": { borderColor: "rgba(27, 67, 50, 0.16)" },
    "&:hover fieldset": { borderColor: "rgba(45, 106, 79, 0.45)" },
    "&.Mui-error fieldset": { borderColor: "#C0392B" },
    "&.Mui-focused, &.Mui-focused.Mui-error": { boxShadow: "0 0 0 4px rgba(82, 183, 136, 0.18)" },
    "&.Mui-focused fieldset, &.Mui-focused.Mui-error fieldset": { borderColor: GREEN.mid, borderWidth: 1.5 },
  },
  "& .MuiInputLabel-root.Mui-focused, & .MuiInputLabel-root.Mui-focused.Mui-error": { color: GREEN.main },
  "& .MuiInputBase-input": { py: 1.6, fontSize: "0.95rem", [H[700]]: { py: 1.1 } },
  "& .MuiFormHelperText-root": { mt: 0.4, [H[560]]: { mt: 0.2, fontSize: "0.72rem" } },
  "& .MuiInputBase-input:-webkit-autofill": {
    WebkitBoxShadow: "0 0 0 100px #FFFFFF inset",
    WebkitTextFillColor: GREEN.ink,
  },
};

const submitSx = {
  py: 1.5,
  borderRadius: "14px",
  fontWeight: 700,
  fontSize: "1rem",
  textTransform: "none",
  letterSpacing: "0.01em",
  color: "#FFFFFF",
  background: `linear-gradient(135deg, ${GREEN.mid} 0%, ${GREEN.main} 55%, ${GREEN.deep} 100%)`,
  boxShadow: "0 14px 30px rgba(27, 67, 50, 0.28)",
  transition: "transform 0.2s ease, box-shadow 0.2s ease",
  "& .MuiButton-endIcon": { transition: "transform 0.2s ease" },
  "&:hover": {
    background: `linear-gradient(135deg, ${GREEN.light} 0%, ${GREEN.mid} 55%, ${GREEN.main} 100%)`,
    transform: "translateY(-1px)",
    boxShadow: "0 18px 36px rgba(27, 67, 50, 0.34)",
    "& .MuiButton-endIcon": { transform: "translateX(4px)" },
  },
  "&.Mui-disabled": { color: "rgba(255, 255, 255, 0.85)", opacity: 0.8 },
  [H[700]]: { py: 1.1, fontSize: "0.95rem" },
};

const titleSx = {
  fontWeight: 800,
  fontSize: "clamp(1.3rem, 4.2vh, 2rem)",
  lineHeight: 1.2,
  letterSpacing: "-0.02em",
  color: GREEN.ink,
};

const subtitleSx = {
  mt: 0.75,
  mb: "clamp(14px, 3.5vh, 28px)",
  color: "rgba(27, 42, 34, 0.62)",
  fontSize: "0.93rem",
  lineHeight: 1.5,
  [H[700]]: { display: "none" },
};

const emailAdornment = {
  input: {
    startAdornment: (
      <InputAdornment position="start">
        <MailOutlineRounded sx={{ color: GREEN.mid }} />
      </InputAdornment>
    ),
  },
};

function Spinner({ label }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
      <CircularProgress size={18} thickness={5} sx={{ color: "#FFFFFF" }} /> {label}
    </Box>
  );
}

function Brand({ light = false, compact = false }) {
  const size = compact ? 38 : 48;
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
      <Box
        sx={{
          width: size,
          height: size,
          flexShrink: 0,
          borderRadius: "14px 14px 14px 4px",
          display: "grid",
          placeItems: "center",
          backgroundColor: light ? "rgba(247, 244, 236, 0.95)" : "#FFFFFF",
          boxShadow: "0 8px 20px rgba(10, 30, 20, 0.18)",
          overflow: "hidden",
        }}
      >
        <Box component="img" src={LOGO} alt="" sx={{ width: "82%", height: "82%", objectFit: "contain" }} />
      </Box>
      <Box>
        <Typography sx={{ fontWeight: 800, fontSize: compact ? "0.98rem" : "1.1rem", lineHeight: 1.1, color: light ? "#FFFFFF" : GREEN.ink }}>
          Mcaludoh Consultancy
        </Typography>
        <Typography sx={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: light ? GREEN.mist : GREEN.mid }}>
          Admin portal
        </Typography>
      </Box>
    </Box>
  );
}

function BrandPanel() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setIndex((i) => (i + 1) % BACKGROUNDS.length), 7000);
    return () => clearInterval(timer);
  }, []);

  return (
    <Box
      sx={{
        position: "relative",
        display: { xs: "none", md: "flex" },
        flexDirection: "column",
        justifyContent: "space-between",
        flex: { md: "0 0 50%", lg: "0 0 55%" },
        height: "100%",
        minHeight: 0,
        px: { md: 5, lg: 7 },
        py: "clamp(20px, 5vh, 56px)",
        color: "#FFFFFF",
        overflow: "hidden",
        borderRadius: "0 40px 40px 0",
        backgroundColor: GREEN.deep,
      }}
    >
      {BACKGROUNDS.map((src, i) => (
        <Box
          key={src}
          aria-hidden
          sx={{
            position: "absolute",
            inset: 0,
            backgroundImage: `url(${src})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: i === index ? 1 : 0,
            transition: "opacity 1.4s ease",
            "@keyframes loginZoom": { from: { transform: "scale(1.1)" }, to: { transform: "scale(1)" } },
            animation: i === index ? "loginZoom 9s ease-out forwards" : "none",
            "@media (prefers-reduced-motion: reduce)": { animation: "none" },
          }}
        />
      ))}
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(160deg, rgba(27, 67, 50, 0.94) 0%, rgba(27, 67, 50, 0.82) 45%, rgba(45, 106, 79, 0.62) 100%)",
        }}
      />
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          width: 460,
          height: 460,
          right: -160,
          bottom: -160,
          borderRadius: "50% 50% 0 50%",
          border: "1px solid rgba(216, 243, 220, 0.18)",
          boxShadow: "inset 0 0 0 40px rgba(216, 243, 220, 0.04), inset 0 0 0 90px rgba(216, 243, 220, 0.03)",
        }}
      />

      <Box sx={{ position: "relative", flexShrink: 0 }}>
        <Brand light />
      </Box>

      <Box sx={{ position: "relative", maxWidth: 560, my: "clamp(12px, 3vh, 40px)", minHeight: 0 }}>
        <Typography
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 1,
            mb: "clamp(10px, 2.5vh, 20px)",
            px: 1.5,
            py: 0.6,
            borderRadius: 999,
            fontSize: "0.72rem",
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: GREEN.mist,
            backgroundColor: "rgba(216, 243, 220, 0.1)",
            border: "1px solid rgba(216, 243, 220, 0.25)",
            [H[560]]: { display: "none" },
          }}
        >
          <ShieldOutlined sx={{ fontSize: 15 }} /> Team access only
        </Typography>
        <Typography
          component="h2"
          sx={{
            fontWeight: 800,
            fontSize: "clamp(1.5rem, min(3vw, 5.4vh), 2.9rem)",
            lineHeight: 1.1,
            letterSpacing: "-0.03em",
            mb: "clamp(8px, 2vh, 16px)",
          }}
        >
          Run the whole consultancy from{" "}
          <Box
            component="span"
            sx={{
              background: `linear-gradient(90deg, ${GREEN.light}, #B7E4C7)`,
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            one place.
          </Box>
        </Typography>
        <Typography
          sx={{
            fontSize: "clamp(0.88rem, 2vh, 1.02rem)",
            lineHeight: 1.65,
            color: "rgba(247, 244, 236, 0.82)",
            mb: "clamp(12px, 3.5vh, 32px)",
            [H[560]]: { display: "none" },
          }}
        >
          Requests, projects, training and website content, all kept in sync with the public site.
        </Typography>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "clamp(8px, 1.6vh, 12px)",
            "& .feature-text": { display: { md: "none", lg: "block" } },
            [H[760]]: { "& .feature-text": { display: "none" } },
            [H[560]]: { display: "none" },
          }}
        >
          {FEATURES.map(({ icon: Icon, title, text }, i) => (
            <Box
              key={title}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                p: "clamp(10px, 1.8vh, 14px)",
                borderRadius: "18px 18px 18px 6px",
                backgroundColor: "rgba(247, 244, 236, 0.07)",
                border: "1px solid rgba(216, 243, 220, 0.14)",
                backdropFilter: "blur(10px)",
                "@keyframes featureIn": {
                  from: { opacity: 0, transform: "translateY(14px)" },
                  to: { opacity: 1, transform: "translateY(0)" },
                },
                opacity: 0,
                animation: `featureIn 0.7s cubic-bezier(0.22, 1, 0.36, 1) ${0.15 + i * 0.1}s forwards`,
                "@media (prefers-reduced-motion: reduce)": { animation: "none", opacity: 1 },
              }}
            >
              <Box
                sx={{
                  width: 38,
                  height: 38,
                  flexShrink: 0,
                  borderRadius: "12px",
                  display: "grid",
                  placeItems: "center",
                  background: `linear-gradient(135deg, ${GREEN.light}, ${GREEN.mid})`,
                }}
              >
                <Icon sx={{ fontSize: 20 }} />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontWeight: 700, fontSize: "0.88rem", lineHeight: 1.3 }}>{title}</Typography>
                <Typography className="feature-text" sx={{ mt: 0.35, fontSize: "0.77rem", lineHeight: 1.5, color: "rgba(247, 244, 236, 0.7)" }}>
                  {text}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>

      <Box sx={{ position: "relative", flexShrink: 0, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2 }}>
        <Typography sx={{ fontSize: "0.8rem", color: "rgba(247, 244, 236, 0.65)" }}>
          Growing Smarter. Farming Sustainably. Building Better.
        </Typography>
        <Box sx={{ display: "flex", gap: 0.75 }} aria-hidden>
          {BACKGROUNDS.map((src, i) => (
            <Box
              key={src}
              sx={{
                height: 6,
                width: i === index ? 26 : 6,
                borderRadius: 99,
                backgroundColor: i === index ? GREEN.light : "rgba(216, 243, 220, 0.35)",
                transition: "width 0.4s ease, background-color 0.4s ease",
              }}
            />
          ))}
        </Box>
      </Box>
    </Box>
  );
}

function SignInForm({ onForgot, initialEmail }) {
  const navigate = useNavigate();
  const emailRef = useRef(null);
  const [values, setValues] = useState({ email: initialEmail, password: "" });
  const [touched, setTouched] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  const errors = {
    email: !values.email.trim()
      ? "Enter your email address."
      : !EMAIL_REGEX.test(values.email.trim())
        ? "That email doesn't look right."
        : "",
    password: !values.password ? "Enter your password." : "",
  };

  const update = (field) => (event) => {
    setValues((v) => ({ ...v, [field]: event.target.value }));
    if (error) setError("");
  };

  const checkCaps = (event) => setCapsLock(event.getModifierState?.("CapsLock") || false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setTouched({ email: true, password: true });
    if (errors.email || errors.password) return;

    setSubmitting(true);
    setError("");
    try {
      const { token, user } = await requestLogin(values.email.trim(), values.password);
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: `Welcome back, ${user.name?.split(" ")[0] || "there"}!`,
        showConfirmButton: false,
        timer: 2200,
        timerProgressBar: true,
        iconColor: GREEN.mid,
      });
      navigate("/home", { replace: true });
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <Box component="form" noValidate onSubmit={handleSubmit}>
      <Typography component="h1" sx={titleSx}>
        Welcome back
      </Typography>
      <Typography sx={subtitleSx}>
        Sign in to manage requests, projects, training and site content.
      </Typography>

      <Collapse in={Boolean(error)} unmountOnExit>
        <Alert
          severity="error"
          role="alert"
          onClose={() => setError("")}
          sx={{
            mb: "clamp(10px, 2.4vh, 20px)",
            py: 0.25,
            borderRadius: "14px",
            alignItems: "center",
            "& .MuiAlert-message": { fontSize: "0.85rem" },
            [H[700]]: { mt: 1.5 },
          }}
        >
          {error}
        </Alert>
      </Collapse>

      <Box sx={{ display: "grid", gap: "clamp(12px, 2.4vh, 18px)", [H[700]]: { mt: error ? 0 : 1.5 } }}>
        <TextField
          inputRef={emailRef}
          label="Email address"
          type="email"
          name="email"
          autoComplete="username"
          fullWidth
          value={values.email}
          onChange={update("email")}
          onBlur={() => setTouched((t) => ({ ...t, email: t.email || Boolean(values.email.trim()) }))}
          error={touched.email && Boolean(errors.email)}
          helperText={touched.email && errors.email}
          disabled={submitting}
          sx={fieldSx}
          slotProps={emailAdornment}
        />

        <Box>
          <TextField
            label="Password"
            type={showPassword ? "text" : "password"}
            name="password"
            autoComplete="current-password"
            fullWidth
            value={values.password}
            onChange={update("password")}
            onKeyDown={checkCaps}
            onKeyUp={checkCaps}
            onBlur={() => {
              setTouched((t) => ({ ...t, password: t.password || Boolean(values.password) }));
              setCapsLock(false);
            }}
            error={touched.password && Boolean(errors.password)}
            helperText={touched.password && errors.password}
            disabled={submitting}
            sx={fieldSx}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOutlined sx={{ color: GREEN.mid }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword((s) => !s)}
                      onMouseDown={(e) => e.preventDefault()}
                      edge="end"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      sx={{ color: "rgba(27, 42, 34, 0.55)" }}
                    >
                      {showPassword ? <VisibilityOffOutlined /> : <VisibilityOutlined />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />
          <Collapse in={capsLock}>
            <Typography
              role="status"
              sx={{ mt: 0.75, display: "flex", alignItems: "center", gap: 0.5, fontSize: "0.78rem", fontWeight: 600, color: "#B7791F" }}
            >
              <KeyboardCapslockRounded sx={{ fontSize: 16 }} /> Caps Lock is on
            </Typography>
          </Collapse>
        </Box>
      </Box>

      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-end",
          mt: "clamp(6px, 1.4vh, 12px)",
          mb: "clamp(10px, 2.4vh, 22px)",
        }}
      >
        <Link
          component="button"
          type="button"
          onClick={() => onForgot(values.email)}
          underline="hover"
          sx={{ fontWeight: 600, fontSize: "0.88rem", color: GREEN.main }}
        >
          Forgot password?
        </Link>
      </Box>

      <Button type="submit" fullWidth disabled={submitting} endIcon={!submitting && <ArrowForwardRounded />} sx={submitSx}>
        {submitting ? <Spinner label="Signing in…" /> : "Sign in"}
      </Button>
    </Box>
  );
}

function ForgotForm({ onBack, initialEmail }) {
  const emailRef = useRef(null);
  const [email, setEmail] = useState(initialEmail);
  const [touched, setTouched] = useState(false);
  const [sending, setSending] = useState(false);
  const [sentTo, setSentTo] = useState("");

  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  const error = !email.trim()
    ? "Enter your email address."
    : !EMAIL_REGEX.test(email.trim())
      ? "That email doesn't look right."
      : "";

  const handleSubmit = async (event) => {
    event.preventDefault();
    setTouched(true);
    if (error) return;
    setSending(true);
    await new Promise((resolve) => setTimeout(resolve, 1200));
    setSending(false);
    setSentTo(email.trim());
  };

  if (sentTo) {
    return (
      <Box sx={{ textAlign: "center" }}>
        <Box
          sx={{
            mx: "auto",
            mb: "clamp(10px, 2.5vh, 20px)",
            width: "clamp(48px, 9vh, 72px)",
            height: "clamp(48px, 9vh, 72px)",
            borderRadius: "50%",
            display: "grid",
            placeItems: "center",
            backgroundColor: GREEN.mist,
            color: GREEN.main,
          }}
        >
          <CheckCircleRounded sx={{ fontSize: "clamp(28px, 5vh, 40px)" }} />
        </Box>
        <Typography component="h1" sx={titleSx}>
          Check your inbox
        </Typography>
        <Typography sx={{ mt: 1, mb: "clamp(14px, 3.5vh, 28px)", color: "rgba(27, 42, 34, 0.65)", fontSize: "0.92rem", lineHeight: 1.6 }}>
          If <strong>{sentTo}</strong> belongs to a team account, a reset link is on its way. It expires in 30 minutes.
        </Typography>
        <Button fullWidth onClick={() => onBack(sentTo)} startIcon={<ArrowBackRounded />} sx={submitSx}>
          Back to sign in
        </Button>
      </Box>
    );
  }

  return (
    <Box component="form" noValidate onSubmit={handleSubmit}>
      <Link
        component="button"
        type="button"
        onClick={() => onBack(email)}
        underline="none"
        sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, mb: "clamp(8px, 2.2vh, 20px)", fontWeight: 600, fontSize: "0.88rem", color: GREEN.main }}
      >
        <ArrowBackRounded sx={{ fontSize: 18 }} /> Back to sign in
      </Link>
      <Typography component="h1" sx={titleSx}>
        Reset your password
      </Typography>
      <Typography sx={subtitleSx}>
        Enter your work email and we'll send you a secure link to choose a new password.
      </Typography>
      <TextField
        inputRef={emailRef}
        label="Email address"
        type="email"
        autoComplete="username"
        fullWidth
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onBlur={() => setTouched((t) => t || Boolean(email.trim()))}
        error={touched && Boolean(error)}
        helperText={touched && error}
        disabled={sending}
        sx={{ ...fieldSx, mb: "clamp(14px, 3vh, 24px)", [H[700]]: { mt: 1.5 } }}
        slotProps={emailAdornment}
      />
      <Button type="submit" fullWidth disabled={sending} sx={submitSx}>
        {sending ? <Spinner label="Sending link…" /> : "Send reset link"}
      </Button>
    </Box>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const [view, setView] = useState("signin");
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (localStorage.getItem("token") && localStorage.getItem("user")) {
      navigate("/home", { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    const { documentElement: html, body } = document;
    const previous = [html.style.overflow, body.style.overflow];
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    return () => {
      [html.style.overflow, body.style.overflow] = previous;
    };
  }, []);

  const switchView = (next) => (value = "") => {
    setEmail(value);
    setView(next);
  };

  return (
    <Box
      sx={{
        position: "fixed",
        inset: 0,
        height: "100dvh",
        display: "flex",
        overflow: "hidden",
        backgroundColor: GREEN.cream,
        fontFamily: "Poppins, sans-serif",
        "& .MuiTypography-root, & .MuiButton-root, & .MuiInputBase-root, & .MuiFormLabel-root, & .MuiFormHelperText-root, & .MuiLink-root":
          { fontFamily: "inherit" },
      }}
    >
      <Helmet>
        <title>Sign in | Mcaludoh Consultancy Admin</title>
      </Helmet>

      <BrandPanel />

      <Box
        component="main"
        sx={{
          position: "relative",
          flex: 1,
          height: "100%",
          minWidth: 0,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <Box
          aria-hidden
          sx={{
            position: "absolute",
            top: -140,
            right: -140,
            width: 380,
            height: 380,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(82, 183, 136, 0.18), transparent 70%)",
            pointerEvents: "none",
          }}
        />

        <Box
          sx={{
            display: { xs: "flex", md: "none" },
            flexShrink: 0,
            alignItems: "center",
            px: 2.5,
            pt: "clamp(12px, 2.5vh, 22px)",
            pb: "calc(clamp(12px, 2.5vh, 22px) + 24px)",
            background: `linear-gradient(160deg, ${GREEN.deep}, ${GREEN.main})`,
            borderRadius: "0 0 28px 28px",
            [H[560]]: { display: "none" },
          }}
        >
          <Brand light compact />
        </Box>

        <Box
          sx={{
            position: "relative",
            flex: 1,
            minHeight: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            px: { xs: 2, sm: 4 },
            py: "clamp(8px, 3vh, 40px)",
            mt: { xs: "-24px", md: 0 },
            [H[560]]: { mt: 0 },
          }}
        >
          <Box
            sx={{
              width: "100%",
              maxWidth: 440,
              maxHeight: "100%",
              px: { xs: 2.5, sm: 4.5 },
              py: "clamp(16px, 4.5vh, 40px)",
              borderRadius: "28px 28px 28px 8px",
              backgroundColor: "#FFFFFF",
              border: "1px solid rgba(27, 67, 50, 0.08)",
              boxShadow: "0 30px 70px rgba(27, 67, 50, 0.12)",
              overflowY: "auto",
              scrollbarWidth: "none",
              "&::-webkit-scrollbar": { display: "none" },
              "@keyframes cardIn": {
                from: { opacity: 0, transform: "translateY(20px)" },
                to: { opacity: 1, transform: "translateY(0)" },
              },
              animation: "cardIn 0.6s cubic-bezier(0.22, 1, 0.36, 1)",
              "@media (prefers-reduced-motion: reduce)": { animation: "none" },
            }}
          >
            {view === "signin" ? (
              <SignInForm key="signin" initialEmail={email} onForgot={switchView("forgot")} />
            ) : (
              <ForgotForm key="forgot" initialEmail={email} onBack={switchView("signin")} />
            )}
          </Box>
        </Box>

        <Box
          sx={{
            position: "relative",
            flexShrink: 0,
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            alignItems: "center",
            columnGap: 3,
            rowGap: 0.5,
            px: 2,
            pb: "clamp(10px, 2.5vh, 24px)",
            fontSize: "0.78rem",
            color: "rgba(27, 42, 34, 0.55)",
            "& .footer-extra": { [H[700]]: { display: "none" } },
            [H[460]]: { display: "none" },
          }}
        >
          <Box component="span" className="footer-extra" sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}>
            <ShieldOutlined sx={{ fontSize: 15, color: GREEN.mid }} /> Secure, encrypted sign-in
          </Box>
          <Box component="span" className="footer-extra">
            © {new Date().getFullYear()} Mcaludoh Consultancy
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
