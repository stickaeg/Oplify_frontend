import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createRule,
  listProductTypesByStore,
  listVariantTitlesByProductType,
} from "../api/adminsApi";
import { getStores } from "../api/agentsApi";

const CreateRule = ({ onClose }) => {
  const [selectedStore, setSelectedStore] = useState("");
  const [productTypes, setProductTypes] = useState([]);
  const [selectedProductType, setSelectedProductType] = useState("");
  const [selectedVariantTitle, setSelectedVariantTitle] = useState("");
  const [requiresStock, setRequiresStock] = useState(false);

  const [isPod, setIsPod] = useState(true);

  const queryClient = useQueryClient();

  // 🏪 Fetch all stores
  const { data: stores = [], isLoading: storesLoading } = useQuery({
    queryKey: ["stores"],
    queryFn: getStores,
  });

  // 🎯 Fetch product types when a store is selected
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

  useEffect(() => {
    setSelectedVariantTitle("");
  }, [selectedProductType]);

  const { data: variantsData, isLoading: variantsLoading } = useQuery({
    queryKey: ["variantTitles", selectedStore, selectedProductType],
    queryFn: () =>
      listVariantTitlesByProductType(selectedStore, selectedProductType),
    enabled: !!selectedStore && !!selectedProductType,
    select: (data) => data?.variantTitles || [],
  });

  const variantTitles = variantsData || []; // ✅ Use query data directly

  const mutation = useMutation({
    mutationFn: createRule,
    onSuccess: () => {
      queryClient.invalidateQueries(["rules"]);
      if (onClose) onClose();
    },
    onError: (err) => {
      console.error("Error creating rule:", err);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedStore) return alert("Please select a store");
    if (!selectedProductType)
      return alert("Please select a product type for this rule");

    mutation.mutate({
      name: selectedProductType, // use product type as rule name
      isPod,
      requiresStock, // 👈 send boolean
      variantTitle: selectedVariantTitle || null,
      storeName: selectedStore,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-80">
      <h2 className="text-xl font-semibold">Create Store Rule</h2>

      {/* Store selector */}
      <div>
        <label className="block text-sm font-medium mb-1">Select Store</label>
        <select
          value={selectedStore}
          onChange={(e) => {
            setSelectedStore(e.target.value);
            setProductTypes([]);
            setSelectedProductType(""); // 👈 Reset variants
          }}
          className="w-full border border-gray-300 rounded px-3 py-2"
          disabled={storesLoading}
        >
          <option value="">-- Select a store --</option>
          {stores?.data?.map((store) => (
            <option key={store.id} value={store.name}>
              {store.name}
            </option>
          ))}
        </select>
      </div>

      {/* Product Type Dropdown */}
      {selectedStore && (
        <div>
          <label className="block text-sm font-medium mb-1">
            Select Product Type
          </label>
          <select
            value={selectedProductType}
            onChange={(e) => setSelectedProductType(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2"
            disabled={!productTypes.length}
          >
            <option value="">-- Select a product type --</option>
            {productTypes.map((type, idx) => (
              <option key={idx} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
      )}

      {selectedProductType && variantsLoading && (
        <div className="text-sm text-gray-500">Loading variant titles...</div>
      )}

      {selectedProductType && variantTitles.length > 0 && (
        <div>
          <label className="block text-sm font-medium mb-1">
            Select Variant Title ({variantTitles.length} unique)
          </label>
          <select
            value={selectedVariantTitle || ""}
            onChange={(e) => setSelectedVariantTitle(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2"
          >
            <option value="">
              -- All variants for {selectedProductType} --
            </option>
            {variantTitles.map((title, idx) => (
              <option key={idx} value={title}>
                {title}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Batch names: "{selectedProductType} -{" "}
            {selectedVariantTitle || "All Variants"}"
          </p>
        </div>
      )}

      {/* Type (POD / Stock) */}
      <div>
        <p className="text-sm font-medium mb-1">Rule Type</p>
        <div className="flex gap-4">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="type"
              value="pod"
              checked={isPod}
              onChange={() => setIsPod(true)}
            />
            POD
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="type"
              value="stock"
              checked={!isPod}
              onChange={() => setIsPod(false)}
            />
            Stock
          </label>
        </div>
      </div>
      {/* Requires stock */}
      <div>
        <p className="text-sm font-medium mb-1">Requires Stock</p>
        <div className="flex gap-4">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="requiresStock"
              value="yes"
              checked={requiresStock === true}
              onChange={() => setRequiresStock(true)}
            />
            Yes
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="requiresStock"
              value="no"
              checked={requiresStock === false}
              onChange={() => setRequiresStock(false)}
            />
            No
          </label>
        </div>
      </div>
      
      {/* Buttons */}
      <div className="flex justify-end gap-2 mt-4">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
          disabled={mutation.isLoading}
        >
          {mutation.isLoading ? "Creating..." : "Create"}
        </button>
      </div>
    </form>
  );
};

export default CreateRule;
