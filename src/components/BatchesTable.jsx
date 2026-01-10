import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import Table from "./Table";
import Spinner from "./Loading";
import ExportExcel from "./ExportExcel";
import { getBatchRules, listRules, updateBatchRules } from "../api/adminsApi";
import { getBatches, updateBatchStatus } from "../api/agentsApi";
import getStatusClasses from "../utils/statusColors";

const BatchesTable = () => {
  const [page, setPage] = useState(1);
  const [selectedRule, setSelectedRule] = useState("");
  const [editingBatchId, setEditingBatchId] = useState(null);
  const [localRules, setLocalRules] = useState([]);
  const [maxCapacityInput, setMaxCapacityInput] = useState("");

  const limit = 10;
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // -------- Rules (full list, with filters) --------
  const filters = { isPod: true };

  const { data: rulesResp, isLoading: rulesLoading } = useQuery({
    queryKey: ["rules", filters],
    queryFn: () => listRules(filters),
  });

  const rules = rulesResp || []; // body from Axios response

  // -------- Batches list --------
  const {
    data: batchesResp,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["batches", page, limit, selectedRule],
    queryFn: () => getBatches({ page, limit, ruleName: selectedRule }),
    keepPreviousData: true,
  });

  // -------- Batch rules when modal is open --------
  const { data: batchRulesResp, isLoading: batchRulesLoading } = useQuery({
    queryKey: ["batchRules", editingBatchId],
    queryFn: () => getBatchRules(editingBatchId),
    enabled: !!editingBatchId,
  });

  const batchRules = batchRulesResp || null;

  useEffect(() => {
    if (!editingBatchId) return;
    if (!rules || !batchRules) return;
    if (localRules.length > 0) return; // already initialized

    const selectedIds = new Set((batchRules.rules || []).map((r) => r.id));

    const prepared = (rules || []).map((r) => ({
      id: r.id,
      name: r.name,
      storeId: r.storeId,
      variantTitle: r.variantTitle,
      isPod: r.isPod,
      requiresStock: r.requiresStock,
      selected: selectedIds.has(r.id),
      selectedFromDb: selectedIds.has(r.id),
    }));

    setLocalRules(prepared);

    // seed max capacity from backend
    if (batchRules.batch?.maxCapacity != null) {
      setMaxCapacityInput(String(batchRules.batch.maxCapacity));
    } else {
      setMaxCapacityInput("");
    }
  }, [editingBatchId, rules, batchRules, localRules.length]);

  const { mutate: saveBatchRules, isLoading: savingRules } = useMutation({
    mutationFn: ({ batchId, ruleIdsToAdd, ruleIdsToRemove, maxCapacity }) =>
      updateBatchRules(batchId, { ruleIdsToAdd, ruleIdsToRemove, maxCapacity }),
    onSuccess: () => {
      queryClient.invalidateQueries(["batches"]);
      queryClient.invalidateQueries(["batchRules", editingBatchId]);
      setEditingBatchId(null);
      setLocalRules([]);
      setMaxCapacityInput("");
    },
    onError: (err) => {
      console.error("Failed to update batch rules:", err);
      alert(
        `Error updating rules: ${err.response?.data?.error || err.message}`
      );
    },
  });

  if (isLoading || rulesLoading) return <Spinner />;
  if (isError || !batchesResp) return <p>Failed to load batches</p>;

  const { data: batches, page: currentPage, pages } = batchesResp;

  const openEditRules = (batchId) => {
    setEditingBatchId(batchId);
    setLocalRules([]);
    setMaxCapacityInput("");
  };

  const closeEditRules = () => {
    setEditingBatchId(null);
    setLocalRules([]);
    setMaxCapacityInput("");
  };

  const toggleRule = (id) => {
    setLocalRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, selected: !r.selected } : r))
    );
  };

  const handleSaveRules = () => {
    if (!editingBatchId || localRules.length === 0) return;

    const selectedNow = new Set(
      localRules.filter((r) => r.selected).map((r) => r.id)
    );
    const selectedFromDb = new Set(
      localRules.filter((r) => r.selectedFromDb).map((r) => r.id)
    );

    const ruleIdsToAdd = [...selectedNow].filter(
      (id) => !selectedFromDb.has(id)
    );
    const ruleIdsToRemove = [...selectedFromDb].filter(
      (id) => !selectedNow.has(id)
    );

    const maxCapacityNum = maxCapacityInput
      ? Number.parseInt(maxCapacityInput, 10)
      : undefined;

    if (
      Number.isNaN(maxCapacityNum) ||
      (typeof maxCapacityNum !== "undefined" && maxCapacityNum <= 0)
    ) {
      alert("Max capacity must be a positive integer");
      return;
    }

    // if nothing changed at all, just close
    const noRuleChanges =
      ruleIdsToAdd.length === 0 && ruleIdsToRemove.length === 0;
    const originalMax = batchRules?.batch?.maxCapacity;
    const noCapacityChange =
      typeof maxCapacityNum === "undefined" ||
      (typeof originalMax === "number" && originalMax === maxCapacityNum);

    if (noRuleChanges && noCapacityChange) {
      closeEditRules();
      return;
    }

    console.log("Saving rules + maxCapacity:", {
      batchId: editingBatchId,
      ruleIdsToAdd,
      ruleIdsToRemove,
      maxCapacity: maxCapacityNum,
    });

    saveBatchRules({
      batchId: editingBatchId,
      ruleIdsToAdd,
      ruleIdsToRemove,
      maxCapacity: maxCapacityNum,
    });
  };

  return (
    <div className="space-y-4 relative">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Batches</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Filter by Rule
          </label>
          <select
            value={selectedRule}
            onChange={(e) => {
              setSelectedRule(e.target.value);
              setPage(1);
            }}
            disabled={rulesLoading}
            className="border border-gray-300 rounded-lg px-3 py-2 w-48 text-gray-700 focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            <option value="">All Rules</option>
            {rules.map((rule) => (
              <option key={rule.id} value={rule.name}>
                {rule.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Table>
        <Table.Head>
          <Table.HeaderCell>Name</Table.HeaderCell>
          <Table.HeaderCell>Capacity</Table.HeaderCell>
          <Table.HeaderCell>Status</Table.HeaderCell>
          <Table.HeaderCell>Created At</Table.HeaderCell>
          <Table.HeaderCell>Actions</Table.HeaderCell>
        </Table.Head>

        <Table.Body>
          {batches.map((batch) => (
            <Table.Row
              key={batch.id}
              className="cursor-pointer hover:bg-gray-50 transition"
              onClick={(e) => {
                const target = e.target;

                // Ignore clicks from actions cell or any button
                if (
                  target.closest(".batch-actions-cell") ||
                  target.closest("button")
                ) {
                  return;
                }

                navigate(`/batches/${batch.id}`);
              }}
            >
              <Table.Cell className="cursor-pointer">{batch.name}</Table.Cell>

              <Table.Cell>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-4 bg-gray-200 rounded overflow-hidden">
                    <div
                      className={`h-full ${
                        batch.capacity / batch.maxCapacity > 0.8
                          ? "bg-red-500"
                          : "bg-green-500"
                      }`}
                      style={{
                        width: `${(batch.capacity / batch.maxCapacity) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    {batch.capacity} / {batch.maxCapacity}
                  </span>
                </div>
              </Table.Cell>

              <Table.Cell>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusClasses(
                    batch.status
                  )}`}
                >
                  {batch.status.replaceAll("_", " ")}
                </span>
              </Table.Cell>

              <Table.Cell>
                {new Date(batch.createdAt).toLocaleString()}
              </Table.Cell>

              <Table.Cell
                className="batch-actions-cell"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-2">
                  <button
                    className="px-3 py-1 text-xs rounded border border-gray-300 hover:bg-gray-50"
                    onClick={() => openEditRules(batch.id)}
                  >
                    Edit rules
                  </button>

                  <ExportExcel
                    batch={batch}
                    disabled={batch.capacity < batch.maxCapacity}
                  />
                </div>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>

      <div className="flex items-center justify-center gap-4">
        <button
          className="px-4 py-2 bg-white border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={currentPage === 1}
          onClick={() => setPage((p) => p - 1)}
        >
          ← Previous
        </button>
        <span className="text-sm font-medium text-gray-700">
          Page <span className="font-semibold">{currentPage}</span> of{" "}
          <span className="font-semibold">{pages}</span>
        </span>
        <button
          className="px-4 py-2 bg-white border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={currentPage === pages}
          onClick={() => setPage((p) => p + 1)}
        >
          Next →
        </button>
      </div>

      {/* Modal for editing rules */}
      {editingBatchId && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6 space-y-4">
            <h3 className="text-lg font-semibold">
              Edit rules for {batchRules?.batch?.name || "Batch"}
            </h3>
            
            {batchRulesLoading ? (
              <Spinner />
            ) : (
              <>
                <div className="space-y-3 mb-3">
                  <p className="text-sm text-gray-600">
                    Edit the max capacity and select the rules that should apply
                    to this batch.
                  </p>

                  <div className="flex items-center gap-3">
                    <label className="text-sm font-medium text-gray-700">
                      Max capacity
                    </label>
                    <input
                      type="number"
                      min={1}
                      className="border border-gray-300 rounded px-2 py-1 text-sm w-28"
                      value={maxCapacityInput}
                      onChange={(e) => setMaxCapacityInput(e.target.value)}
                    />
                  </div>
                </div>

                <div className="max-h-64 overflow-y-auto border rounded p-3 space-y-2">
                  {localRules.map((rule) => (
                    <label
                      key={rule.id}
                      className="flex items-center gap-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        className="h-4 w-4"
                        checked={rule.selected}
                        onChange={() => toggleRule(rule.id)}
                      />
                      <span>
                        {rule.name}
                        {rule.variantTitle ? ` – ${rule.variantTitle}` : ""}
                      </span>
                    </label>
                  ))}
                </div>

                <div className="flex justify-end gap-2 mt-4">
                  <button
                    className="px-4 py-2 text-sm rounded border border-gray-300 hover:bg-gray-50"
                    onClick={closeEditRules}
                    disabled={savingRules}
                  >
                    Cancel
                  </button>
                  <button
                    className="px-4 py-2 text-sm rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                    disabled={savingRules}
                    onClick={handleSaveRules}
                  >
                    {savingRules ? "Saving..." : "Save"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchesTable;
