import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createBatch, listRules } from "../api/adminsApi";

const CreateBatch = ({ onClose }) => {
  const [selectedRules, setSelectedRules] = useState([]);
  const [batchName, setBatchName] = useState("");
  const [maxCapacity, setMaxCapacity] = useState("");

  const queryClient = useQueryClient();

  // 🎯 Fetch all product type rules (global — across all stores)
  const { data: rules = [], isLoading } = useQuery({
    queryKey: ["rules"],
    queryFn: listRules,
  });

  // 🚀 Create batch mutation
  const mutation = useMutation({
    mutationFn: createBatch,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["batches"] });
      if (onClose) onClose();
    },
    onError: (err) => {
      console.error("Error creating batch:", err);
      alert(err?.response?.data?.error || "Failed to create batch");
    },
  });

  // 📤 Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!maxCapacity) return alert("Please enter max capacity");
    if (selectedRules.length === 0)
      return alert("Select at least one rule to include");

    mutation.mutate({
      batchName: batchName.trim(),
      maxCapacity: parseInt(maxCapacity),
      ruleIds: selectedRules, // ✅ send IDs, not names
    });
  };

  // 🧩 Handle multiple rule selection
  const handleRuleSelect = (e) => {
    const selected = Array.from(e.target.selectedOptions, (opt) => opt.value);
    setSelectedRules(selected);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 w-96 bg-white p-6 rounded-xl shadow"
    >
      <h2 className="text-xl font-semibold">Create Global Batch</h2>

      {/* Batch name */}
      <div>
        <label className="block text-sm font-medium mb-1">Batch Name</label>
        <input
          type="text"
          value={batchName}
          onChange={(e) => setBatchName(e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-2"
          placeholder="Enter batch name (optional)"
        />
      </div>

      {/* Max capacity */}
      <div>
        <label className="block text-sm font-medium mb-1">Max Capacity</label>
        <input
          type="number"
          value={maxCapacity}
          onChange={(e) => setMaxCapacity(e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-2"
          placeholder="Enter max items per batch"
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
                <span className="text-sm">
                  {rule.name} —{" "}
                  <span className="text-gray-500">
                    {rule.isPod ? "POD" : "Stock"}
                  </span>
                </span>
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
          {mutation.isLoading ? "Creating..." : "Create Batch"}
        </button>
      </div>
    </form>
  );
};

export default CreateBatch;
