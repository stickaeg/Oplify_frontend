import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import QRScanner from "../components/QrScanner";
import { useAuth } from "../context/AuthContext";
import { Navigate } from "react-router-dom";
import { getOrderById, scanItemFulfillment } from "../api/agentsApi";

export default function FulfillmentScanner() {
  const { user, isLoading } = useAuth();
  const [scannedToken, setScannedToken] = useState(null);
  const [orderId, setOrderId] = useState(null);

  // --- React Query: Get order details after we know orderId ---
  const {
    data: order,
    isFetching: orderLoading,
    error: orderError,
  } = useQuery({
    queryKey: ["order", orderId],
    queryFn: () => getOrderById(orderId),
    enabled: !!orderId,
  });

  // --- React Query: Mutation for scanning fulfillment ---
  const mutation = useMutation({
    mutationFn: (token) => scanItemFulfillment(token),
    onSuccess: (data) => {
      // assume your backend returns something like { success: true, orderId }
      if (data?.orderId) setOrderId(data.orderId);
    },
    onError: (err) => {
      console.error("Scan error:", err);
      alert(
        "Failed to scan item: " + (err.response?.data?.error || err.message)
      );
    },
  });

  // --- Handle scanned QR ---
  const handleScan = (token) => {
    if (!token) return;
    setScannedToken(token);
    mutation.mutate(token);
  };

  // --- Auth protection ---
  if (isLoading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (user.role !== "FULFILLMENT" && user.role !== "ADMIN") {
    return (
      <div className="text-center p-8">Access Denied - Fulfillment Only</div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        {/* Header */}
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

        {/* QR Scanner */}
        <QRScanner onScan={handleScan} />

        {/* Loading / Error / Data States */}
        {mutation.isPending && (
          <div className="mt-4 text-yellow-700">⏳ Processing scan...</div>
        )}
        {orderLoading && <div className="mt-4">Loading order details...</div>}
        {orderError && (
          <div className="mt-4 text-red-600">Failed to load order.</div>
        )}

        {/* Order Details */}
        {order && (
          <div className="mt-6 bg-white shadow p-5 rounded-lg">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">
              Order #{order.orderNumber}
            </h2>
            <p className="text-gray-700 mb-2">
              Customer: <strong>{order.customerName}</strong>
            </p>
            <p className="text-gray-700 mb-4">
              Status: <strong>{order.status}</strong>
            </p>
            <div className="space-y-2">
              {order.items?.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between items-center border-b py-2"
                >
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-gray-500">
                      {item.quantity} units
                    </p>
                  </div>
                  <p
                    className={`text-sm font-semibold ${
                      item.status === "PACKED"
                        ? "text-green-600"
                        : "text-gray-500"
                    }`}
                  >
                    {item.status}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
