import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getOrderById } from "../api/agentsApi";

const statusColors = {
  PENDING: "bg-yellow-400",
  WAITING_BATCH: "bg-gray-400",
  BATCHED: "bg-blue-500",
  DESIGNING: "bg-purple-500",
  PRINTING: "bg-indigo-500",
  CUTTING: "bg-pink-500",
  FULFILLMENT: "bg-teal-500",
  COMPLETED: "bg-green-600",
  CANCELLED: "bg-red-500",
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
  console.log(order);
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
              statusColors[order.status] || "text-gray-500"
            }`}
          >
            {order.status.replaceAll("_", " ")}
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
              className="border border-gray-200 rounded-lg p-4 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4"
            >
              <div className="flex items-center gap-4 flex-1">
                {item.product?.imgUrl && (
                  <img
                    src={item.product.imgUrl}
                    alt={item.product.title}
                    className="w-16 h-16 object-contain rounded"
                  />
                )}
                <div>
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
              </div>
              <div className="text-right flex flex-col gap-2">
                <p className="font-semibold">Qty: {item.quantity}</p>
                <p>${item.price?.toFixed(2)}</p>
                <span
                  className={`px-3 py-1 rounded-full text-white text-xs font-semibold ${
                    statusColors[item.status] || "bg-gray-400"
                  }`}
                >
                  {item.status.replaceAll("_", " ")}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
