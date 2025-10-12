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
      {(user?.role === "ADMIN" || user?.role === "DESIGNER") && (
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
          {batch.qrCodeUrl && (
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
                <a
                  href={batch.qrCodeUrl}
                  download={`${batch.name}-QR.png`}
                  className="mt-2 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition"
                >
                  Download Batch QR
                </a>
              </div>
            </div>
          )}
        </div>
      )}

      {batch.qrCodeUrl && (
        <div className="mt-6 flex justify-center gap-4">
          {user?.role === "PRINTER" && (
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

      {/* ===== Batch Items & Units ===== */}
      <div className="bg-white shadow rounded p-6">
        <h2 className="text-xl font-semibold mb-4">Batch Items & Units</h2>

        {batch.items?.length ? (
          <div className="space-y-8">
            {batch.items.map((item) => (
              <div
                key={item.id}
                className="border border-gray-200 rounded-lg p-5 shadow-sm"
              >
                {/* 🧱 Item Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                  <div>
                    <p className="font-semibold text-lg text-gray-800">
                      {item.units?.[0]?.productTitle || "Unknown Product"}
                    </p>
                    <p className="text-sm text-gray-500">
                      Store: {item.units?.[0]?.storeName || "—"}
                    </p>
                  </div>
                  <div className="text-sm text-gray-600 mt-2 sm:mt-0">
                    <p>Order: #{item.units?.[0]?.orderNumber || "—"}</p>
                    <p>Units: {item.totalUnits}</p>
                  </div>
                </div>

                {/* 🧩 Unit Grid */}
                {item.units?.length ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {item.units.map((unit) => (
                      <div
                        key={unit.id}
                        className="bg-gradient-to-br from-gray-50 to-gray-100 p-3 rounded-lg shadow hover:shadow-md transition"
                      >
                        {user.role === "DESIGNER" && (
                          <div className="bg-white p-2 rounded-lg border border-gray-200 mb-2 flex items-center justify-center">
                            {unit.qrCodeUrl ? (
                              <img
                                src={unit.qrCodeUrl}
                                alt="QR"
                                className="w-24 h-24 object-contain"
                              />
                            ) : (
                              <p className="text-xs text-gray-400">No QR</p>
                            )}
                          </div>
                        )}

                        <p className="text-xs font-semibold text-gray-800 line-clamp-2">
                          {unit.productTitle}
                        </p>
                        <p className="text-xs text-gray-500">{unit.sku}</p>

                        <p
                          className={`text-[10px] mt-1 px-2 py-1 rounded-full text-white inline-block ${
                            statusColors[unit.status] || "bg-gray-400"
                          }`}
                        >
                          {unit.status}
                        </p>

                        {unit.qrCodeUrl && (
                          <a
                            href={unit.qrCodeUrl}
                            download={`${unit.productTitle}-QR.png`}
                            className="block mt-2 text-center text-xs text-blue-600 font-medium hover:underline"
                          >
                            Download
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm">
                    No units found for this item.
                  </p>
                )}
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
