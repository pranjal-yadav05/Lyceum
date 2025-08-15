import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Box,
  Button,
} from "@mui/material";
import { MessageCircle } from "lucide-react";
import axios from "axios";
import LoadingSpinner from "../components/LoadingSpinner"; // Import LoadingSpinner
import { useNavigate } from "react-router-dom";

const AdminFeedback = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedbackData, setFeedbackData] = useState([]);
  const [reviewedFeedback, setReviewedFeedback] = useState([]);
  const navigate = useNavigate();

  const fetchFeedback = async () => {
    try {
      setLoading(true);

      // Fetch all feedback
      const allFeedbackResponse = await axios.get(
        `${process.env.REACT_APP_API_URL}/admin/feedback`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const allFeedback = allFeedbackResponse.data;

      // Separate unreviewed and reviewed feedback
      const unreviewed = allFeedback.filter((feedback) => !feedback.reviewed);
      const reviewed = allFeedback.filter((feedback) => feedback.reviewed);

      setFeedbackData(unreviewed);
      setReviewedFeedback(reviewed);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching feedback:", err);
      setError("Failed to fetch feedback data");
      setLoading(false);
    }
  };

  const markAsReviewed = async (feedbackId) => {
    try {
      // Trigger backend to mark feedback as reviewed
      await axios.patch(
        `${process.env.REACT_APP_API_URL}/admin/feedback/${feedbackId}/review`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const feedbackToReview = feedbackData.find(
        (feedback) => feedback._id === feedbackId
      );
      if (feedbackToReview) {
        setFeedbackData((prev) =>
          prev.filter((feedback) => feedback._id !== feedbackId)
        );
        setReviewedFeedback((prev) => [...prev, feedbackToReview]);
      }
    } catch (error) {
      console.error("Error marking feedback as reviewed:", error);
    }
  };

  const markAsPending = async (feedbackId) => {
    try {
      // Trigger backend to mark feedback as pending
      await axios.patch(
        `${process.env.REACT_APP_API_URL}/admin/feedback/${feedbackId}/pending`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const feedbackToPending = reviewedFeedback.find(
        (feedback) => feedback._id === feedbackId
      );
      if (feedbackToPending) {
        setReviewedFeedback((prev) =>
          prev.filter((feedback) => feedback._id !== feedbackId)
        );
        setFeedbackData((prev) => [...prev, feedbackToPending]);
      }
    } catch (error) {
      console.error("Error marking feedback as pending:", error);
    }
  };

  useEffect(() => {
    fetchFeedback();
    const interval = setInterval(fetchFeedback, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        bgcolor="#0f0a1f" // Match Dashboard background
      >
        <LoadingSpinner />
      </Box>
    );
  }

  if (error) {
    return (
      <Container>
        <Typography variant="h6" gutterBottom sx={{ color: "white", mb: 2 }}>
          Error
        </Typography>
        <Typography variant="body1" sx={{ color: "rgba(255, 255, 255, 0.7)" }}>
          {error}
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Button
        variant="contained"
        color="primary"
        onClick={() => navigate("/admin/dashboard")}
        sx={{
          mb: 2,
          backgroundColor: "#1a1425",
          border: "1px solid rgba(147, 51, 234, 0.5)",
          color: "white",
          textTransform: "none",
          fontWeight: "bold",
          borderRadius: "8px",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          "&:hover": {
            backgroundColor: "rgba(147, 51, 234, 0.2)",
            borderColor: "#9333ea",
          },
        }}
      >
        Back to Dashboard
      </Button>
      <Typography
        variant="h5"
        gutterBottom
        sx={{
          color: "white",
          mb: 2,
          fontWeight: "bold",
          textAlign: "center",
        }}
      >
        User Feedback
      </Typography>
      <List>
        {feedbackData.length > 0 ? (
          feedbackData.map((feedback, index) => (
            <React.Fragment key={feedback._id}>
              <ListItem
                sx={{
                  display: "flex",
                  flexDirection: "column", // Stack content vertically
                  alignItems: "center", // Center content horizontally
                  py: 2,
                  bgcolor: "rgba(255, 255, 255, 0.1)",
                  backdropFilter: "blur(10px)",
                  WebkitBackdropFilter: "blur(10px)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  borderRadius: "8px",
                  mb: 2,
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: { xs: "column", sm: "row" }, // Column on small screens, row on larger screens
                    justifyContent: "space-between",
                    alignItems: { xs: "center", sm: "flex-start" }, // Centered on small screens
                    width: "100%",
                    gap: 2, // Add spacing between elements
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 2,
                      width: "100%",
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: "40px", mt: 0.5 }}>
                      <MessageCircle color="white" size={20} />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <>
                          <Typography
                            variant="body1"
                            sx={{
                              color: "white",
                              wordBreak: "break-word",
                              pr: 2,
                            }}
                          >
                            {feedback.feedback}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{
                              color: "rgba(255, 255, 255, 0.7)",
                              whiteSpace: "normal",
                              wordBreak: "break-word",
                              mt: 0.5,
                            }}
                          >
                            {`Submitted by: ${
                              feedback.user?.username || "Unknown User"
                            } `}
                            {window.innerWidth < 600
                              ? new Date(feedback.createdAt).toLocaleDateString(
                                  "en-GB"
                                )
                              : `submitted at ${new Date(
                                  feedback.createdAt
                                ).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  second: "2-digit",
                                })} on ${new Date(
                                  feedback.createdAt
                                ).toLocaleDateString("en-GB")}`}
                          </Typography>
                        </>
                      }
                      sx={{ m: 0 }}
                    />
                  </Box>
                  <Button
                    variant="outlined"
                    color="success"
                    onClick={() => markAsReviewed(feedback._id)}
                    sx={{
                      backdropFilter: "blur(10px)",
                      WebkitBackdropFilter: "blur(10px)",
                      backgroundColor: "rgba(0, 0, 0, 0.5)",
                      border: "1px solid rgba(0, 128, 0, 0.7)",
                      color: "rgba(0, 128, 0, 0.9)",
                      textTransform: "none",
                      fontWeight: "bold",
                      borderRadius: "8px",
                      whiteSpace: "nowrap", // Prevent text wrapping
                      px: 3, // Add horizontal padding
                      "&:hover": {
                        backgroundColor: "rgba(0, 128, 0, 0.2)",
                        borderColor: "rgba(0, 128, 0, 1)",
                      },
                      mt: { xs: 2, sm: 0 }, // Add margin on top for small screens
                      alignSelf: "center", // Center button horizontally
                    }}
                  >
                    Mark as Reviewed
                  </Button>
                </Box>
              </ListItem>
              {index < feedbackData.length - 1 && (
                <Divider
                  sx={{
                    bgcolor: "rgba(255, 255, 255, 0.1)",
                    mx: 2,
                  }}
                />
              )}
            </React.Fragment>
          ))
        ) : (
          <ListItem>
            <ListItemText
              primary="No feedback submitted yet"
              primaryTypographyProps={{ color: "white" }}
            />
          </ListItem>
        )}
      </List>
      {reviewedFeedback.length > 0 && (
        <>
          <Typography
            variant="h5"
            gutterBottom
            sx={{
              color: "white",
              mt: 4,
              mb: 2,
              fontWeight: "bold",
              textAlign: "center",
            }}
          >
            Reviewed Feedback
          </Typography>
          <List>
            {reviewedFeedback.map((feedback, index) => (
              <React.Fragment key={feedback._id}>
                <ListItem
                  sx={{
                    display: "flex",
                    flexDirection: "column", // Stack content vertically
                    alignItems: "center", // Center content horizontally
                    py: 2,
                    bgcolor: "rgba(255, 255, 255, 0.1)",
                    backdropFilter: "blur(10px)",
                    WebkitBackdropFilter: "blur(10px)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    borderRadius: "8px",
                    mb: 2,
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: { xs: "column", sm: "row" }, // Column on small screens, row on larger screens
                      justifyContent: "space-between",
                      alignItems: { xs: "center", sm: "flex-start" }, // Centered on small screens
                      width: "100%",
                      gap: 2, // Add spacing between elements
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 2,
                        width: "100%",
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: "40px", mt: 0.5 }}>
                        <MessageCircle color="white" size={20} />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <>
                            <Typography
                              variant="body1"
                              sx={{
                                color: "white",
                                wordBreak: "break-word",
                                pr: 2,
                              }}
                            >
                              {feedback.feedback}
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{
                                color: "rgba(255, 255, 255, 0.7)",
                                whiteSpace: "normal",
                                wordBreak: "break-word",
                                mt: 0.5,
                              }}
                            >
                              {`Submitted by: ${
                                feedback.user?.username || "Unknown User"
                              } `}
                              {window.innerWidth < 600
                                ? new Date(
                                    feedback.createdAt
                                  ).toLocaleDateString("en-GB")
                                : `submitted at ${new Date(
                                    feedback.createdAt
                                  ).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    second: "2-digit",
                                  })} on ${new Date(
                                    feedback.createdAt
                                  ).toLocaleDateString("en-GB")}`}
                            </Typography>
                          </>
                        }
                        sx={{ m: 0 }}
                      />
                    </Box>
                    <Button
                      variant="outlined"
                      color="warning"
                      onClick={() => markAsPending(feedback._id)}
                      sx={{
                        backdropFilter: "blur(10px)",
                        WebkitBackdropFilter: "blur(10px)",
                        backgroundColor: "rgba(0, 0, 0, 0.5)", // Darker opaque backdrop
                        border: "1px solid rgba(255, 165, 0, 0.7)", // Orange border
                        color: "rgba(255, 165, 0, 0.9)", // Orange font
                        textTransform: "none",
                        fontWeight: "bold",
                        borderRadius: "8px",
                        whiteSpace: "nowrap", // Prevent text wrapping
                        px: 3, // Add horizontal padding
                        "&:hover": {
                          backgroundColor: "rgba(255, 165, 0, 0.2)",
                          borderColor: "rgba(255, 165, 0, 1)",
                        },
                        mt: { xs: 2, sm: 0 }, // Add margin on top for small screens
                        alignSelf: "center", // Center button horizontally
                      }}
                    >
                      Mark as Pending
                    </Button>
                  </Box>
                </ListItem>
                {index < reviewedFeedback.length - 1 && (
                  <Divider
                    sx={{
                      bgcolor: "rgba(255, 255, 255, 0.1)",
                      mx: 2,
                    }}
                  />
                )}
              </React.Fragment>
            ))}
          </List>
        </>
      )}
    </Container>
  );
};

export default AdminFeedback;
