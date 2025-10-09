import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createRule, listProductTypesByStore } from "../api/adminsApi";
import { getStores } from "../api/agentsApi";

const CreateRule = ({ onClose }) => {
  const [selectedStore, setSelectedStore] = useState("");
  const [productTypes, setProductTypes] = useState([]);
  const [selectedProductType, setSelectedProductType] = useState("");
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

  const mutation = useMutation({
    mutationFn: createRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rules", selectedStore] });
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
            setSelectedProductType("");
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
