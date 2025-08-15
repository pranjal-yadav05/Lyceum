import React, { useState } from "react";
import { Container } from "@mui/material";
import { useNavigate } from "react-router-dom";
import UnderDevelopmentModal from "../components/UnderDevelopmentModal";

const AdminErrors = () => {
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
        title="Error Logs"
        message="The error logging features are currently under development. This section will provide a comprehensive view of system errors, warnings, and debugging information."
      />
    </Container>
  );
};

export default AdminErrors;
