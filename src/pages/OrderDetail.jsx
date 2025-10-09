import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getOrderById } from "../api/agentsApi";

const statusColors = {
  PENDING: "bg-yellow-400", // Initial Shopify
  WAITING_BATCH: "bg-gray-400", // Waiting for batch capacity
  BATCHED: "bg-blue-500", // Batch full / ready
  DESIGNING: "bg-purple-500", // Design phase
  PRINTING: "bg-indigo-500", // Printing in progress
  CUTTING: "bg-pink-500", // Cutting stage
  FULFILLMENT: "bg-teal-500", // Being packed or shipped
  COMPLETED: "bg-green-600", // Done
  CANCELLED: "bg-red-500", // Cancelled
};

const OrderDetail = () => {
  const { id } = useParams();
  const {
    data: order,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["order", id],
    queryFn: () => getOrderById(id),
  });

  if (isLoading) return <p className="text-center py-10">Loading...</p>;
  if (isError)
    return (
      <p className="text-center py-10 text-red-500">Error loading order</p>
    );

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      {/* ===== ORDER INFO ===== */}
      <div className="bg-white shadow rounded p-4">
        <h1 className="text-2xl font-bold mb-2">Order #{order.orderNumber}</h1>
        <p>
          <span className="font-semibold">Store:</span> {order.store?.name}
        </p>
        <p>
          <span className="font-semibold">Customer:</span>{" "}
          {order.customerName || "-"}
        </p>
        <p>
          <span className="font-semibold">Email:</span>{" "}
          {order.customerEmail || "-"}
        </p>
        <p>
          <span className="font-semibold">Total:</span> $
          {order.totalPrice?.toFixed(2) || "-"}
        </p>
        <p>
          <span className="font-semibold">Status:</span>{" "}
          <span
            className={`font-medium ${
              order.status === "pending"
                ? "text-yellow-500"
                : order.status === "fulfilled"
                ? "text-green-500"
                : "text-red-500"
            }`}
          >
            {order.status}
          </span>
        </p>
        <p>
          <span className="font-semibold">Created:</span>{" "}
          {new Date(order.createdAt).toLocaleString()}
        </p>
      </div>

      {/* ===== ITEMS ===== */}
      <div className="bg-white shadow rounded p-4 overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4">Order Items</h2>
        <div className="space-y-4">
          {order.items.map((item) => (
            <div
              key={item.id}
              className="border border-gray-200 rounded-lg p-4 shadow-sm"
            >
              <div className="flex items-center gap-4">
                {item.product?.imgUrl && (
                  <img
                    src={item.product.imgUrl}
                    alt={item.product.title}
                    className="w-16 h-16 object-contain rounded"
                  />
                )}
                <div className="flex-1">
                  <p className="font-semibold text-lg">
                    {item.product?.title || "—"}
                  </p>
                  <p className="text-gray-600 text-sm">
                    {item.variant?.sku || "-"}
                  </p>
                  <p className="text-sm text-gray-600">
                    Type: {item.product?.productType || "-"}
                  </p>
                  <p
                    className={`text-sm font-semibold ${
                      item.product?.isPod ? "text-green-500" : "text-blue-500"
                    }`}
                  >
                    {item.product?.isPod ? "POD" : "Stock"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">Qty: {item.quantity}</p>
                  <p>${item.price?.toFixed(2)}</p>
                </div>
              </div>

              {/* ===== Batch List ===== */}
              {item.batches && item.batches.length > 0 && (
                <div className="mt-4 border-t pt-3">
                  <p className="font-medium text-sm mb-2 text-gray-700">
                    Batches:
                  </p>
                  <div className="space-y-2">
                    {item.batches.map((b) => (
                      <div
                        key={b.batchId}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="font-semibold">{b.batchName}</span>
                        <span
                          className={`px-3 py-1 rounded-full text-white text-xs font-semibold ${
                            statusColors[b.status] || "bg-gray-400"
                          }`}
                        >
                          {b.status.replaceAll("_", " ")}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Overall Item Status */}
                  <p className="text-xs text-gray-600 mt-3">
                    Overall:{" "}
                    <span
                      className={`font-semibold ${
                        statusColors[item.overallStatus] || "bg-gray-400"
                      } text-white px-2 py-0.5 rounded`}
                    >
                      {item.overallStatus.replaceAll("_", " ")}
                    </span>
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
