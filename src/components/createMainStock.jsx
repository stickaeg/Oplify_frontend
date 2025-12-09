import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createMainStock, listRules } from "../api/adminsApi";

const CreateMainStock = ({ onClose }) => {
  const [mainStockName, setMainStockName] = useState("");
  const [selectedRules, setSelectedRules] = useState([]);

  const queryClient = useQueryClient();

  // 🔍 Fetch all rules dynamically (you can adjust filters if needed)
  const filters = { isPod: false, requiresStock: false }; // can be dynamic
  const { data: rules = [], isLoading } = useQuery({
    queryKey: ["rules", filters], // cache separately per filter combination
    queryFn: () => listRules(filters),
  });
  // 📤 Mutation to create main stock
  const mutation = useMutation({
    mutationFn: createMainStock,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mainStock"] });
      if (onClose) onClose();
    },
    onError: (err) => {
      console.error("Error creating main stock:", err);
      alert(err?.response?.data?.error || "Failed to create main stock");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!mainStockName.trim())
      return alert("Please enter a name for the main stock");
    if (selectedRules.length === 0)
      return alert("Select at least one rule to include");

    mutation.mutate({
      name: mainStockName.trim(),

      ruleIds: selectedRules, // send array of rule IDs
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 w-96 bg-white p-6 rounded-xl shadow"
    >
      <h2 className="text-xl font-semibold">Create Main Stock</h2>

      {/* Main stock name */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Main Stock Name
        </label>
        <input
          type="text"
          value={mainStockName}
          onChange={(e) => setMainStockName(e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-2"
          placeholder="Enter main stock name"
          required
        />
      </div>

      {/* Rules multi-select */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Select Product Type Rules
        </label>

        {isLoading ? (
          <p className="text-gray-500 text-sm">Loading rules...</p>
        ) : (
          <div className="border border-gray-300 rounded p-3 max-h-48 overflow-y-auto space-y-2">
            {rules.map((rule) => (
              <label
                key={rule.id}
                className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded"
              >
                <input
                  type="checkbox"
                  value={rule.id}
                  checked={selectedRules.includes(rule.id)}
                  onChange={(e) => {
                    const { value, checked } = e.target;
                    setSelectedRules((prev) =>
                      checked
                        ? [...prev, value]
                        : prev.filter((id) => id !== value)
                    );
                  }}
                />
                <div className="text-sm">
                  <span className="font-medium">{rule.name}</span>{" "}
                  <span className="text-gray-500">
                    ({rule.isPod ? "POD" : "Stock"})
                  </span>
                  {rule.variantTitle && (
                    <div className="text-xs text-gray-400">
                      Variant: {rule.variantTitle}
                    </div>
                  )}
                  <div className="text-xs text-gray-400">
                    Store: {rule.store?.name || "Unknown"}
                  </div>
                </div>
              </label>
            ))}
          </div>
        )}
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
          {mutation.isLoading ? "Creating..." : "Create Main Stock"}
        </button>
      </div>
    </form>
  );
};

export default CreateMainStock;
