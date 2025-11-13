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

export const getBatches = async ({ page = 1, limit = 20, ruleName = "" }) => {
  const res = await axiosClient.get("/batches", {
    params: { page, limit, ruleName },
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
  const res = await axiosClient.patch(
    `/orders/orderItems/${orderItemId}/status`,
    {
      status,
      unitIds, // ✅ Pass array of unit IDs for partial updates
    }
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
