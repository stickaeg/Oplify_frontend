import axiosClient from "./axiosClient";

export const login = (data) => axiosClient.post("/auth/login", data);
export const logout = () => axiosClient.post("/auth/logout");
export const getMe = () => axiosClient.get("/auth/me");
