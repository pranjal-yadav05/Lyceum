import React, { useState } from "react";
import { Container } from "@mui/material";
import { useNavigate } from "react-router-dom";
import UnderDevelopmentModal from "../components/UnderDevelopmentModal";

const AdminStudyRoom = () => {
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
        title="Study Room Management"
        message="The study room management features are currently under development. This section will allow you to monitor and manage study room sessions, configure settings, and view usage statistics."
      />
    </Container>
  );
};

export default AdminStudyRoom;
