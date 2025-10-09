import { useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  getBatchById,
  getUploadedFiles,
  uploadFiles,
  downloadFile,
  updateBatchStatus,
} from "../api/agentsApi";
import Table from "../components/Table";
import { useAuth } from "../context/AuthContext";

const statusColors = {
  PENDING: "bg-yellow-400",
  WAITING_BATCH: "bg-gray-400",
  BATCHED: "bg-blue-500",
  DESIGNING: "bg-purple-500",
  DESIGNED: "bg-violet-500",
  PRINTING: "bg-indigo-500",
  CUTTING: "bg-pink-500",
  FULFILLMENT: "bg-teal-500",
  COMPLETED: "bg-green-600",
  CANCELLED: "bg-red-500",
};

const BatchesDetail = () => {
  const { batchId } = useParams();
  const queryClient = useQueryClient();
  const [selectedFiles, setSelectedFiles] = useState(null);
  const { user } = useAuth();

  const [isUploading, setIsUploading] = useState(false);

  // === Batch Details ===
  const {
    data: batch,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["batch", batchId],
    queryFn: () => getBatchById(batchId),
    enabled: !!batchId,
  });

  console.log(batch);
  // === Google Files ===
  const {
    data: googleFiles = [],
    isLoading: isFilesLoading,
    isError: isFilesError,
  } = useQuery({
    queryKey: ["googleFiles", batchId],
    queryFn: () => getUploadedFiles(batchId),
    enabled: !!batchId,
  });

  // === Handlers ===
  const handleFileChange = (e) => setSelectedFiles(e.target.files);

  const handleUpload = async () => {
    if (!selectedFiles?.length || isUploading) return;
    setIsUploading(true);
    if (user?.role !== "ADMIN" && user?.role !== "DESIGNER") {
      alert("You don't have permission to upload files.");
      return;
    }

    try {
      await uploadFiles(selectedFiles, batchId);
      setSelectedFiles(null);
      queryClient.invalidateQueries(["googleFiles", batchId]);
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = async (fileId, fileName) => {
    try {
      await downloadFile(fileId, fileName);

      if (
        user?.role === "PRINTER" &&
        batch.status !== "PRINTING" &&
        batch.status === "DESIGNED"
      ) {
        await updateBatchStatus(batch.id, "PRINTING");
        queryClient.invalidateQueries(["batch", batch.id]);
        queryClient.invalidateQueries(["batches"]);
        console.log(
          `Batch ${batch.id} status changed to PRINTING by ${user.role}`
        );
      }
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  // === Render ===
  if (isLoading) return <p className="text-center py-10">Loading batch...</p>;
  if (isError)
    return (
      <p className="text-center py-10 text-red-500">
        Error loading batch: {error.message}
      </p>
    );

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* ===== Batch Info ===== */}
      <div className="bg-white shadow rounded p-6">
        <h1 className="text-2xl font-bold mb-2">{batch.name}</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <p>
            <span className="font-semibold">Capacity:</span> {batch.capacity}/
            {batch.maxCapacity}
          </p>
          <p>
            <span className="font-semibold">Created:</span>{" "}
            {new Date(batch.createdAt).toLocaleString()}
          </p>
          <p>
            <span className="font-semibold">Status:</span>{" "}
            <span
              className={`inline-block px-3 py-1 rounded-full text-white text-xs font-semibold ${
                statusColors[batch.status] || "bg-gray-400"
              }`}
            >
              {batch.status.replaceAll("_", " ")}
            </span>
          </p>
        </div>
      </div>

      {/* ===== QR Codes Section ===== */}
      {(user?.role === "PRINTER" ||
        user?.role === "ADMIN" ||
        user?.role === "CUTTER") && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg rounded-xl p-8 border border-blue-100">
          <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-2">
            <svg
              className="w-6 h-6 text-indigo-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
              />
            </svg>
            Batch QR Codes
          </h2>

          {/* Batch QR */}
          {batch.qrCodeUrl ? (
            <div className="mb-8 text-center">
              <div className="inline-block bg-white p-6 rounded-2xl shadow-xl border-4 border-indigo-200">
                <h3 className="font-semibold mb-3 text-indigo-900 text-lg">
                  📦 Whole Batch QR Code
                </h3>
                <img
                  src={batch.qrCodeUrl}
                  alt="Batch QR"
                  className="mx-auto w-48 h-48 rounded-lg"
                />
                <p className="text-sm text-gray-600 mt-3 font-medium">
                  {batch.name}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 mb-6 text-center">
              No batch QR available.
            </p>
          )}

          {/* Item QRs */}
          {batch.items?.length ? (
            <div>
              <h3 className="font-semibold mb-4 text-gray-800 text-lg flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-indigo-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
                Individual Item QR Codes
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
                {batch.items.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white border-2 border-indigo-100 rounded-xl p-4 text-center shadow-md hover:shadow-xl hover:scale-105 hover:border-indigo-300 transition-all duration-200"
                  >
                    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg p-2 mb-2">
                      {item.qrCodeUrl ? (
                        <img
                          src={item.qrCodeUrl}
                          alt="Item QR"
                          className="mx-auto w-32 h-32 rounded-lg"
                        />
                      ) : (
                        <div className="w-32 h-32 mx-auto flex items-center justify-center bg-gray-100 rounded-lg">
                          <p className="text-gray-400 text-xs">No QR</p>
                        </div>
                      )}
                    </div>
                    <p className="text-xs font-semibold text-gray-800 line-clamp-2 min-h-[2rem]">
                      {item.productTitle}
                    </p>
                    <p className="text-xs text-indigo-600 font-medium mt-1">
                      {item.sku}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-center">
              No items to display QR codes for.
            </p>
          )}
        </div>
      )}

      {batch.qrCodeUrl && (
        <div className="mt-6 flex justify-center gap-4">
          {user?.role === "PRINTER" && batch.status === "PRINTING" && (
            <a
              href="/scan/printer"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition"
            >
              📱 Open Printer Scanner
            </a>
          )}

          {user?.role === "CUTTER" && batch.status === "PRINTED" && (
            <a
              href="/scan/cutter"
              className="inline-flex items-center gap-2 bg-pink-600 hover:bg-pink-700 text-white font-semibold px-6 py-3 rounded-lg transition"
            >
              📱 Open Cutter Scanner
            </a>
          )}

          {user?.role === "FULFILLMENT" && batch.status === "CUT" && (
            <a
              href="/scan/fulfillment"
              className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold px-6 py-3 rounded-lg transition"
            >
              📱 Open Fulfillment Scanner
            </a>
          )}
        </div>
      )}
      {/* ===== Batch Files ===== */}
      <div className="bg-white shadow rounded p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Batch Files</h2>

          {(user?.role === "ADMIN" || user?.role === "DESIGNER") && (
            <div className="flex items-center gap-3">
              <label
                className={`flex items-center justify-center border-2 border-dashed rounded-xl px-5 py-2 text-sm font-medium transition-all cursor-pointer ${
                  isUploading
                    ? "bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed"
                    : "bg-white text-gray-700 border-gray-300 hover:border-blue-500 hover:text-blue-600"
                }`}
              >
                <input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  disabled={isUploading}
                  className="hidden"
                />
                <span className="flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5 text-blue-500"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  {selectedFiles?.length
                    ? `${selectedFiles.length} file${
                        selectedFiles.length > 1 ? "s" : ""
                      } selected`
                    : "Select Files"}
                </span>
              </label>

              <button
                onClick={handleUpload}
                disabled={!selectedFiles?.length || isUploading}
                className={`flex items-center gap-2 bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition
          ${
            !selectedFiles?.length || isUploading
              ? "opacity-60 cursor-not-allowed"
              : "hover:bg-blue-700"
          }`}
              >
                {isUploading ? (
                  <>
                    <svg
                      className="animate-spin h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                      ></path>
                    </svg>
                    Uploading...
                  </>
                ) : (
                  "Upload"
                )}
              </button>
            </div>
          )}
        </div>

        {isFilesLoading ? (
          <p>Loading files...</p>
        ) : isFilesError ? (
          <p className="text-red-500">Error loading Google files</p>
        ) : googleFiles.length > 0 ? (
          <Table>
            <Table.Head>
              <Table.HeaderCell>Name</Table.HeaderCell>
              <Table.HeaderCell>Type</Table.HeaderCell>
              <Table.HeaderCell>Size</Table.HeaderCell>
              <Table.HeaderCell>Actions</Table.HeaderCell>
            </Table.Head>
            <Table.Body>
              {googleFiles.map((file) => (
                <Table.Row key={file.id}>
                  <Table.Cell className="font-medium">{file.name}</Table.Cell>
                  <Table.Cell>{file.mimeType}</Table.Cell>
                  <Table.Cell>{(file.size / 1024).toFixed(1)} KB</Table.Cell>
                  <Table.Cell>
                    <button
                      onClick={() => handleDownload(file.id, file.name)}
                      className="text-blue-600 hover:underline"
                    >
                      Download
                    </button>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        ) : (
          <p className="text-gray-500">No uploaded files found.</p>
        )}
      </div>

      {/* ===== Batch Items ===== */}
      <div className="bg-white shadow rounded p-6">
        <h2 className="text-xl font-semibold mb-4">Batch Items</h2>
        {batch.items?.length ? (
          <div className="space-y-4">
            {batch.items.map((item) => (
              <div
                key={item.id}
                className="border border-gray-200 rounded-lg p-4 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center"
              >
                <div>
                  <p className="font-semibold">{item.productTitle}</p>
                  <p className="text-sm text-gray-500">
                    SKU: {item.sku || "—"}
                  </p>
                  <p className="text-sm text-gray-500">
                    Store: {item.storeName}
                  </p>
                </div>
                <div className="text-sm mt-2 sm:mt-0 text-right">
                  <p>Qty: {item.quantityInBatch}</p>
                  <p className="text-gray-600">
                    Order : #{item.orderNumber || "—"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No items in this batch.</p>
        )}
      </div>
    </div>
  );
};

export default BatchesDetail;
