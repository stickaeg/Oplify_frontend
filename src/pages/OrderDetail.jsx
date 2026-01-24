import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getOrderById,
  itemStatusUpdate,
  replacement,
  bulkUpdateOrderItemsStatus,
} from "../api/agentsApi";
import getStatusClasses from "../utils/statusColors";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";
import { IoMdArrowDropdown, IoMdArrowDropright } from "react-icons/io";
import { MdRefresh } from "react-icons/md";

const OrderDetail = () => {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // ✅ Track selected units per order item
  const [selectedUnits, setSelectedUnits] = useState({});
  const [expandedItems, setExpandedItems] = useState({});

  const [hoveredImage, setHoveredImage] = useState(null);

  const {
    data: order,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["order", id],
    queryFn: () => getOrderById(id),
  });

  console.log("Order Data:", order);

  // ✅ Mutation to update item status
  const updateStatusMutation = useMutation({
    mutationFn: ({ orderItemId, status, unitIds }) =>
      itemStatusUpdate(orderItemId, status, unitIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order", id] });
      setSelectedUnits({});
    },
    onError: (error) => {
      console.error("❌ Frontend error:", error.response?.data);
      alert("Failed to update status");
    },
  });

  // ✅ NEW: Bulk status mutation for all items in order
  const bulkStatusMutation = useMutation({
    mutationFn: ({ orderId, status }) =>
      bulkUpdateOrderItemsStatus(orderId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order", id] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (error) => {
      console.error("❌ Bulk status update failed:", error.response?.data);
      alert("Failed to update all items status");
    },
  });

  // ✅ NEW: Handle bulk status change for entire order
  const handleBulkStatusChange = (orderId, status) => {
    if (!status) return;
    bulkStatusMutation.mutate({ orderId, status });
  };

  // ✅ Mutation for replacement (redesign/reprint)
  const replacementMutation = useMutation({
    mutationFn: ({ unitId, reason }) => replacement(unitId, reason),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["order", id] });
      alert(
        `✅ Replacement created: ${data.reason}\nNew Unit ID: ${data.newUnitId}\nNew Batch: ${data.newBatch.name}`,
      );
    },
    onError: (error) => {
      console.error("Failed to create replacement:", error);
      alert("Failed to create replacement unit");
    },
  });

  const handleStatusChange = (orderItemId, newStatus, unitIds = null) => {
    updateStatusMutation.mutate({
      orderItemId,
      status: newStatus,
      unitIds,
    });
  };

  // ✅ Handle replacement (redesign/reprint)
  const handleReplacement = (unitId, reason) => {
    if (
      !confirm(
        `Create a replacement unit for ${reason}?\n\nThe current unit will be marked as CANCELLED and a new unit will be created in a new batch.`,
      )
    ) {
      return;
    }

    replacementMutation.mutate({ unitId, reason });
  };

  // ✅ Toggle unit selection
  const toggleUnitSelection = (itemId, unitId) => {
    setSelectedUnits((prev) => {
      const itemUnits = prev[itemId] || [];
      const isSelected = itemUnits.includes(unitId);

      return {
        ...prev,
        [itemId]: isSelected
          ? itemUnits.filter((id) => id !== unitId)
          : [...itemUnits, unitId],
      };
    });
  };

  // ✅ Select all units for an item
  const toggleAllUnits = (itemId, allUnitIds) => {
    setSelectedUnits((prev) => {
      const itemUnits = prev[itemId] || [];
      const allSelected = allUnitIds.every((id) => itemUnits.includes(id));

      return {
        ...prev,
        [itemId]: allSelected ? [] : allUnitIds,
      };
    });
  };

  // ✅ Toggle expanded view
  const toggleExpanded = (itemId) => {
    setExpandedItems((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  if (isLoading) return <p className="text-center py-10">Loading...</p>;
  if (isError)
    return (
      <p className="text-center py-10 text-red-500">Error loading order</p>
    );

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
    "RETURNED",
    "CANCELLED",
  ];

  const canEditStatus = user?.role === "ADMIN" || user?.role === "FULLFILLMENT";
  const canReplace = ["ADMIN", "DESIGNER", "PRINTER", "FULLFILLMENT"].includes(
    user?.role,
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
              order.status,
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
                EGP {order.totalPrice?.toFixed(2) || "-"}
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

        {/* ✅ NEW: Bulk Status Control for Entire Order */}
        {canEditStatus && (
          <div className="border-t border-gray-200 bg-blue-50 px-6 py-4">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700">
                Set ALL items status:
              </span>
              <div
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                <select
                  defaultValue=""
                  disabled={bulkStatusMutation.isPending}
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                  onChange={(e) => {
                    e.stopPropagation();
                    const value = e.target.value;
                    if (!value) return;
                    handleBulkStatusChange(order.id, value);
                    e.target.value = "";
                  }}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-800 hover:border-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">Set all items…</option>
                  <option value="FULFILLED">Mark all Fulfilled</option>
                  <option value="CANCELLED">Mark all Cancelled</option>
                  <option value="RETURNED">Mark all Returned</option>
                </select>
              </div>
              {bulkStatusMutation.isPending && (
                <span className="text-sm text-blue-600 animate-pulse">
                  Updating...
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ===== ITEMS ===== */}
      <div className="bg-white shadow rounded p-4 overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4">Order Items</h2>
        <div className="space-y-4">
          {order.items.map((item) => {
            const allUnits = item.BatchItem?.flatMap((bi) => bi.units) || [];
            const selectedItemUnits = selectedUnits[item.id] || [];
            const isExpanded = expandedItems[item.id];

            // ✅ Calculate status breakdown (exclude cancelled from display)
            const activeUnits = allUnits.filter(
              (u) => u.status !== "CANCELLED",
            );
            const cancelledUnits = allUnits.filter(
              (u) => u.status === "CANCELLED",
            );

            const statusBreakdown = activeUnits.reduce((acc, unit) => {
              acc[unit.status] = (acc[unit.status] || 0) + 1;
              return acc;
            }, {});

            return (
              <div
                key={item.id}
                className="border border-gray-200 rounded-lg p-4 shadow-sm"
              >
                {/* Rest of your item rendering code remains exactly the same */}
                <div className="flex items-center gap-4 relative">
                  {/* ✅ Image container with hover preview positioned next to it */}
                  <div className="relative">
                    {item.product?.imgUrl && (
                      <>
                        <img
                          src={item.product.imgUrl}
                          alt={item.product.title}
                          className="w-16 h-16 object-contain rounded cursor-pointer hover:opacity-80 transition-opacity"
                          onMouseEnter={() =>
                            setHoveredImage({
                              url: item.product.imgUrl,
                              title: item.product.title,
                            })
                          }
                          onMouseLeave={() => setHoveredImage(null)}
                        />

                        {/* ✅ Enlarged preview appears to the right */}
                        {hoveredImage && (
                          <div
                            className="absolute left-0 top-0 z-50 w-100 pointer-events-none flex items-center"
                            onMouseEnter={() =>
                              setHoveredImage({
                                url: item.product.imgUrl,
                                title: item.product.title,
                              })
                            }
                            onMouseLeave={() => setHoveredImage(null)}
                          >
                            <div className="bg-white border-2 border-gray-300 rounded-lg shadow-2xl p-2">
                              <img
                                src={hoveredImage.url}
                                alt={hoveredImage.title}
                                className="w-64 h-64 object-contain"
                              />
                              <div className="mt-2 px-2 py-1 bg-gray-100 rounded">
                                <p className="text-gray-900 font-semibold text-sm">
                                  {hoveredImage.title}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>

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

                    {/* ✅ Status breakdown display */}
                    {activeUnits.length > 0 && (
                      <div className="mt-2 text-xs text-gray-600">
                        {Object.entries(statusBreakdown).map(
                          ([status, count]) => (
                            <span key={status} className="mr-3">
                              <span
                                className={`font-semibold ${getStatusClasses(
                                  status,
                                )}`}
                              >
                                <span className="p-1 rounded">{count}</span>
                              </span>{" "}
                              {status.replaceAll("_", " ")}
                            </span>
                          ),
                        )}
                        {cancelledUnits.length > 0 && (
                          <span className="text-red-500 font-semibold">
                            ({cancelledUnits.length} cancelled)
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="text-right space-y-2">
                    <p className="font-semibold">Qty: {item.quantity}</p>
                    <p>EGP {item.price?.toFixed(2)}</p>

                    {/* ✅ Item-level status dropdown */}
                    {canEditStatus ? (
                      <select
                        value={item.status}
                        onChange={(e) =>
                          handleStatusChange(item.id, e.target.value)
                        }
                        disabled={updateStatusMutation.isPending}
                        className={`px-3 py-1 rounded-md text-xs font-medium uppercase border ${
                          updateStatusMutation.isPending
                            ? "opacity-50 cursor-not-allowed"
                            : "cursor-pointer"
                        }`}
                      >
                        {validStatuses.map((status) => (
                          <option key={status} value={status}>
                            {status.replaceAll("_", " ")}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span
                        className={`px-3 py-1 rounded-md text-xs font-medium uppercase ${getStatusClasses(
                          item.status,
                        )}`}
                      >
                        {item.status?.replaceAll("_", " ")}
                      </span>
                    )}
                  </div>
                </div>

                {/* ===== Unit-Level Controls ===== */}
                {canEditStatus && allUnits.length > 0 && (
                  <div className="mt-4 border-t border-gray-300 pt-3">
                    <div className="flex justify-between items-center mb-2">
                      <button
                        onClick={() => toggleExpanded(item.id)}
                        className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center"
                      >
                        <span>
                          {isExpanded ? (
                            <IoMdArrowDropdown size={19} />
                          ) : (
                            <IoMdArrowDropright size={19} />
                          )}{" "}
                        </span>
                        Manage Individual Units ({activeUnits.length} active
                        {cancelledUnits.length > 0 &&
                          `, ${cancelledUnits.length} cancelled`}
                        )
                      </button>

                      {isExpanded && (
                        <button
                          onClick={() =>
                            toggleAllUnits(
                              item.id,
                              activeUnits.map((u) => u.id),
                            )
                          }
                          className="text-xs text-gray-600 hover:text-gray-800"
                        >
                          {selectedItemUnits.length === activeUnits.length
                            ? "Deselect All"
                            : "Select All"}
                        </button>
                      )}
                    </div>

                    {isExpanded && (
                      <>
                        {/* ✅ Unit checkboxes with replacement buttons */}
                        <div className="grid grid-cols-1 gap-2 mb-3 max-h-96 overflow-y-auto p-2 bg-gray-50 rounded">
                          {allUnits.map((unit, idx) => (
                            <div
                              key={unit.id}
                              className={`flex items-center justify-between p-2 rounded ${
                                unit.status === "CANCELLED"
                                  ? "bg-red-50 opacity-60"
                                  : "hover:bg-gray-100"
                              }`}
                            >
                              <label className="flex items-center gap-2 text-sm cursor-pointer flex-1">
                                <input
                                  type="checkbox"
                                  checked={selectedItemUnits.includes(unit.id)}
                                  onChange={() =>
                                    toggleUnitSelection(item.id, unit.id)
                                  }
                                  disabled={unit.status === "CANCELLED"}
                                  className="rounded"
                                />
                                <span className="font-medium">
                                  Unit #{idx + 1}
                                </span>
                                <span
                                  className={`text-xs px-2 py-1 rounded ${getStatusClasses(
                                    unit.status,
                                  )}`}
                                >
                                  {unit.status.replaceAll("_", " ")}
                                </span>
                              </label>

                              {/* ✅ Replacement buttons (only for non-cancelled units) */}
                              {canReplace && unit.status !== "CANCELLED" && (
                                <div className="flex gap-1">
                                  <button
                                    onClick={() =>
                                      handleReplacement(unit.id, "REDESIGN")
                                    }
                                    disabled={replacementMutation.isPending}
                                    className="flex items-center gap-1 text-xs px-2 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Create replacement for redesign"
                                  >
                                    <MdRefresh size={14} />
                                    Reprint
                                  </button>
                                </div>
                              )}

                              {/* ✅ Show if cancelled */}
                              {unit.status === "CANCELLED" && (
                                <span className="text-xs text-red-600 italic">
                                  Replaced
                                </span>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* ✅ Update selected units */}
                        {selectedItemUnits.length > 0 && (
                          <div className="flex items-center gap-2 bg-blue-50 p-2 rounded">
                            <span className="text-sm font-medium">
                              Update {selectedItemUnits.length} selected unit(s)
                              to:
                            </span>
                            <select
                              onChange={(e) => {
                                if (e.target.value) {
                                  handleStatusChange(
                                    item.id,
                                    e.target.value,
                                    selectedItemUnits,
                                  );
                                }
                              }}
                              value=""
                              disabled={updateStatusMutation.isPending}
                              className="px-3 py-1 text-sm border rounded cursor-pointer"
                            >
                              <option value="">-- Select Status --</option>
                              {validStatuses.map((status) => (
                                <option key={status} value={status}>
                                  {status.replaceAll("_", " ")}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* ===== Batch List ===== */}
                {item.BatchItem?.length > 0 && (
                  <div className="mt-4 border-t border-gray-300 pt-3">
                    <p className="font-medium text-sm mb-2 text-gray-700">
                      Batches:
                    </p>
                    <div className="space-y-2">
                      {item.BatchItem.map((b) => {
                        const activeBatchUnits = b.units.filter(
                          (u) => u.status !== "CANCELLED",
                        ).length;
                        return (
                          <div
                            key={b.id}
                            className="flex items-center justify-between text-sm"
                          >
                            <div>
                              <span className="font-semibold">
                                {b.batch.name}
                              </span>
                              <span className="text-xs text-gray-500 ml-2">
                                ({activeBatchUnits}/{b.units.length} units)
                              </span>
                            </div>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusClasses(
                                b.status,
                              )}`}
                            >
                              {b.status.replaceAll("_", " ")}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
