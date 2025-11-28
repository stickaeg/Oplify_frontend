import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import QrScanner from "../components/QrScanner";
import { useMutation } from "@tanstack/react-query";
import { itemStatusUpdate } from "../api/agentsApi";

const validStatuses = [
  "PENDING",
  "WAITING_BATCH",
  "BATCHED",
  "DESIGNING",
  "DESIGNED",
  "PRINTING",
  "PRINTED",
  "CUTTING",
  "CUT",
  "FULFILLMENT",
  "FULFILLED",
  "PACKED",
  "COMPLETED",
  "CANCELLED",
];

export default function FulfillmentScanner() {
  const { user, isLoading } = useAuth();
  const [order, setOrder] = useState(null);
  const [updatingItemId, setUpdatingItemId] = useState(null);

  const { mutate: changeStatus, isPending } = useMutation({
    mutationFn: ({ orderItemId, status }) =>
      itemStatusUpdate(orderItemId, status),

    onSuccess: (data) => {
      console.log("✅ Status update response:", data);

      // Update the entire order with the new data from backend
      if (data?.order) {
        setOrder(data.order);
        console.log("✅ Order fully updated with new statuses");
      }

      setUpdatingItemId(null);
    },

    onError: (err) => {
      console.error(
        "❌ Failed to update item status:",
        err.response?.data || err.message
      );
      setUpdatingItemId(null);
    },
  });

  const handleStatusChange = (orderItemId, newStatus) => {
    setUpdatingItemId(orderItemId);
    changeStatus({ orderItemId, status: newStatus });
  };

  if (isLoading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (user.role !== "FULLFILLMENT" && user.role !== "ADMIN") {
    return (
      <div className="text-center p-8 text-red-600 font-semibold">
        Access Denied – Fulfillment Only
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        {/* Header */}
        <div className="bg-teal-50 border-2 border-teal-200 rounded-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-teal-900 mb-2">
            Fulfillment Scanner
          </h1>
          <p className="text-teal-700">
            Scan QR code or manually update item status
          </p>
        </div>

        {/* QR Scanner */}
        <QrScanner
          onSuccess={(data) => {
            if (data?.order) {
              setOrder(data.order);
              console.log("📦 Scanned order loaded", data.order);
            }
          }}
        />

        {/* Order Details */}
        {order && (
          <div className="mt-6 bg-white shadow p-5 rounded-lg">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">
                  Order #{order.orderNumber}
                </h2>
                <p className="text-gray-600 text-sm">
                  Customer: <strong>{order.customerName}</strong>
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Overall Status:</p>
                <span
                  className={`text-lg font-bold ${
                    order.status === "COMPLETED"
                      ? "text-green-600"
                      : order.status === "PACKED"
                      ? "text-blue-600"
                      : "text-yellow-600"
                  }`}
                >
                  {order.status}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              {order.items?.map((item) => (
                <div
                  key={item.id}
                  className="border-2 rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    {/* Product Image */}
                    <img
                      src={item.product?.imgUrl}
                      alt={item.product?.title}
                      className="w-20 h-20 object-cover rounded-md shadow-sm"
                    />

                    {/* Product Info & Status Control */}
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold text-lg text-gray-800">
                            {item.product?.title}
                          </p>
                          <p className="text-sm text-gray-500">
                            SKU: {item.variant?.sku} • Qty: {item.quantity}
                          </p>
                        </div>
                      </div>

                      {/* Manual Status Update Dropdown */}
                      <div className="flex items-center gap-3 mt-3 p-3 bg-white rounded-md border border-gray-300">
                        <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                          Item Status:
                        </label>
                        <select
                          value={item.status}
                          onChange={(e) =>
                            handleStatusChange(item.id, e.target.value)
                          }
                          disabled={isPending && updatingItemId === item.id}
                          className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-teal-400 focus:border-teal-400 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {validStatuses.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>

                        {/* Loading indicator */}
                        {isPending && updatingItemId === item.id && (
                          <span className="text-xs text-teal-600 font-medium animate-pulse">
                            Updating...
                          </span>
                        )}

                        {/* Status badge */}
                        {!isPending && (
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                              item.status === "PACKED"
                                ? "bg-green-100 text-green-700"
                                : item.status === "CUT"
                                ? "bg-blue-100 text-blue-700"
                                : item.status === "FULFILLMENT"
                                ? "bg-purple-100 text-purple-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {item.status}
                          </span>
                        )}
                      </div>

                      {/* Batch Items Info (Optional - can be collapsed) */}
                      {item.BatchItem && item.BatchItem.length > 0 && (
                        <details className="mt-3">
                          <summary className="text-sm text-gray-600 cursor-pointer hover:text-teal-600 font-medium">
                            📦 View Batch Details ({item.BatchItem.length} batch
                            {item.BatchItem.length > 1 ? "es" : ""})
                          </summary>
                          <div className="mt-2 pl-4 border-l-2 border-teal-300 space-y-2">
                            {item.BatchItem.map((batch) => (
                              <div
                                key={batch.id}
                                className="bg-white p-3 rounded-md border text-sm"
                              >
                                <p className="font-medium text-gray-700">
                                  {batch.batch?.name || "N/A"}
                                </p>
                                <p className="text-xs text-gray-500">
                                  Batch Status: <strong>{batch.status}</strong>
                                </p>

                                {/* Units */}
                                {batch.units && batch.units.length > 0 && (
                                  <div className="mt-2 flex flex-wrap gap-1">
                                    {batch.units.map((unit) => (
                                      <span
                                        key={unit.id}
                                        className={`text-xs px-2 py-1 rounded ${
                                          unit.status === "PACKED"
                                            ? "bg-green-100 text-green-700"
                                            : unit.status === "CUT"
                                            ? "bg-blue-100 text-blue-700"
                                            : "bg-gray-100 text-gray-600"
                                        }`}
                                      >
                                        {unit.status}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="mt-4 pt-4 border-t border-gray-300">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">
                  Total Items: <strong>{order.items?.length || 0}</strong>
                </span>
                <span className="text-gray-600">
                  Packed Items:{" "}
                  <strong className="text-green-600">
                    {order.items?.filter((i) => i.status === "PACKED").length ||
                      0}
                  </strong>
                </span>
                <span className="text-gray-600">
                  Total Price:{" "}
                  <strong className="text-teal-700">
                    ${order.totalPrice || 0}
                  </strong>
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!order && (
          <div className="mt-6 text-center text-gray-500 p-8 bg-white rounded-lg border-2 border-dashed border-gray-300">
            <p className="text-lg">📷 Scan a QR code to load order details</p>
          </div>
        )}
      </div>
    </div>
  );
}
