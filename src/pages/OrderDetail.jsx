import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getOrderById } from "../api/agentsApi";
import getStatusClasses from "../utils/statusColors";

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

  console.log(order);

  if (isLoading) return <p className="text-center py-10">Loading...</p>;
  if (isError)
    return (
      <p className="text-center py-10 text-red-500">Error loading order</p>
    );

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      {/* ===== ORDER INFO ===== */}
      <div className="bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between px-6 py-5 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">
            Order #{order.orderNumber}
          </h1>
          <span
            className={`px-3 py-1 rounded-md text-xs font-medium uppercase ${getStatusClasses(
              order.status
            )}`}
          >
            {order.status?.replaceAll("_", " ") || "-"}
          </span>
        </div>

        {/* Info grid */}
        <div className="grid md:grid-cols-3 sm:grid-cols-2 gap-8 p-6 text-sm">
          {/* Store */}
          <div className="space-y-1">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Store
            </h3>
            <p className="text-gray-900 font-medium">
              {order.store?.name || "-"}
            </p>
            <p className="text-xs text-gray-500">
              {order.store?.shopDomain || ""}
            </p>
          </div>

          {/* Customer */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Customer
            </h3>
            <div>
              <p className="text-xs text-gray-500">Name</p>
              <p className="text-gray-900 font-medium">
                {order.customerName || "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Email</p>
              <p className="text-sm text-gray-900">
                {order.customerEmail || "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Phone</p>
              <p className="text-sm text-gray-900">
                {order.customerPhone || "—"}
              </p>
            </div>
          </div>

          {/* Summary */}
          <div className="space-y-1">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Summary
            </h3>
            <p className="text-gray-900">
              <span className="text-sm text-gray-600">Total:</span>{" "}
              <span className="text-lg font-bold">
                ${order.totalPrice?.toFixed(2) || "-"}
              </span>
            </p>
            <p className="text-sm text-gray-600">
              {new Date(order.createdAt).toLocaleString("en-US", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </p>
          </div>
        </div>

        {/* Address section */}
        <div className="border-t border-gray-200 bg-gray-50 px-6 py-5 grid sm:grid-cols-2 md:grid-cols-3 gap-6 text-sm">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Address 1
            </p>
            <p className="text-gray-900">{order.address1 || "—"}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Address 2
            </p>
            <p className="text-gray-900">{order.address2 || "—"}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Province
            </p>
            <p className="text-gray-900">{order.province || "—"}</p>
          </div>
        </div>
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
                  <div
                    className={`px-3 py-1 mt-2 rounded-full text-xs font-semibold ${getStatusClasses(
                      item.status
                    )}`}
                  >
                    {item.status?.replaceAll("_", " ")}
                  </div>
                </div>
              </div>

              {/* ===== Batch List ===== */}
              {item.BatchItem?.length > 0 && (
                <div className="mt-4 border-t pt-3">
                  <p className="font-medium text-sm mb-2 text-gray-700">
                    Batches:
                  </p>
                  <div className="space-y-2">
                    {item.BatchItem.map((b) => (
                      <div
                        key={b.batchId}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="font-semibold">{b.batch.name}</span>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusClasses(
                            b.status
                          )}`}
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
                      className={`font-semibold px-2 py-0.5 rounded text-xs ${getStatusClasses(
                        item.overallStatus
                      )}`}
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
