import React from "react";
import { Container } from "@mui/material";
import AdminComingSoon from "../components/AdminComingSoon";

const AdminSettings = () => (
  <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
    <AdminComingSoon
      title="System Settings"
      description="Advanced system configuration beyond the dashboard toggles. This section is planned for a future release."
    />
  </Container>
);

export default AdminSettings;
