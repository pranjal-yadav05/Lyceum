import React from "react";
import { Container } from "@mui/material";
import AdminComingSoon from "../components/AdminComingSoon";

const AdminErrors = () => (
  <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
    <AdminComingSoon
      title="Error Monitoring"
      description="View application errors, stack traces, and resolution status. This section is planned for a future release."
    />
  </Container>
);

export default AdminErrors;
