// src/pages/FulfillmentScanner.jsx
import QRScanner from "../components/QrScanner";
import { useAuth } from "../context/AuthContext";
import { Navigate } from "react-router-dom";

export default function FulfillmentScanner() {
  const { user, isLoading } = useAuth();

  if (isLoading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (user.role !== "FULFILLMENT" && user.role !== "ADMIN") {
    return (
      <div className="text-center p-8">Access Denied - Fulfillment Only</div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-teal-50 border-2 border-teal-200 rounded-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-teal-900 mb-2">
            📦 Fulfillment Scanner
          </h1>
          <p className="text-teal-700">
            Scan each item QR code when <strong>packing into box</strong>
          </p>
          <div className="mt-3 bg-white rounded p-3 text-sm space-y-1">
            <p className="text-gray-700">
              ✅ Each scan marks item as <strong>PACKED</strong>
            </p>
            <p className="text-gray-700">
              🎉 All items packed → Order = <strong>COMPLETED</strong>
            </p>
          </div>
        </div>
        <QRScanner />
      </div>
    </div>
  );
}
