import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getStockItems,
  createStockItem,
  updateStockItem,
  deleteStockItem,
  createStockVariant,
  updateStockVariant,
  deleteStockVariant,
  getStores,
} from "../api/agentsApi";
import {
  listProductTypesByStore,
  listVariantTitlesByProductType,
} from "../api/adminsApi";
import Table from "./Table";

const StockItemsList = ({ onClose }) => {
  const queryClient = useQueryClient();

  // Stock item form
  const [itemFormData, setItemFormData] = useState({ name: "", sku: "" });
  const [editingItemId, setEditingItemId] = useState(null);

  // Expanded stock item for variants
  const [expandedItemId, setExpandedItemId] = useState(null);

  // Variant form
  const [variantFormData, setVariantFormData] = useState({
    stockItemId: "",
    sku: "",
    name: "",
    color: "",
    size: "",
    storeIds: [],
    productTypes: [],
    variantTitles: [],
    currentStock: 0,
    minStockLevel: 5,
    maxStockLevel: null,
  });

  const [editingVariantId, setEditingVariantId] = useState(null);

  // UI selections for a single mapping
  const [selectedStore, setSelectedStore] = useState("");
  const [selectedProductType, setSelectedProductType] = useState("");
  const [selectedVariantTitle, setSelectedVariantTitle] = useState("");

  // Staged mappings: [{ storeId, productType, variantTitle }]
  const [mappings, setMappings] = useState([]);

  // Stores
  const { data: storesRes = [], isLoading: storesLoading } = useQuery({
    queryKey: ["stores"],
    queryFn: getStores,
    select: (res) => res.data,
  });

  // Product types for selected store
  const [productTypes, setProductTypes] = useState([]);

  useEffect(() => {
    const fetchTypes = async () => {
      if (!selectedStore) return;
      try {
        const types = await listProductTypesByStore(selectedStore);
        setProductTypes(types);
      } catch (err) {
        console.error("Failed to fetch product types:", err);
      }
    };
    fetchTypes();
  }, [selectedStore]);

  // Variant titles for selected store + product type
  const { data: variantTitles = [], isLoading: variantTitlesLoading } =
    useQuery({
      queryKey: ["variantTitles", selectedStore, selectedProductType],
      queryFn: () =>
        listVariantTitlesByProductType(selectedStore, selectedProductType),
      enabled: !!selectedStore && !!selectedProductType,
      select: (data) => data?.variantTitles || [],
    });

  // Sync mappings → arrays on variantFormData
  useEffect(() => {
    setVariantFormData((prev) => ({
      ...prev,
      storeIds: mappings.map((m) => m.storeId),
      productTypes: mappings.map((m) => m.productType),
      variantTitles: mappings.map((m) => m.variantTitle),
    }));
  }, [mappings]);

  // Stock items query
  const {
    data: itemsData,
    isLoading: itemsLoading,
    isError: itemsError,
  } = useQuery({
    queryKey: ["stockItems"],
    queryFn: getStockItems,
  });

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

  // Reset variant form and mappings
  const resetVariantForm = () => {
    setVariantFormData({
      stockItemId: expandedItemId,
      sku: "",
      name: "",
      color: "",
      size: "",
      storeIds: [],
      productTypes: [],
      variantTitles: [],
      currentStock: 0,
      minStockLevel: 5,
      maxStockLevel: null,
    });
    setMappings([]);
    setSelectedStore("");
    setSelectedProductType("");
    setSelectedVariantTitle("");
  };

  // Keep stockItemId in variant form
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

  // Add a mapping triple
  const handleAddMapping = () => {
    if (!selectedStore || !selectedProductType || !selectedVariantTitle) return;

    setMappings((prev) => {
      const next = [
        ...prev,
        {
          storeId: selectedStore,
          productType: selectedProductType,
          variantTitle: selectedVariantTitle,
        },
      ];

      // Deduplicate by triple
      const deduped = Array.from(
        new Map(
          next.map((m) => [
            `${m.storeId}||${m.productType}||${m.variantTitle}`,
            m,
          ])
        ).values()
      );

      return deduped;
    });

    // Keep store & productType to add more titles, reset only title
    setSelectedVariantTitle("");
  };

  if (itemsLoading) return <div>Loading stock items...</div>;
  if (itemsError) return <div>Error loading stock items.</div>;

  const expandedItem = itemsData?.data.find((i) => i.id === expandedItemId);

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
                setVariantFormData({
                  ...variantFormData,
                  size: e.target.value,
                })
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

            {/* Store select */}
            <select
              value={selectedStore}
              onChange={(e) => {
                const value = e.target.value;
                setSelectedStore(value);
                setSelectedProductType("");
                setSelectedVariantTitle("");
              }}
              className="border border-gray-400 rounded px-3 py-2"
              disabled={storesLoading}
            >
              <option value="">Select store</option>
              {storesRes.map((store) => (
                <option key={store.id} value={store.name}>
                  {store.name}
                </option>
              ))}
            </select>

            {/* Product type select */}
            <select
              value={selectedProductType}
              onChange={(e) => {
                const value = e.target.value;
                setSelectedProductType(value);
                setSelectedVariantTitle("");
              }}
              disabled={!selectedStore || !productTypes.length}
              className="border border-gray-400 rounded px-3 py-2"
            >
              <option value="">Select product type</option>
              {productTypes.map((pt) => (
                <option key={pt} value={pt}>
                  {pt}
                </option>
              ))}
            </select>

            {/* Variant title select */}
            <select
              value={selectedVariantTitle}
              onChange={(e) => {
                const value = e.target.value;
                setSelectedVariantTitle(value);
              }}
              disabled={!selectedProductType || variantTitlesLoading}
              className="border border-gray-400 rounded px-3 py-2 min-w-[200px]"
            >
              <option value="">Select variant title</option>
              {variantTitles.map((vt, idx) => (
                <option key={idx} value={vt}>
                  {vt}
                </option>
              ))}
            </select>

            {/* Add mapping button */}
            <button
              type="button"
              onClick={handleAddMapping}
              className="px-3 py-2 border rounded"
            >
              Add mapping
            </button>

            {/* Submit / cancel */}
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

          {/* Show staged mappings */}
          <div className="w-full flex flex-wrap gap-2 mb-4">
            {mappings.map((m, idx) => (
              <span
                key={`${m.storeId}-${m.productType}-${m.variantTitle}-${idx}`}
                className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-sm"
              >
                {m.storeId} / {m.productType} / {m.variantTitle}
                <button
                  type="button"
                  onClick={() =>
                    setMappings((prev) => prev.filter((_, i) => i !== idx))
                  }
                  className="ml-1 text-red-500"
                >
                  ×
                </button>
              </span>
            ))}
          </div>

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
              <Table.HeaderCell>Stores</Table.HeaderCell>
              <Table.HeaderCell>Product Types</Table.HeaderCell>
              <Table.HeaderCell>Variant Titles</Table.HeaderCell>
              <Table.HeaderCell>Actions</Table.HeaderCell>
            </Table.Head>
            <Table.Body>
              {expandedItem?.variants.map((variant) => (
                <Table.Row key={variant.id}>
                  <Table.Cell>{variant.sku}</Table.Cell>
                  <Table.Cell>{variant.name}</Table.Cell>
                  <Table.Cell>{variant.color || "-"}</Table.Cell>
                  <Table.Cell>{variant.size || "-"}</Table.Cell>
                  <Table.Cell>{variant.currentStock}</Table.Cell>
                  <Table.Cell>{variant.minStockLevel}</Table.Cell>
                  <Table.Cell>{variant.maxStockLevel ?? "-"}</Table.Cell>
                  <Table.Cell>{(variant.storeIds || []).join(", ")}</Table.Cell>
                  <Table.Cell>
                    {(variant.productTypes || []).join(", ")}
                  </Table.Cell>
                  <Table.Cell>
                    {(variant.variantTitles || []).join(", ")}
                  </Table.Cell>
                  <Table.Cell>
                    <button
                      onClick={() => {
                        setVariantFormData({
                          stockItemId: expandedItemId,
                          sku: variant.sku,
                          name: variant.name,
                          color: variant.color || "",
                          size: variant.size || "",
                          storeIds: variant.storeIds || [],
                          productTypes: variant.productTypes || [],
                          variantTitles: variant.variantTitles || [],
                          currentStock: variant.currentStock,
                          minStockLevel: variant.minStockLevel,
                          maxStockLevel: variant.maxStockLevel,
                        });

                        const newMappings =
                          (variant.storeIds || []).map((s, i) => ({
                            storeId: s,
                            productType: (variant.productTypes || [])[i] || "",
                            variantTitle:
                              (variant.variantTitles || [])[i] || "",
                          })) || [];

                        setMappings(newMappings);
                        setSelectedStore("");
                        setSelectedProductType("");
                        setSelectedVariantTitle("");
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
              {!expandedItem?.variants?.length && (
                <Table.Row>
                  <Table.Cell
                    colSpan={11}
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
