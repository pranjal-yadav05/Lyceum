const REQUIRED = ["MONGODB_URI", "JWT_SECRET", "FRONTEND_URL"];

export function validateEnv() {
  const missing = REQUIRED.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`
    );
  }
}
