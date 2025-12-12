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

// ----- MainStock -----
export const createMainStock = (data) => {
  return axiosClient.post("/admin/mainStock", data);
};

export const listMainStock = async () => {
  const res = await axiosClient.get("/admin/mainStock");
  return res.data;
};

export const getMainStockById = async (id) => {
  const res = await axiosClient.get(`/admin/mainStock/${id}`);
  return res.data;
};

export const updateMainStock = async (id, data) => {
  const res = await axiosClient.put(`/admin/mainStock/${id}`, data);
  return res.data;
};

export const deleteMainStock = async (id) => {
  const res = await axiosClient.delete(`/admin/mainStock/${id}`);
  return res.data;
};

export const listRules = async (filters = {}) => {
  const response = await axiosClient.get("/admin/rules", { params: filters });
  return response.data;
};

export const listProductTypesByStore = async (storeName) => {
  const encodedName = encodeURIComponent(storeName);
  const res = await axiosClient.get(`/admin/rules/store/${encodedName}`);
  return res.data;
};

export const listVariantTitlesByProductType = async (
  storeName,
  productType
) => {
  const encodedName = encodeURIComponent(storeName);
  const res = await axiosClient.get(
    `/admin/rules/${encodedName}/${productType}/variantTitles`
  );
  return res.data;
};

export const deleteRule = async (id) => {
  const res = await axiosClient.delete(`/admin/rules/${id}`);
  return res.data;
};

export const getTotalOrders = async (filters) => {
  const res = await axiosClient.get("/admin/dashboard/totalOrders", {
    params: {
      storeId: filters?.storeId,
      startDate: filters?.startDate,
      endDate: filters?.endDate,
    },
  });

  return res.data;
};

export const getTotalProductTypesSold = async (filters) => {
  const res = await axiosClient.get("/admin/dashboard/totalProductTypesSold", {
    params: filters,
  });

  return res.data;
};

// List all product quantities under a main stock
export const listProductQuantities = async (mainStockId) => {
  const res = await axiosClient.get(
    `/admin/mainStock/${mainStockId}/quantities`
  );
  return res.data;
};

// Assign or update quantity for a SKU
export const assignProductQuantity = async (mainStockId, data) => {
  const res = await axiosClient.post(
    `/admin/mainStock/${mainStockId}/assign`,
    data
  );
  return res.data;
};

// Delete a SKU quantity
export const deleteProductQuantity = async (mainStockId, sku) => {
  const res = await axiosClient.delete(
    `/admin/mainStock/${mainStockId}/sku/${sku}`
  );
  return res.data;
};

export const getProductsByMainStock = async (
  mainStockId,
  { page, limit, sku, title }
) => {
  const res = await axiosClient.get(
    `/admin/mainStock/${mainStockId}/products`,
    {
      params: {
        page,
        limit, // backend expects "limit"
        sku, // optional
        title, // optional
      },
    }
  );
  return res.data; // { data, pagination }
};
