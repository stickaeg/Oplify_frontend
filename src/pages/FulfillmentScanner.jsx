import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import QrScanner from "../components/QrScanner";

export default function FulfillmentScanner() {
  const { user, isLoading } = useAuth();
  const [order, setOrder] = useState(null);

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
            <div className="space-y-2">
              {order.items?.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between items-center border-b py-2"
                >
                  <div>
                    <p className="font-medium">
                      {item.product?.title || item.name}
                    </p>
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
