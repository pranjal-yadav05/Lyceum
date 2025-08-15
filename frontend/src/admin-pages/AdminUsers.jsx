import React, { useEffect, useState } from "react";
import {
  Container,
  Card,
  CardContent,
  Typography,
  Avatar,
  List,
  ListItem,
  Button,
} from "@mui/material";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState("createdAt"); // Default sorting field
  const [order, setOrder] = useState("desc"); // Default sorting order
  const [authOrder, setAuthOrder] = useState("none"); // Default auth order
  const navigate = useNavigate();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/users`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          params: { sortBy, order }, // Pass sorting parameters
        }
      );

      // Fetch authentication methods for users
      const authResponse = await axios.get(
        `${process.env.REACT_APP_API_URL}/admin/users-auth-methods`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      // Merge user data with authentication methods
      let usersWithAuthMethods = response.data.map((user) => {
        const authUser = authResponse.data.find(
          (auth) => auth.username === user.username
        );
        return {
          ...user,
          authMethod: authUser ? authUser.authMethod : "unknown",
        };
      });

      // Apply authOrder sorting
      if (authOrder === "google") {
        usersWithAuthMethods.sort((a, b) =>
          a.authMethod === "google" ? -1 : 1
        );
      } else if (authOrder === "email") {
        usersWithAuthMethods.sort((a, b) =>
          a.authMethod === "password" ? -1 : 1
        );
      }

      setUsers(usersWithAuthMethods); // previously setUsers(response.data);
    } catch (err) {
      setError("Failed to fetch users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [sortBy, order, authOrder]); // Refetch users when sorting options change

  const formatDate = (dateString) => {
    if (!dateString) return "A long time ago";
    if (typeof dateString === "string" && isNaN(Date.parse(dateString))) {
      return dateString;
    }
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const formatAuthMethod = (authMethod) => {
    return authMethod === "google" ? "Google Account" : "Email Only Account";
  };

  if (loading) return <Typography>Loading...</Typography>;
  if (error) return <Typography color="error">{error}</Typography>;

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
      <div className="flex items-center justify-center w-full mb-8">
        <h1 className="text-4xl font-extrabold text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 leading-relaxed">
          Users
        </h1>
      </div>
      <div className="flex justify-end items-center mb-4 gap-4">
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-auto bg-[#1a1425]/50 border-purple-600/20 backdrop-blur-md">
            <SelectValue placeholder="Sort By" />
          </SelectTrigger>
          <SelectContent className="bg-[#1a1425]/50 backdrop-blur-md">
            <SelectItem value="createdAt">Created At</SelectItem>
            <SelectItem value="updatedAt">Updated At</SelectItem>
            <SelectItem value="lastSeen">Last Seen</SelectItem>
          </SelectContent>
        </Select>
        <Select value={order} onValueChange={setOrder}>
          <SelectTrigger className="w-auto bg-[#1a1425]/50 border-purple-600/20 backdrop-blur-md">
            <SelectValue placeholder="Order" />
          </SelectTrigger>
          <SelectContent className="bg-[#1a1425]/50 backdrop-blur-md">
            <SelectItem value="asc">Ascending</SelectItem>
            <SelectItem value="desc">Descending</SelectItem>
          </SelectContent>
        </Select>
        <Select value={authOrder} onValueChange={setAuthOrder}>
          <SelectTrigger className="w-auto bg-[#1a1425]/50 border-purple-600/20 backdrop-blur-md">
            <SelectValue placeholder="Auth Order" />
          </SelectTrigger>
          <SelectContent className="bg-[#1a1425]/50 backdrop-blur-md">
            <SelectItem value="none">None</SelectItem>
            <SelectItem value="google">Google Accounts First</SelectItem>
            <SelectItem value="email">Email Only Accounts First</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <List
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr", // Single column for small screens
            md: "1fr 1fr", // Two columns for medium and larger screens
          },
          gap: 2, // Reduced spacing between grid items
          padding: 1, // Reduced padding around the entire grid
        }}
      >
        {users.map((user) => (
          <ListItem
            key={user.username} //previously key was user._id
            sx={{
              padding: 1, // Reduced padding around each card
              justifyContent: "center",
            }}
          >
            <Card
              sx={{
                display: "flex",
                alignItems: "center",
                height: 150,
                width: "100%",
                maxWidth: 600,
                backgroundImage: user.coverImage
                  ? `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(${user.coverImage})`
                  : "none",
                backgroundSize: user.coverImage ? "cover" : "none",
                backgroundPosition: "center",
                color: "white",
                backdropFilter: user.coverImage ? "none" : "blur(10px)",
                backgroundColor: user.coverImage
                  ? "transparent"
                  : "rgba(0, 0, 0, 0.5)",
                border: "1px solid transparent",
                borderRadius: "8px",
                transition: "transform 0.3s, box-shadow 0.3s",
                boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                "&:hover": {
                  transform: "scale(1.05)",
                  boxShadow: "0 6px 10px rgba(0, 0, 0, 0.15)",
                  border: "1px solid rgba(128, 90, 213, 0.5)",
                },
              }}
            >
              <Avatar
                src={user.profileImage || "defaultProfile.jpg"}
                alt="Profile Image"
                sx={{
                  width: 60,
                  height: 60,
                  border: "2px solid white",
                  marginLeft: 4,
                  marginRight: 2,
                }}
              />
              <CardContent sx={{ textAlign: "left", flex: 1 }}>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: "bold",
                    color: "#fff",
                    textShadow: "0 1px 2px rgba(0, 0, 0, 0.5)",
                  }}
                >
                  {user.username}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: "#d1d5db", marginBottom: 1 }}
                >
                  {formatAuthMethod(user.authMethod)}
                </Typography>
                <Typography variant="body2" sx={{ color: "#9ca3af" }}>
                  Last Seen: {formatDate(user.lastSeen)}
                </Typography>
              </CardContent>
            </Card>
          </ListItem>
        ))}
      </List>
    </Container>
  );
};

export default AdminUsers;
