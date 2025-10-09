// src/pages/PrinterScanner.jsx
import QRScanner from "../components/QrScanner";
import { useAuth } from "../context/AuthContext";
import { Navigate } from "react-router-dom";

export default function PrinterScanner() {
  const { user, isLoading } = useAuth();

  if (isLoading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (user.role !== "PRINTER" && user.role !== "ADMIN") {
    return <div className="text-center p-8">Access Denied - Printers Only</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-blue-900 mb-2">
            🖨️ Printer Scanner
          </h1>
          <p className="text-blue-700">
            Scan the <strong>batch QR code</strong> after printing all items
          </p>
          <div className="mt-3 bg-white rounded p-3 text-sm">
            <p className="text-gray-700">
              ✅ This will mark the batch as <strong>PRINTED</strong>
            </p>
          </div>
        </div>
        <QRScanner />
      </div>
    </div>
  );
}
