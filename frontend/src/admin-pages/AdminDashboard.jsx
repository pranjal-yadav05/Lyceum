import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Chip,
  Alert,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
} from "@mui/material";
import {
  Users,
  Video,
  Search,
  Settings,
  Shield,
  Activity,
  AlertTriangle,
  MessageCircle,
} from "lucide-react";
import axios from "axios";
import LoadingSpinner from "../components/LoadingSpinner";

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSettings, setActiveSettings] = useState({
    maintenanceMode: false,
    userRegistration: true,
    studyRoomEnabled: true,
    searchEnabled: true,
    maxVideoParticipants: 4,
    sessionTimeout: 30,
  });
  const [analyticsData, setAnalyticsData] = useState({
    activeUsers: [],
    errorMetrics: [],
  });

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const endDate = new Date();
      const startDate = new Date();

      // Set start date based on time range
      switch ("24h") {
        case "1h":
          startDate.setHours(startDate.getHours() - 1);
          break;
        case "24h":
          startDate.setDate(startDate.getDate() - 1);
          break;
        default:
          break;
      }

      // Fetch active users and error metrics
      const [activeUsersResponse, errorMetricsResponse] = await Promise.all([
        axios.get(
          `${process.env.REACT_APP_API_URL}/admin/metrics/active-users`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            params: {
              startDate: startDate.toISOString(),
              endDate: endDate.toISOString(),
            },
          }
        ),
        axios.get(`${process.env.REACT_APP_API_URL}/admin/metrics/errors`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          params: {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
          },
        }),
      ]);

      // Format active users data for the chart
      const activeUsersData = activeUsersResponse.data.map((user) => ({
        time: new Date(user.timestamp).toLocaleTimeString(),
        count: 1,
      }));

      setAnalyticsData({
        activeUsers: activeUsersData,
        errorMetrics: errorMetricsResponse.data,
      });
      setLoading(false);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError("Failed to fetch dashboard data");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 15 * 60 * 1000); // Refresh every 15 minutes
    return () => clearInterval(interval);
  }, []);

  const handleSettingChange = async (setting, value) => {
    try {
      await axios.post(
        `${process.env.REACT_APP_API_URL}/admin/settings`,
        {
          setting,
          value,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setActiveSettings((prev) => ({ ...prev, [setting]: value }));
    } catch (err) {
      setError(`Failed to update ${setting} setting`);
    }
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <LoadingSpinner />
      </Box>
    );
  }

  if (error) {
    return (
      <Container>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  const quickActions = [
    { icon: Users, label: "Manage Users", path: "/admin/users" },
    { icon: Video, label: "Study Room Settings", path: "/admin/studyroom" },
    { icon: Search, label: "Search Configuration", path: "/admin/search" },
    { icon: Settings, label: "System Settings", path: "/admin/settings" },
    { icon: Shield, label: "Security Settings", path: "/admin/security" },
    { icon: MessageCircle, label: "View Feedback", path: "/admin/feedback" },
  ];

  return (
    <Container maxWidth="lg" sx={{ mt: 2, mb: 2 }}>
      {" "}
      {/* Reduced top and bottom margins */}
      <Grid container spacing={2} justifyContent="center" alignItems="center">
        {" "}
        {/* Reduced grid spacing */}
        {/* Quick Actions */}
        <Grid item xs={12}>
          <Paper
            sx={{
              p: 2 /* Reduced padding */,
              bgcolor: "#1a1425",
              border: "1px solid #9333ea",
              borderRadius: "12px",
            }}
          >
            <Typography
              variant="h5"
              gutterBottom
              sx={{
                color: "white",
                mb: 1 /* Reduced bottom margin */,
                textAlign: "center",
                fontWeight: "bold",
                textShadow: "0px 0px 10px rgba(147, 51, 234, 0.8)",
              }}
            >
              Quick Actions
            </Typography>
            <Grid
              container
              spacing={2} /* Reduced grid spacing */
              justifyContent="center"
              alignItems="center"
              sx={{ textAlign: "center" }}
            >
              {quickActions.map((action) => (
                <Grid
                  key={action.label}
                  sx={{
                    gridColumn: {
                      xs: "span 12",
                      sm: "span 6",
                      md: "span 4",
                      lg: "span 3",
                    },
                  }}
                  display="flex"
                  justifyContent="center"
                >
                  <Button
                    variant="outlined"
                    startIcon={<action.icon color="white" />}
                    onClick={() => (window.location.href = action.path)}
                    fullWidth
                    sx={{
                      height: "48px" /* Reduced button height */,
                      color: "white",
                      borderColor: "rgba(255, 255, 255, 0.2)",
                      backdropFilter: "blur(10px)",
                      WebkitBackdropFilter: "blur(10px)",
                      backgroundColor: "rgba(255, 255, 255, 0.1)",
                      display: "flex",
                      justifyContent: "flex-start",
                      alignItems: "center",
                      textTransform: "none",
                      fontSize: "0.9rem" /* Slightly reduced font size */,
                      fontWeight: "bold",
                      borderRadius: "12px",
                      "&:hover": {
                        borderColor: "#a855f7",
                        backgroundColor: "rgba(147, 51, 234, 0.2)",
                      },
                    }}
                  >
                    {action.label}
                  </Button>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>
        {/* System Status */}
        <Grid container spacing={2} justifyContent="center" alignItems="center">
          <Grid
            sx={{ gridColumn: { xs: "span 12", sm: "span 6" } }}
            display="flex"
            justifyContent="center"
          >
            <Paper
              sx={{
                p: 2 /* Reduced padding */,
                height: "100%",
                bgcolor: "#1a1425",
                border: "1px solid #9333ea",
                borderRadius: "12px",
              }}
            >
              <Typography
                variant="h5"
                gutterBottom
                sx={{
                  color: "white",
                  mb: 1 /* Reduced bottom margin */,
                  textAlign: "center",
                  fontWeight: "bold",
                  textShadow: "0px 0px 10px rgba(147, 51, 234, 0.8)",
                }}
              >
                System Status
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <Activity color="white" />
                  </ListItemIcon>
                  <ListItemText
                    primary="System Health"
                    primaryTypographyProps={{ color: "white" }}
                    secondary={
                      <Typography
                        component="span"
                        sx={{ display: "inline-flex", alignItems: "center" }}
                      >
                        <Chip
                          label={
                            analyticsData.errorMetrics.length > 0
                              ? "Warning"
                              : "Healthy"
                          }
                          color={
                            analyticsData.errorMetrics.length > 0
                              ? "warning"
                              : "success"
                          }
                          size="small"
                        />
                      </Typography>
                    }
                  />
                </ListItem>
                <Divider sx={{ bgcolor: "rgba(255, 255, 255, 0.1)", my: 1 }} />
                <ListItem>
                  <ListItemIcon>
                    <Users color="white" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Active Users"
                    primaryTypographyProps={{ color: "white" }}
                    secondary={`${
                      analyticsData.activeUsers.length || 0
                    } users online`}
                    secondaryTypographyProps={{
                      color: "rgba(255, 255, 255, 0.7)",
                    }}
                  />
                </ListItem>
              </List>
            </Paper>
          </Grid>
        </Grid>
        {/* Active Settings */}
        <Grid item xs={12} sm={6} display="flex" justifyContent="center">
          <Paper
            sx={{
              p: 2 /* Reduced padding */,
              height: "100%",
              bgcolor: "#1a1425",
              border: "1px solid #9333ea",
              borderRadius: "12px",
            }}
          >
            <Typography
              variant="h5"
              gutterBottom
              sx={{
                color: "white",
                mb: 1 /* Reduced bottom margin */,
                textAlign: "center",
                fontWeight: "bold",
                textShadow: "0px 0px 10px rgba(147, 51, 234, 0.8)",
              }}
            >
              Active Settings
            </Typography>
            <List>
              <ListItem>
                <FormControlLabel
                  control={
                    <Switch
                      checked={activeSettings.maintenanceMode}
                      onChange={(e) =>
                        handleSettingChange("maintenanceMode", e.target.checked)
                      }
                      color="primary"
                    />
                  }
                  label="Maintenance Mode"
                  sx={{ color: "white" }}
                />
              </ListItem>
              <Divider sx={{ bgcolor: "rgba(255, 255, 255, 0.1)", my: 1 }} />
              <ListItem>
                <FormControlLabel
                  control={
                    <Switch
                      checked={activeSettings.userRegistration}
                      onChange={(e) =>
                        handleSettingChange(
                          "userRegistration",
                          e.target.checked
                        )
                      }
                      color="primary"
                    />
                  }
                  label="User Registration"
                  sx={{ color: "white" }}
                />
              </ListItem>
              <Divider sx={{ bgcolor: "rgba(255, 255, 255, 0.1)", my: 1 }} />
              <ListItem>
                <FormControlLabel
                  control={
                    <Switch
                      checked={activeSettings.studyRoomEnabled}
                      onChange={(e) =>
                        handleSettingChange(
                          "studyRoomEnabled",
                          e.target.checked
                        )
                      }
                      color="primary"
                    />
                  }
                  label="Study Room"
                  sx={{ color: "white" }}
                />
              </ListItem>
              <Divider sx={{ bgcolor: "rgba(255, 255, 255, 0.1)", my: 1 }} />
              <ListItem>
                <FormControl fullWidth>
                  <InputLabel sx={{ color: "white" }}>
                    Max Video Participants
                  </InputLabel>
                  <Select
                    value={activeSettings.maxVideoParticipants}
                    onChange={(e) =>
                      handleSettingChange(
                        "maxVideoParticipants",
                        e.target.value
                      )
                    }
                    label="Max Video Participants"
                    sx={{ color: "white" }}
                  >
                    {[2, 4, 6, 8, 10].map((num) => (
                      <MenuItem key={num} value={num}>
                        {num}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </ListItem>
            </List>
          </Paper>
        </Grid>
        {/* Error Metrics */}
        <Grid item xs={12} display="flex" justifyContent="center">
          <Paper
            sx={{
              p: 2 /* Reduced padding */,
              bgcolor: "#1a1425",
              border: "1px solid #9333ea",
              borderRadius: "12px",
            }}
          >
            <Typography
              variant="h5"
              gutterBottom
              sx={{
                color: "white",
                mb: 1 /* Reduced bottom margin */,
                textAlign: "center",
                fontWeight: "bold",
                textShadow: "0px 0px 10px rgba(147, 51, 234, 0.8)",
              }}
            >
              Error Metrics
            </Typography>
            <List>
              {analyticsData.errorMetrics.length > 0 ? (
                analyticsData.errorMetrics.map((error, index) => (
                  <React.Fragment key={index}>
                    <ListItem>
                      <ListItemIcon>
                        <AlertTriangle color="white" />
                      </ListItemIcon>
                      <ListItemText
                        primary={error._id}
                        primaryTypographyProps={{ color: "white" }}
                        secondary={`${error.count} occurrences`}
                        secondaryTypographyProps={{
                          color: "rgba(255, 255, 255, 0.7)",
                        }}
                      />
                    </ListItem>
                    {index < analyticsData.errorMetrics.length - 1 && (
                      <Divider
                        sx={{ bgcolor: "rgba(255, 255, 255, 0.1)", my: 1 }}
                      />
                    )}
                  </React.Fragment>
                ))
              ) : (
                <ListItem>
                  <ListItemText
                    primary="No errors reported"
                    primaryTypographyProps={{ color: "white" }}
                  />
                </ListItem>
              )}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default AdminDashboard;
