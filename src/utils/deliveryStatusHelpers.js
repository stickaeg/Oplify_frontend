// src/utils/deliveryStatusHelpers.js

const deliveryStatusConfig = {
  DELIVERY_CREATED: {
    label: "Delivery created",
    className: "bg-red-100 text-gray-800 border border-gray-200",
  },
  IN_TRANSIT: {
    label: "In transit",
    className: "bg-blue-100 text-blue-800 border border-blue-200",
  },
  OUT_FOR_DELIVERY: {
    label: "Out for delivery",
    className: "bg-indigo-100 text-indigo-800 border border-indigo-200",
  },
  DELIVERED: {
    label: "Delivered",
    className: "bg-green-100 text-green-800 border border-green-200",
  },
  FAILED: {
    label: "Failed",
    className: "bg-red-100 text-red-800 border border-red-200",
  },
  RETURNED: {
    label: "Returned",
    className: "bg-yellow-100 text-yellow-800 border border-yellow-200",
  },
  EXCEPTION: {
    label: "Exception",
    className: "bg-orange-100 text-orange-800 border border-orange-200",
  },
  CANCELLED: {
    label: "Cancelled",
    className: "bg-slate-100 text-slate-800 border border-slate-200",
  },
};

export function getDeliveryStatusMeta(status) {
  if (!status) {
    return {
      label: "-",
      className: "bg-gray-100 text-gray-500 border border-gray-200",
    };
  }

  const config = deliveryStatusConfig[status];

  if (config) return config;

  // Fallback for unknown values: convert "SOME_STATUS" -> "Some status"
  const fallbackLabel = status
    .toLowerCase()
    .split("_")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");

  return {
    label: fallbackLabel,
    className: "bg-gray-100 text-gray-800 border border-gray-200",
  };
}
