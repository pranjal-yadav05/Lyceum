import React from "react";
import { Box, Typography, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { Construction } from "lucide-react";

const AdminComingSoon = ({ title, description }) => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "50vh",
        textAlign: "center",
        gap: 2,
      }}
    >
      <Construction size={48} color="#a855f7" />
      <Typography variant="h5" sx={{ color: "white", fontWeight: "bold" }}>
        {title}
      </Typography>
      <Typography
        variant="body1"
        sx={{ color: "rgba(255,255,255,0.7)", maxWidth: 480 }}
      >
        {description}
      </Typography>
      <Button
        variant="outlined"
        onClick={() => navigate("/admin/dashboard")}
        sx={{ color: "white", borderColor: "#9333ea", mt: 2 }}
      >
        Back to Dashboard
      </Button>
    </Box>
  );
};

export default AdminComingSoon;
