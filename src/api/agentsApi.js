import axiosClient from "./axiosClient";

export const getStores = () => axiosClient.get("/stores");

export const getProducts = async ({
  page = 1,
  limit = 20,
  storeId,
  productType,
  isPod,
}) => {
  const res = await axiosClient.get("/products", {
    params: {
      page,
      limit,
      storeId,
      productType,
      isPod,
    },
  });
  return res.data;
};

export const getOrders = async ({
  page = 1,
  limit = 20,
  storeId,
  status,
  search,
  startDate,
  endDate,
}) => {
  const res = await axiosClient.get("/orders", {
    params: { page, limit, storeId, status, search, startDate, endDate },
  });
  return res.data;
};

export const getBatches = async ({
  page = 1,
  limit = 20,
  ruleName = "",
  status = "",
  startDate = "",
  endDate = "",
  search = "",
}) => {
  const res = await axiosClient.get("/batches", {
    params: {
      page,
      limit,
      ruleName: ruleName || undefined,
      status: status || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      search: search || undefined,
    },
  });
  return res.data;
};

export const getRules = () => axiosClient.get("/batches/rules");

export const getBatchById = async (batchId) => {
  const res = await axiosClient.get(`/batches/${batchId}`);
  return res.data;
};

export const updateBatchStatus = async (batchId, status) => {
  if (!batchId || !status) throw new Error("Batch ID and status are required");

  const res = await axiosClient.patch(`/batches/${batchId}/status`, { status });
  return res.data;
};

export const itemStatusUpdate = async (orderItemId, status, unitIds = null) => {
  const payload = { status };

  // 👇 Only add unitIds if it's a real array
  if (unitIds && Array.isArray(unitIds) && unitIds.length > 0) {
    payload.unitIds = unitIds;
  }

  const res = await axiosClient.patch(
    `/orders/orderItems/${orderItemId}/status`,
    payload,
  );
  return res.data;
};

export const getOrderById = async (orderId) => {
  if (!orderId) throw new Error("Order ID is required");

  const res = await axiosClient.get(`/orders/${orderId}`);
  return res.data;
};

export const getUploadedFiles = async (batchId) => {
  const response = await axiosClient.get(`/google/files/${batchId}`);
  return response.data;
};

export const uploadFiles = async (files, batchId) => {
  try {
    const formData = new FormData();

    // Append all files
    for (const file of files) {
      formData.append("files", file); // matches multer.array("files")
    }

    // Append batchId to link files to a batch
    formData.append("batchId", batchId);

    const response = await axiosClient.post("/google/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  } catch (error) {
    console.error("Upload failed:", error);
    throw error;
  }
};
export const downloadFile = async (fileId, fileName) => {
  try {
    const response = await axiosClient.get(`/google/download/${fileId}`, {
      responseType: "blob", // important for binary data
    });

    // Create a temporary link and trigger browser download
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", fileName || "file");
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Download failed:", error);
    throw error;
  }
};

export const downloadBatchFiles = async (batchId, batchName = null) => {
  const controller = new AbortController(); // Cancel support
  try {
    const response = await axiosClient.get(`/google/downloadZip/${batchId}`, {
      responseType: "blob",
      signal: controller.signal,
      timeout: process.env.NODE_ENV === "production" ? 120000 : 60000, // 2min prod, 1min dev
    });

    const zipName =
      batchName?.replace(/[^a-z0-9]/gi, "_") + ".zip" || `batch-${batchId}.zip`;
    const blob = new Blob([response.data], { type: "application/zip" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = zipName;
    document.body.appendChild(link);
    link.click();

    // Cleanup
    link.onclick = () => {
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 100);
    };
  } catch (error) {
    throw new Error("Download cancelled");
  }
};

export const scanBatch = async (token) => {
  const res = await axiosClient.get(`/scan/batch/${token}`);
  return res.data;
};

export const scanUnitFulfillment = async (token) => {
  const res = await axiosClient.get(`/scan/item-fulfillment/${token}`);
  return res.data;
};

export const replacement = async (unitId, reason) => {
  const res = await axiosClient.patch(`/orders/units/${unitId}/replace`, {
    reason,
  });
  return res.data;
};

// StockItem APIs
export const createStockItem = (data) =>
  axiosClient.post("/inventory/stock-items", data);
export const getStockItems = () => axiosClient.get("/inventory/stock-items");
export const getStockItemById = (id) =>
  axiosClient.get(`/inventory/stock-items/${id}`);
export const updateStockItem = (id, data) =>
  axiosClient.put(`/inventory/stock-items/${id}`, data);
export const deleteStockItem = (id) =>
  axiosClient.delete(`/inventory/stock-items/${id}`);

// StockVariant APIs
export const createStockVariant = (data) =>
  axiosClient.post("/inventory/stock-variants", data);
export const getStockVariants = () =>
  axiosClient.get("/inventory/stock-variants");
export const getStockVariantById = (id) =>
  axiosClient.get(`/inventory/stock-variants/${id}`);
export const updateStockVariant = (id, data) =>
  axiosClient.put(`/inventory/stock-variants/${id}`, data);
export const deleteStockVariant = (id) =>
  axiosClient.delete(`/inventory/stock-variants/${id}`);

// ProductStockMapping APIs
export const createProductStockMapping = (data) =>
  axiosClient.post("/inventory/product-stock-mappings", data);
export const getProductStockMappings = () =>
  axiosClient.get("/inventory/product-stock-mappings");
export const deleteProductStockMapping = (id) =>
  axiosClient.delete(`/inventory/product-stock-mappings/${id}`);

export const bulkUpdateOrderItemsStatus = async (orderId, status) => {
  if (!orderId || !status) throw new Error("Order ID and status are required");

  const res = await axiosClient.post(`/orders/items/${orderId}/bulk-status`, {
    status,
  });
  return res.data;
};

export const listRules = async (filters = {}) => {
  const response = await axiosClient.get("/batches/rules", { params: filters });
  return response.data;
};
