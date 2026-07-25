import axios from "axios";
import { GoogleLogin } from "@react-oauth/google";
import { API_URL } from "../config/env";

const GoogleSignInButton = ({
  onAuthenticated,
  onError,
  theme = "filled_black",
  size = "large",
  text = "signin_with",
  width,
}) => {
  const handleSuccess = async (response) => {
    try {
      const res = await axios.post(`${API_URL}/auth/google`, {
        credential: response.credential,
      });
      const token = res.data?.token;
      if (!token) {
        onError?.("Google login failed");
        return;
      }
      onAuthenticated?.(token, res.data?.user);
    } catch {
      onError?.("Google login failed");
    }
  };

  return (
    <GoogleLogin
      onSuccess={handleSuccess}
      onError={() => onError?.("Google login failed")}
      theme={theme}
      size={size}
      text={text}
      width={width}
    />
  );
};

export default GoogleSignInButton;
