// src/components/QRScanner.jsx
import { useState } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function QRScanner() {
  const [scanning, setScanning] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleScan = (result) => {
    if (!scanning || !result?.[0]?.rawValue) return;

    setScanning(false);
    const scannedUrl = result[0].rawValue;

    console.log("Scanned QR:", scannedUrl);

    // Just redirect to the scanned URL - backend handles everything
    window.location.href = scannedUrl;
  };

  const handleError = (err) => {
    console.error("Camera error:", err);
    setError("Camera access denied. Please enable camera permissions.");
  };

  return (
    <div className="max-w-lg mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-center mb-2">Scan QR Code</h2>
        <p className="text-center text-gray-600 mb-4">
          Logged in as: <span className="font-semibold">{user?.name}</span> (
          {user?.role})
        </p>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div
          className="relative bg-black rounded-lg overflow-hidden"
          style={{ aspectRatio: "1/1" }}
        >
          <Scanner
            onScan={handleScan}
            onError={handleError}
            constraints={{
              facingMode: "environment",
              aspectRatio: 1,
            }}
          />
        </div>

        <div className="mt-4 text-center">
          {scanning ? (
            <p className="text-gray-600">📱 Point camera at QR code</p>
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
