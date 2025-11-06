// src/pages/CutterScanner.jsx
import QRScanner from "../components/QrScanner";
import { useAuth } from "../context/AuthContext";
import { Navigate } from "react-router-dom";

export default function CutterScanner() {
  const { user, isLoading } = useAuth();

  if (isLoading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (user.role !== "CUTTER" && user.role !== "ADMIN") {
    return <div className="text-center p-8">Access Denied - Cutters Only</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-pink-50 border-2 border-pink-200 rounded-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-pink-900 mb-2">
            ✂️ Cutter Scanner
          </h1>
          <p className="text-pink-700">
            Scan <strong>Qr Batch </strong>
          </p>
        </div>
        <QRScanner />
      </div>
    </div>
  );
}
