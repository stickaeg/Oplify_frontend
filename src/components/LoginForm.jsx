// src/features/auth/components/LoginForm.jsx
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { login } from "../api/authApi";
import { getRoleBasedPath } from "../context/AuthContext";

export default function LoginForm() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({ name: "", password: "" });

  const navigate = useNavigate();

  const { mutate, isPending, error } = useMutation({
    mutationFn: login,
    onSuccess: async (res) => {
      // The user is nested inside res.data.user
      const user = res?.data?.user;

      // Invalidate to refresh auth context
      queryClient.invalidateQueries(["me"]);

      // Navigate based on user role
      if (user?.role) {
        const redirectPath = getRoleBasedPath(user.role);
        console.log("Redirect path:", redirectPath);
        navigate(redirectPath, { replace: true });
      }
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutate(formData);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-sm mx-auto p-4 border-2  border-gray-300 rounded-xl shadow-xl space-y-3 bg-white"
    >
      <h2 className="text-xl font-semibold text-center">Login</h2>

      <div>
        <label className="block mb-1">Name</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full p-2 border rounded outline-none"
          required
        />
      </div>

      <div>
        <label className="block mb-1">Password</label>
        <input
          type="password"
          value={formData.password}
          onChange={(e) =>
            setFormData({ ...formData, password: e.target.value })
          }
          className="w-full p-2 border rounded outline-none"
          required
        />
      </div>

      {error && (
        <p className="text-red-500 text-sm">
          {error.response?.data?.error || "Login failed"}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {isPending ? "Logging in..." : "Login"}
      </button>
    </form>
  );
}
