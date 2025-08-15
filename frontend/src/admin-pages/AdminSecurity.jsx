import React, { useState } from "react";
import { Container } from "@mui/material";
import { useNavigate } from "react-router-dom";
import UnderDevelopmentModal from "../components/UnderDevelopmentModal";

const AdminSecurity = () => {
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
        title="Security Settings"
        message="The security settings features are currently under development. This section will allow you to manage authentication methods, configure access controls, and monitor security events."
      />
    </Container>
  );
};

export default AdminSecurity;
