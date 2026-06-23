import React from "react";
import { Container } from "@mui/material";
import AdminComingSoon from "../components/AdminComingSoon";

const AdminSecurity = () => (
  <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
    <AdminComingSoon
      title="Security Settings"
      description="Audit logs, access policies, and security monitoring. This section is planned for a future release."
    />
  </Container>
);

export default AdminSecurity;
