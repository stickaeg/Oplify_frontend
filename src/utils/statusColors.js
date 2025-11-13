const getStatusClasses = (status) => {
  switch (status) {
    case "PENDING":
      return "bg-yellow-200 text-yellow-800";
    case "WAITING_BATCH":
      return "bg-orange-200 text-orange-800";
    case "BATCHED":
      return "bg-blue-200 text-blue-800";
    case "DESIGNING":
      return "bg-purple-200 text-purple-800";
    case "DESIGNED":
      return "bg-indigo-200 text-violet-800";
    case "PRINTING":
      return "bg-teal-200 text-teal-800";
    case "PRINTED":
      return "bg-cyan-200 text-cyan-800";
    case "CUTTING":
      return "bg-pink-200 text-pink-800";
    case "CUT":
      return "bg-rose-200 text-rose-800";
    case "FULFILLMENT":
      return "bg-emerald-200 text-emerald-800 ";
    case "PACKED":
      return "bg-green-300 text-green-900";
    case "COMPLETED":
      return "bg-green-200 text-green-800";
    case "CANCELLED":
      return "bg-red-200 text-red-800";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

export default getStatusClasses;
