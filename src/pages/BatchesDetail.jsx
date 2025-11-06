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
import { useNavigate } from "react-router-dom";

import Table from "../components/Table";
import { useAuth } from "../context/AuthContext";

const statusColors = {
  PENDING: "bg-yellow-400",
  WAITING_BATCH: "bg-gray-400",
  BATCHED: "bg-blue-500",
  DESIGNING: "bg-purple-500",
  DESIGNED: "bg-violet-500",
  PRINTING: "bg-indigo-500",
  PRINTED: "bg-indigo-700",
  CUTTING: "bg-pink-500",
  CUT: "bg-pink-700",
  FULFILLMENT: "bg-teal-500",
  COMPLETED: "bg-green-600",
  CANCELLED: "bg-red-500",
};

export default function BatchesDetail() {
  const navigate = useNavigate();

  const { batchId } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedFiles, setSelectedFiles] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // === Fetch batch ===
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

  const handleStatusUpdate = async (newStatus) => {
    setIsUpdatingStatus(true);
    try {
      await updateBatchStatus(batch.id, newStatus);
      queryClient.invalidateQueries(["batch", batch.id]);
      queryClient.invalidateQueries(["batches"]);
      console.log(`Batch ${batch.id} status changed to ${newStatus}`);
    } catch (error) {
      console.error("Status update failed:", error);
      alert("Failed to update batch status");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  if (isLoading) return <p className="text-center py-10">Loading batch...</p>;
  if (isError)
    return (
      <p className="text-center py-10 text-red-500">
        Error loading batch: {error.message}
      </p>
    );

  console.log(batch);
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
              {batch.status}
            </span>
          </p>
          {batch.rules?.length > 0 && (
            <p>
              <span className="font-semibold">Rule:</span>{" "}
              {batch.rules.map((r) => r.name).join(", ")}
            </p>
          )}
        </div>
      </div>

      {/* ===== Files ===== */}
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

      {user?.role === "PRINTER" && (
        <div className="flex justify-end gap-3 mb-4">
          <button
            onClick={() => handleStatusUpdate("REDESIGN")}
            disabled={isUpdatingStatus}
            className={`text-white px-4 py-2 rounded-lg transition font-medium ${
              isUpdatingStatus
                ? "bg-gray-400 cursor-not-allowed opacity-60"
                : "bg-orange-600 hover:bg-orange-700"
            }`}
          >
            {isUpdatingStatus ? "Updating..." : "Request Redesign"}
          </button>
          <button
            onClick={() => navigate("/scan/printer")}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition"
          >
            Go to Printer Scanner
          </button>
        </div>
      )}

      {user?.role === "CUTTER" && (
        <div className="flex justify-end gap-3 mb-4">
          <button
            onClick={() => handleStatusUpdate("REPRINT")}
            disabled={isUpdatingStatus}
            className={`text-white px-4 py-2 rounded-lg transition font-medium ${
              isUpdatingStatus
                ? "bg-gray-400 cursor-not-allowed opacity-60"
                : "bg-rose-600 hover:bg-rose-700"
            }`}
          >
            {isUpdatingStatus ? "Updating..." : "Request Reprint"}
          </button>
          <button
            onClick={() => navigate("/scan/cutter")}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition"
          >
            Go to Cutter Scanner
          </button>
        </div>
      )}
      {/* ===== Batch Items (Card Style) ===== */}
      <div className="bg-white shadow rounded p-4">
        <h2 className="text-xl font-semibold mb-4">Batch Items</h2>
        <div className="space-y-5">
          {batch.items?.length ? (
            batch.items.map((item) => {
              return (
                <div
                  key={item.id}
                  className="border border-gray-200 rounded-lg p-4 shadow-sm"
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={item.productImgUrl}
                      alt={item.productTitle}
                      className="w-20 h-20 object-contain rounded"
                    />

                    <div className="flex-1">
                      <p className="font-semibold text-lg">
                        {item?.productTitle || "—"}
                      </p>
                      <p className="text-gray-600 text-sm">
                        {item?.sku || "-"}
                      </p>
                      <p className="capitalize  text-gray-600 ">
                        Store: {item?.storeName || "-"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm">
                        Units: {item.totalUnits}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-gray-500">No items in this batch.</p>
          )}
        </div>
      </div>
    </div>
  );
}
