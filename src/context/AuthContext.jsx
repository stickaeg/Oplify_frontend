// src/context/AuthContext.jsx
import { createContext, useContext } from "react";
import { useQuery } from "@tanstack/react-query";
import { getMe } from "../api/authApi";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const { data, isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: getMe,
    retry: false,
    refetchOnWindowFocus: false,
    enabled: true,
  });

  if (isLoading) {
    return <p>Loading auth...</p>;
  }

  const user = data?.data || null;

  return (
    <AuthContext.Provider value={{ user, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

// Helper function to get redirect path based on role
export function getRoleBasedPath(role) {
  const roleRoutes = {
    ADMIN: "/dashboard",
    DESIGNER: "/batches",
    PRINTER: "/batches",
    CUTTER: "/batches",
  };
  return roleRoutes[role];
}
