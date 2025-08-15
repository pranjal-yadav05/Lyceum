import React, { useState } from "react";
import { Container } from "@mui/material";
import { useNavigate } from "react-router-dom";
import UnderDevelopmentModal from "../components/UnderDevelopmentModal";

const AdminSettings = () => {
  const [isModalOpen, setIsModalOpen] = useState(true);
  const navigate = useNavigate();

  const handleClose = () => {
    setIsModalOpen(false);
    navigate("/admin/dashboard");
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <UnderDevelopmentModal
        isOpen={isModalOpen}
        onClose={handleClose}
        title="System Settings"
        message="The system settings features are currently under development. This section will allow you to configure global system settings, manage integrations, and customize platform behavior."
      />
    </Container>
  );
};

export default AdminSettings;
