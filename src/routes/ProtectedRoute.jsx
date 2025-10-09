import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <p>Loading...</p>;
  }

  if (!user) {
    // Not logged in → redirect to login page
    return <Navigate to="/" replace />;
  }

  // ✅ User is logged in
  return <Outlet />;
}
