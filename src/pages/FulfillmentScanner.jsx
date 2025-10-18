import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import QrScanner from "../components/QrScanner";

export default function FulfillmentScanner() {
  const { user, isLoading } = useAuth();
  const [order, setOrder] = useState(null);

  console.log(order);
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
            Scan each item QR code when <strong>packing into box</strong>
          </p>
        </div>

        {/* QR Scanner */}
        <QrScanner
          onSuccess={(data) => {
            if (data?.order) setOrder(data.order);
          }}
        />

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
              Status:{" "}
              <strong
                className={
                  order.status === "COMPLETED"
                    ? "text-green-600"
                    : "text-yellow-600"
                }
              >
                {order.status}
              </strong>
            </p>

            <div className="space-y-6">
              {order.items?.map((item) => (
                <div
                  key={item.id}
                  className="border rounded-lg p-4 bg-gray-50 shadow-sm"
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={item.product?.imgUrl}
                      alt={item.product?.title}
                      className="w-16 h-16 object-cover rounded-md"
                    />
                    <div>
                      <p className="font-semibold text-lg">
                        {item.product?.title}
                      </p>
                      <p className="text-sm text-gray-500">
                        {item.variant?.sku} — {item.quantity} units total
                      </p>
                      <p className="text-sm mt-1">
                        Item status:{" "}
                        <span
                          className={`font-semibold ${
                            item.status === "PACKED"
                              ? "text-green-600"
                              : item.status === "CUT"
                              ? "text-blue-600"
                              : "text-gray-600"
                          }`}
                        >
                          {item.status}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Batch Items */}
                  <div className="mt-4 pl-4 border-l-2 border-teal-300 space-y-3">
                    {item.BatchItem?.map((batch) => (
                      <div
                        key={batch.id}
                        className="bg-white p-3 rounded-md border shadow-sm"
                      >
                        <div className="flex justify-between items-center">
                          <p className="font-medium">
                            Batch ID:{" "}
                            <span className="text-gray-600">
                              {batch.batchId}
                            </span>
                          </p>
                          <span
                            className={`text-sm px-2 py-1 rounded-full ${
                              batch.status === "PACKED"
                                ? "bg-green-100 text-green-700"
                                : batch.status === "CUT"
                                ? "bg-blue-100 text-blue-700"
                                : batch.status === "WAITING_BATCH"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {batch.status}
                          </span>
                        </div>

                        {/* Units */}
                        <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                          {batch.units?.map((unit) => (
                            <div
                              key={unit.id}
                              className={`text-xs border rounded-md px-2 py-1 text-center ${
                                unit.status === "PACKED"
                                  ? "bg-green-50 border-green-300 text-green-700"
                                  : unit.status === "CUT"
                                  ? "bg-blue-50 border-blue-300 text-blue-700"
                                  : unit.status === "WAITING_BATCH"
                                  ? "bg-yellow-50 border-yellow-300 text-yellow-700"
                                  : "bg-gray-50 border-gray-300 text-gray-600"
                              }`}
                            >
                              {unit.status}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
