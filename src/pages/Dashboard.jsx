import React from "react";
import { Box, Typography } from "@mui/material";
import { Helmet } from "react-helmet-async";

export default function Dashboard() {
  return (
    <Box>
      <Helmet>
        <title>Dashboard | Mcaludoh Consultancy Admin</title>
      </Helmet>
      <Typography
        component="h1"
        sx={{
          fontWeight: 700,
          fontSize: { xs: "1.5rem", sm: "1.85rem", md: "2.1rem" },
          lineHeight: 1.2,
          color: "#1B4332",
        }}
      >
        Mcaludoh Consultancy Dashboard
      </Typography>
    </Box>
  );
}
