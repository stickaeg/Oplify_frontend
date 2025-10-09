import axiosClient from "./axiosClient";

export const createStore = (data) => {
  return axiosClient.post("/admin/stores", data);
};

export const createRule = (data) => {
  return axiosClient.post("/admin/rules", data);
};

export const createBatch = (data) => {
  return axiosClient.post("/admin/batches", data);
};

export const listRules = async () => {
  const res = await axiosClient.get("/admin/rules");
  return res.data; // <-- extract the actual rules array
};

export const listProductTypesByStore = async (storeName) => {
  const encodedName = encodeURIComponent(storeName);
  const res = await axiosClient.get(`/admin/rules/store/${encodedName}`);
  return res.data;
};

export const deleteRule = async (id) => {
  const res = await axiosClient.delete(`/admin/rules/${id}`);
  return res.data;
};
