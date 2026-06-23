import React from "react";
import { Container } from "@mui/material";
import AdminComingSoon from "../components/AdminComingSoon";

const AdminSearch = () => (
  <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
    <AdminComingSoon
      title="Search Configuration"
      description="Configure search indexing, filters, and discovery settings. This section is planned for a future release."
    />
  </Container>
);

export default AdminSearch;
