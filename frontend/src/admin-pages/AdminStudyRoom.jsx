import React from "react";
import { Container } from "@mui/material";
import AdminComingSoon from "../components/AdminComingSoon";

const AdminStudyRoom = () => (
  <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
    <AdminComingSoon
      title="Study Room Management"
      description="Monitor study room sessions, configure room settings, and view usage statistics. This section is planned for a future release."
    />
  </Container>
);

export default AdminStudyRoom;
