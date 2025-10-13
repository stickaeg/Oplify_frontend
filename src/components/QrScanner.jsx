import { useState } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { scanBatch } from "../api/agentsApi";

export default function QRScanner() {
  const [scanning, setScanning] = useState(true);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  // 🔹 Mutation for batch scanning
  const batchMutation = useMutation({
    mutationFn: scanBatch,
    onSuccess: (data) => {
      setMessage(data.message || "✅ Batch scan successful");
      setError(null);
      setScanning(true);
      console.log("Batch Scan Success:", data);
    },
    onError: (err) => {
      console.error("Scan failed:", err);
      const msg =
        err?.response?.data?.error ||
        err?.message ||
        "Something went wrong while scanning";
      setError(msg);
      setMessage(null);
      setScanning(true);
    },
  });

  // 🟩 Handle successful QR read
  const handleScan = async (result) => {
    if (!scanning || !result?.[0]?.rawValue) return;

    setScanning(false);
    setError(null);
    setMessage("⏳ Processing batch QR...");

    try {
      const scannedUrl = result[0].rawValue;
      console.log("📦 Scanned QR:", scannedUrl);

      const url = new URL(scannedUrl);
      const parts = url.pathname.split("/");
      const token = parts.pop();

      // 🧩 Only printer or cutter can scan batches
      if (!["PRINTER", "CUTTER"].includes(user?.role)) {
        setError("Only PRINTER or CUTTER users can scan batches.");
        setScanning(true);
        return;
      }

      // ✅ Call backend controller
      batchMutation.mutate(token);
    } catch (err) {
      console.error("Invalid QR format:", err);
      setError("Invalid or unsupported QR code");
      setScanning(true);
    }
  };

  // 🟥 Handle camera issues
  const handleError = (err) => {
    console.error("Camera error:", err);
    setError("Camera access denied. Please enable permissions.");
  };

  return (
    <div className="max-w-lg mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-center mb-2">
          Scan Batch QR Code
        </h2>
        <p className="text-center text-gray-600 mb-4">
          Logged in as: <span className="font-semibold">{user?.name}</span> (
          {user?.role})
        </p>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            ❌ {error}
          </div>
        )}

        {message && !error && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {message}
          </div>
        )}

        <div
          className="relative bg-black rounded-lg overflow-hidden"
          style={{ aspectRatio: "1/1" }}
        >
          <Scanner
            onScan={handleScan}
            onError={handleError}
            constraints={{ facingMode: "environment", aspectRatio: 1 }}
          />
        </div>

        <div className="mt-4 text-center">
          {scanning ? (
            <p className="text-gray-600">
              📱 Point your camera at the batch QR
            </p>
          ) : (
            <p className="text-blue-600 font-semibold animate-pulse">
              Processing...
            </p>
          )}
        </div>

        <button
          onClick={() => navigate(-1)}
          className="mt-4 w-full bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded"
        >
          ← Back
        </button>
      </div>
    </div>
  );
}
