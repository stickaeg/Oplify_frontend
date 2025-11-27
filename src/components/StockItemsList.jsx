import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getStockItems,
  createStockItem,
  updateStockItem,
  deleteStockItem,
  getStockVariants,
  createStockVariant,
  updateStockVariant,
  deleteStockVariant,
} from "../api/agentsApi";

import Table from "./Table";
import { useEffect } from "react";

const StockItemsList = ({ onClose }) => {
  const queryClient = useQueryClient();

  // State for stock items form
  const [itemFormData, setItemFormData] = useState({ name: "", sku: "" });
  const [editingItemId, setEditingItemId] = useState(null);

  // State for currently expanded stock item to show variants and variant form
  const [expandedItemId, setExpandedItemId] = useState(null);

  console.log(expandedItemId);

  // Variant form state
  const [variantFormData, setVariantFormData] = useState({
    stockItemId: "",
    sku: "",
    name: "",
    color: "",
    size: "",
    currentStock: 0,
    minStockLevel: 5,
    maxStockLevel: null,
  });
  const [editingVariantId, setEditingVariantId] = useState(null);

  // Fetch stock items with variants
  const {
    data: itemsData,
    isLoading: itemsLoading,
    isError: itemsError,
  } = useQuery({
    queryKey: ["stockItems"],
    queryFn: getStockItems,
  });

  // Fetch all variants (optional, or just use variants inside stock items)
  // You can omit if variants come deeply nested in itemsData
  // const { data: variantsData } = useQuery({ queryKey: ["stockVariants"], queryFn: getStockVariants });

  // Mutations for stock items
  const createItemMutation = useMutation({
    mutationFn: createStockItem,
    onSuccess: () => {
      queryClient.invalidateQueries(["stockItems"]);
      if (onClose) onClose();
      setItemFormData({ name: "", sku: "" });
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: ({ id, data }) => updateStockItem(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["stockItems"]);
      if (onClose) onClose();
      setEditingItemId(null);
      setItemFormData({ name: "", sku: "" });
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: (id) => deleteStockItem(id),
    onSuccess: () => queryClient.invalidateQueries(["stockItems"]),
  });

  // Mutations for stock variants
  const createVariantMutation = useMutation({
    mutationFn: createStockVariant,
    onSuccess: () => {
      queryClient.invalidateQueries(["stockItems"]);
      resetVariantForm();
    },
  });

  const updateVariantMutation = useMutation({
    mutationFn: ({ id, data }) => updateStockVariant(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["stockItems"]);
      resetVariantForm();
      setEditingVariantId(null);
    },
  });

  const deleteVariantMutation = useMutation({
    mutationFn: (id) => deleteStockVariant(id),
    onSuccess: () => queryClient.invalidateQueries(["stockItems"]),
  });

  // Stock item form submit
  const handleItemSubmit = (e) => {
    e.preventDefault();
    if (editingItemId) {
      updateItemMutation.mutate({ id: editingItemId, data: itemFormData });
    } else {
      createItemMutation.mutate(itemFormData);
    }
  };

  // Reset variant form state
  const resetVariantForm = () =>
    setVariantFormData({
      stockItemId: expandedItemId,
      sku: "",
      name: "",
      color: "",
      size: "",
      currentStock: 0,
      minStockLevel: 5,
      maxStockLevel: null,
    });

  useEffect(() => {
    if (expandedItemId) {
      setVariantFormData((prev) => ({
        ...prev,
        stockItemId: expandedItemId,
      }));
    }
  }, [expandedItemId]);
  // Variant form submit
  const handleVariantSubmit = (e) => {
    e.preventDefault();

    if (!variantFormData.stockItemId) {
      alert("Please select a stock item to add this variant.");
      return;
    }

    if (editingVariantId) {
      updateVariantMutation.mutate({
        id: editingVariantId,
        data: variantFormData,
      });
    } else {
      createVariantMutation.mutate(variantFormData);
    }
  };

  if (itemsLoading) return <div>Loading stock items...</div>;
  if (itemsError) return <div>Error loading stock items.</div>;

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Stock Items</h2>

      {/* Stock Item Form */}
      <form
        onSubmit={handleItemSubmit}
        className="mb-6 flex gap-4 items-center flex-wrap"
        noValidate
      >
        <input
          placeholder="Name"
          value={itemFormData.name}
          onChange={(e) =>
            setItemFormData({ ...itemFormData, name: e.target.value })
          }
          required
          className="border border-gray-400 rounded px-3 py-2"
        />
        <input
          placeholder="SKU"
          value={itemFormData.sku}
          onChange={(e) =>
            setItemFormData({ ...itemFormData, sku: e.target.value })
          }
          required
          className="border border-gray-400 rounded px-3 py-2"
        />
        <button
          type="submit"
          disabled={
            createItemMutation.isLoading || updateItemMutation.isLoading
          }
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          {editingItemId ? "Update" : "Add"} Stock Item
        </button>
      </form>

      {/* Stock Items Table */}
      <Table>
        <Table.Head>
          <Table.HeaderCell>id</Table.HeaderCell>
          <Table.HeaderCell>Name</Table.HeaderCell>
          <Table.HeaderCell>SKU</Table.HeaderCell>
          <Table.HeaderCell>Variants</Table.HeaderCell>
          <Table.HeaderCell>Actions</Table.HeaderCell>
        </Table.Head>
        <Table.Body>
          {itemsData?.data.map((item) => (
            <Table.Row
              key={item.id}
              onClick={() =>
                setExpandedItemId(expandedItemId === item.id ? null : item.id)
              }
            >
              <Table.Cell>{item.id}</Table.Cell>
              <Table.Cell>{item.name}</Table.Cell>
              <Table.Cell>{item.sku}</Table.Cell>
              <Table.Cell>{item.variants?.length || 0}</Table.Cell>
              <Table.Cell>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setItemFormData({ name: item.name, sku: item.sku });
                    setEditingItemId(item.id);
                  }}
                  className="mr-4 text-blue-600 hover:underline"
                >
                  Edit
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteItemMutation.mutate(item.id);
                    // If expanded item was deleted, reset expanded
                    if (expandedItemId === item.id) setExpandedItemId(null);
                  }}
                  className="text-red-600 hover:underline"
                  disabled={deleteItemMutation.isLoading}
                >
                  Delete
                </button>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>

      {/* Stock Variants Section */}
      {expandedItemId && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-2">
            Variants for Stock Item
          </h3>

          {/* Variant Form */}
          <form
            onSubmit={handleVariantSubmit}
            className="mb-4 flex flex-wrap gap-4 items-center"
          >
            <input
              type="text"
              placeholder="Variant SKU"
              value={variantFormData.sku}
              onChange={(e) =>
                setVariantFormData({ ...variantFormData, sku: e.target.value })
              }
              required
              className="border border-gray-400 rounded px-3 py-2 flex-grow"
            />
            <input
              type="text"
              placeholder="Variant Name"
              value={variantFormData.name}
              onChange={(e) =>
                setVariantFormData({ ...variantFormData, name: e.target.value })
              }
              required
              className="border border-gray-400 rounded px-3 py-2 flex-grow"
            />
            <input
              type="text"
              placeholder="Color"
              value={variantFormData.color || ""}
              onChange={(e) =>
                setVariantFormData({
                  ...variantFormData,
                  color: e.target.value,
                })
              }
              className="border border-gray-400 rounded px-3 py-2"
            />
            <input
              type="text"
              placeholder="Size"
              value={variantFormData.size || ""}
              onChange={(e) =>
                setVariantFormData({ ...variantFormData, size: e.target.value })
              }
              className="border border-gray-400 rounded px-3 py-2"
            />
            <input
              type="number"
              placeholder="Current Stock"
              value={variantFormData.currentStock}
              min={0}
              onChange={(e) =>
                setVariantFormData({
                  ...variantFormData,
                  currentStock: Number(e.target.value),
                })
              }
              className="border border-gray-400 rounded px-3 py-2 w-24"
            />
            <input
              type="number"
              placeholder="Min Stock Level"
              value={variantFormData.minStockLevel}
              min={0}
              onChange={(e) =>
                setVariantFormData({
                  ...variantFormData,
                  minStockLevel: Number(e.target.value),
                })
              }
              className="border border-gray-400 rounded px-3 py-2 w-24"
            />
            <input
              type="number"
              placeholder="Max Stock Level"
              value={variantFormData.maxStockLevel || ""}
              min={0}
              onChange={(e) =>
                setVariantFormData({
                  ...variantFormData,
                  maxStockLevel: e.target.value ? Number(e.target.value) : null,
                })
              }
              className="border border-gray-400 rounded px-3 py-2 w-24"
            />
            <button
              type="submit"
              disabled={
                createVariantMutation.isLoading ||
                updateVariantMutation.isLoading
              }
              className="bg-green-600 text-white px-4 py-2 rounded"
            >
              {editingVariantId ? "Update" : "Add"} Variant
            </button>
            {editingVariantId && (
              <button
                type="button"
                onClick={() => {
                  resetVariantForm();
                  setEditingVariantId(null);
                }}
                className="ml-2 px-4 py-2 border rounded"
              >
                Cancel
              </button>
            )}
          </form>

          {/* Variants Table */}
          <Table>
            <Table.Head>
              <Table.HeaderCell>SKU</Table.HeaderCell>
              <Table.HeaderCell>Name</Table.HeaderCell>
              <Table.HeaderCell>Color</Table.HeaderCell>
              <Table.HeaderCell>Size</Table.HeaderCell>
              <Table.HeaderCell>Current Stock</Table.HeaderCell>
              <Table.HeaderCell>Min Stock</Table.HeaderCell>
              <Table.HeaderCell>Max Stock</Table.HeaderCell>
              <Table.HeaderCell>Actions</Table.HeaderCell>
            </Table.Head>
            <Table.Body>
              {itemsData?.data
                .find((i) => i.id === expandedItemId)
                ?.variants.map((variant) => (
                  <Table.Row key={variant.id}>
                    <Table.Cell>{variant.sku}</Table.Cell>
                    <Table.Cell>{variant.name}</Table.Cell>
                    <Table.Cell>{variant.color || "-"}</Table.Cell>
                    <Table.Cell>{variant.size || "-"}</Table.Cell>
                    <Table.Cell>{variant.currentStock}</Table.Cell>
                    <Table.Cell>{variant.minStockLevel}</Table.Cell>
                    <Table.Cell>{variant.maxStockLevel ?? "-"}</Table.Cell>
                    <Table.Cell>
                      <button
                        onClick={() => {
                          setVariantFormData({
                            stockItemId: expandedItemId,
                            sku: variant.sku,
                            name: variant.name,
                            color: variant.color || "",
                            size: variant.size || "",
                            currentStock: variant.currentStock,
                            minStockLevel: variant.minStockLevel,
                            maxStockLevel: variant.maxStockLevel,
                          });
                          setEditingVariantId(variant.id);
                        }}
                        className="mr-4 text-blue-600 hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteVariantMutation.mutate(variant.id)}
                        className="text-red-600 hover:underline"
                        disabled={deleteVariantMutation.isLoading}
                      >
                        Delete
                      </button>
                    </Table.Cell>
                  </Table.Row>
                ))}
              {!itemsData?.data.find((i) => i.id === expandedItemId)?.variants
                .length && (
                <Table.Row>
                  <Table.Cell
                    colSpan={8}
                    className="text-center p-4 text-gray-500"
                  >
                    No variants found for this stock item.
                  </Table.Cell>
                </Table.Row>
              )}
            </Table.Body>
          </Table>
        </div>
      )}
    </div>
  );
};

export default StockItemsList;
