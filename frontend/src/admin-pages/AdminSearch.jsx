import React, { useState } from "react";
import { Container } from "@mui/material";
import { useNavigate } from "react-router-dom";
import UnderDevelopmentModal from "../components/UnderDevelopmentModal";

const AdminSearch = () => {
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
        title="Search Analytics"
        message="The search analytics features are currently under development. This section will provide detailed insights into search patterns, popular queries, and user search behavior."
      />
    </Container>
  );
};

export default AdminSearch;
