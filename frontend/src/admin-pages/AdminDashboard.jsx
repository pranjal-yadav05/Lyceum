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
  Activity,
  AlertTriangle,
  MessageCircle,
  LampDesk,
} from "lucide-react";
import axios from "axios";
import LoadingSpinner from "../components/LoadingSpinner";
import { useNavigate } from "react-router-dom";

const AdminDashboard = () => {
  const navigate = useNavigate();
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
    activeUserCount: 0,
    errorMetrics: [],
  });

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 1);

      const [dashboardRes, errorMetricsResponse] = await Promise.all([
        axios.get(`${process.env.REACT_APP_API_URL}/admin/dashboard`),
        axios.get(`${process.env.REACT_APP_API_URL}/admin/metrics/errors`, {
          params: {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
          },
        }),
      ]);

      if (dashboardRes.data.settings) {
        setActiveSettings((prev) => ({
          ...prev,
          ...dashboardRes.data.settings,
        }));
      }

      setAnalyticsData({
        activeUserCount: dashboardRes.data.activeUsers ?? 0,
        errorMetrics: errorMetricsResponse.data,
      });
      setError(null);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError("Failed to fetch dashboard data");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSettingChange = async (setting, value) => {
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/admin/settings`, {
        setting,
        value,
      });
      setActiveSettings((prev) => ({ ...prev, [setting]: value }));
    } catch (err) {
      setError(`Failed to update ${setting} setting`);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
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
    { icon: MessageCircle, label: "View Feedback", path: "/admin/feedback" },
    { icon: LampDesk, label: "Focus Spaces", path: "/admin/focus-spaces" },
  ];

  const cardSx = {
    p: 2,
    height: "100%",
    width: "100%",
    bgcolor: "#1a1425",
    border: "1px solid #9333ea",
    borderRadius: "12px",
  };

  const headingSx = {
    color: "white",
    mb: 1,
    textAlign: "center",
    fontWeight: "bold",
    textShadow: "0px 0px 10px rgba(147, 51, 234, 0.8)",
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 2, mb: 2 }}>
      <Grid container spacing={2}>
        {/* Quick Actions */}
        <Grid size={12}>
          <Paper sx={cardSx}>
            <Typography variant="h5" gutterBottom sx={headingSx}>
              Quick Actions
            </Typography>
            <Grid container spacing={2}>
              {quickActions.map((action) => (
                <Grid key={action.label} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                  <Button
                    variant="outlined"
                    startIcon={<action.icon color="white" />}
                    onClick={() => navigate(action.path)}
                    fullWidth
                    sx={{
                      height: "48px",
                      color: "white",
                      borderColor: "rgba(255, 255, 255, 0.2)",
                      backdropFilter: "blur(10px)",
                      WebkitBackdropFilter: "blur(10px)",
                      backgroundColor: "rgba(255, 255, 255, 0.1)",
                      justifyContent: "flex-start",
                      textTransform: "none",
                      fontSize: "0.9rem",
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
        <Grid size={{ xs: 12, sm: 6 }}>
          <Paper sx={cardSx}>
            <Typography variant="h5" gutterBottom sx={headingSx}>
              System Status
            </Typography>
            <List>
              <ListItem>
                <ListItemIcon>
                  <Activity color="white" />
                </ListItemIcon>
                <ListItemText
                  primary="System Health"
                  slotProps={{ primary: { color: "white" } }}
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
                  secondary={`${analyticsData.activeUserCount} active this week`}
                  slotProps={{
                    primary: { color: "white" },
                    secondary: { color: "rgba(255, 255, 255, 0.7)" },
                  }}
                />
              </ListItem>
            </List>
          </Paper>
        </Grid>

        {/* Active Settings */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <Paper sx={cardSx}>
            <Typography variant="h5" gutterBottom sx={headingSx}>
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
                        handleSettingChange("userRegistration", e.target.checked)
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
                        handleSettingChange("studyRoomEnabled", e.target.checked)
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
                      handleSettingChange("maxVideoParticipants", e.target.value)
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
        <Grid size={12}>
          <Paper sx={cardSx}>
            <Typography variant="h5" gutterBottom sx={headingSx}>
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
                        secondary={`${error.count} occurrences`}
                        slotProps={{
                          primary: { color: "white" },
                          secondary: { color: "rgba(255, 255, 255, 0.7)" },
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
                    slotProps={{ primary: { color: "white" } }}
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
