import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import Table from "./Table";
import Spinner from "./Loading";
import ExportExcel from "./ExportExcel";
import { getBatchRules, updateBatchRules } from "../api/adminsApi";
import {
  listRules,
  downloadBatchFiles,
  updateBatchStatus,
} from "../api/agentsApi";
import { getBatches } from "../api/agentsApi";
import getStatusClasses from "../utils/statusColors";
import { useAuth } from "../context/AuthContext";

const BatchesTable = () => {
  const [page, setPage] = useState(1);
  const [selectedRule, setSelectedRule] = useState("");
  const [selectedStatuses, setSelectedStatuses] = useState([]); // 🆕 Array instead of string
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [search, setSearch] = useState("");
  const [editingBatchId, setEditingBatchId] = useState(null);
  const [localRules, setLocalRules] = useState([]);
  const [maxCapacityInput, setMaxCapacityInput] = useState("");
  const [updatingBatchId, setUpdatingBatchId] = useState(null);
  const { user } = useAuth();

  const limit = 10;
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // -------- Rules (full list, with filters) --------
  const filters = { isPod: true };

  const { data: rulesResp, isLoading: rulesLoading } = useQuery({
    queryKey: ["rules", filters],
    queryFn: () => listRules(filters),
  });

  const rules = rulesResp || [];

  // 🆕 Status options
  const statusOptions = [
    { value: "PENDING", label: "Pending" },
    { value: "WAITING_BATCH ", label: "Waiting Batch" },
    { value: "DESIGNED", label: "Designed" },
    { value: "DESIGNING", label: "Designing" },
    { value: "PRINTING", label: "Printing" },
    { value: "BATCHED", label: "Batched" },
    { value: "COMPLETED", label: "Completed" },
    { value: "PRINTED", label: "Printed" },
  ];

  // 🆕 Build filters object for batches API
  const batchFilters = {
    page,
    limit,
    ruleName: selectedRule || undefined,
    status:
      selectedStatuses.length > 0 ? selectedStatuses.join(",") : undefined, // 🆕 Comma-separated
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    search: search || undefined,
  };

  // -------- Batches list (now with ALL filters!) --------
  const {
    data: batchesResp,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["batches", batchFilters],
    queryFn: () => getBatches(batchFilters),
    keepPreviousData: true,
  });

  // -------- Batch rules when modal is open --------
  const { data: batchRulesResp, isLoading: batchRulesLoading } = useQuery({
    queryKey: ["batchRules", editingBatchId],
    queryFn: () => getBatchRules(editingBatchId),
    enabled: !!editingBatchId,
  });

  const batchRules = batchRulesResp || null;

  // 🆕 Toggle status chip
  const toggleStatus = (statusValue) => {
    setSelectedStatuses((prev) =>
      prev.includes(statusValue)
        ? prev.filter((s) => s !== statusValue)
        : [...prev, statusValue],
    );
  };

  // 🆕 Clear all statuses
  const clearStatuses = () => {
    setSelectedStatuses([]);
  };

  // 🆕 Auto-filter DESIGNED for PRINTER role
  useEffect(() => {
    if (user.role === "PRINTER") {
      setSelectedStatuses(["DESIGNED"]);
    }
  }, [user.role]);

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
        `Error updating rules: ${err.response?.data?.error || err.message}`,
      );
    },
  });

  // 🆕 Status update mutation
  const { mutate: updateStatusMutation, isPending: updatingStatus } =
    useMutation({
      mutationFn: (batchId) => updateBatchStatus(batchId, "PRINTING"),
      onMutate: async (batchId) => {
        setUpdatingBatchId(batchId);
      },
      onSuccess: () => {
        queryClient.invalidateQueries(["batches"]);
        console.log("Batch status updated to PRINTING");
      },
      onError: (err) => {
        console.error("Failed to update batch status:", err);
        alert(
          `Status update failed: ${err.response?.data?.error || err.message}`,
        );
      },
      onSettled: () => {
        setUpdatingBatchId(null);
      },
    });

  // 🆕 Enhanced Batch download handler
  const handleDownloadBatch = async (batchId, batchName) => {
    try {
      // 🆕 PRINTER: Update status to PRINTING before download
      if (user.role === "PRINTER") {
        await updateStatusMutation(batchId);
      }

      // Download files (status already updated for PRINTER)
      await downloadBatchFiles(batchId, batchName);
      console.log(`Downloaded batch ${batchName}`);
    } catch (error) {
      console.error("Batch download failed:", error);
      // Don't revert status on download failure - let admin handle it
    }
  };

  // 🆕 Reset page to 1 when filters change
  const handleFilterChange = () => {
    setPage(1);
  };

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
      prev.map((r) => (r.id === id ? { ...r, selected: !r.selected } : r)),
    );
  };

  const handleSaveRules = () => {
    if (!editingBatchId || localRules.length === 0) return;

    const selectedNow = new Set(
      localRules.filter((r) => r.selected).map((r) => r.id),
    );
    const selectedFromDb = new Set(
      localRules.filter((r) => r.selectedFromDb).map((r) => r.id),
    );

    const ruleIdsToAdd = [...selectedNow].filter(
      (id) => !selectedFromDb.has(id),
    );
    const ruleIdsToRemove = [...selectedFromDb].filter(
      (id) => !selectedNow.has(id),
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
    saveBatchRules({
      batchId: editingBatchId,
      ruleIdsToAdd,
      ruleIdsToRemove,
      maxCapacity: maxCapacityNum,
    });
  };

  return (
    <div className="space-y-4 relative">
      {/* 🆕 FILTERS SECTION */}
      <div className="bg-white p-6 border border-gray-200 rounded-lg shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rule Name
            </label>
            <select
              value={selectedRule}
              onChange={(e) => {
                setSelectedRule(e.target.value);
                handleFilterChange();
              }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Rules</option>
              {rules.map((rule) => (
                <option key={rule.id} value={rule.name}>
                  {rule.name}
                </option>
              ))}
            </select>
          </div>

          {/* 🆕 Multi-select Status Chips */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
              {selectedStatuses.length > 0 && ` (${selectedStatuses.length})`}
            </label>
            <div className="flex flex-wrap gap-2">
              {statusOptions.map((statusOption) => {
                const isActive = selectedStatuses.includes(statusOption.value);
                return (
                  <button
                    key={statusOption.value}
                    onClick={() => toggleStatus(statusOption.value)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border-2 transition-all ${
                      isActive
                        ? "border-blue-500 bg-blue-100 text-blue-800 shadow-md"
                        : "border-gray-200 hover:border-gray-300 bg-gray-50 text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {statusOption.label}
                  </button>
                );
              })}
            </div>
            {selectedStatuses.length > 0 && (
              <button
                onClick={clearStatuses}
                className="mt-2 text-xs text-gray-500 hover:text-gray-700 underline"
              >
                Clear all ({selectedStatuses.length})
              </button>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                handleFilterChange();
              }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                handleFilterChange();
              }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search (Name or Rule)
          </label>
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              handleFilterChange();
            }}
            placeholder="Search batches..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Rest of component remains exactly the same */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">
          Batches {user.role === "PRINTER" && "(DESIGNED only)"}
        </h2>
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
          {batches.map((batch) => {
            const fileCount = batch.fileCount || 0;
            const showDownload = fileCount > 0;
            const isUpdatingThisBatch = updatingBatchId === batch.id;

            return (
              <Table.Row
                key={batch.id}
                className="cursor-pointer hover:bg-gray-50 transition"
                onClick={(e) => {
                  const target = e.target;
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
                      batch.status,
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
                  <div className="flex items-center gap-2 flex-wrap">
                    {user.role === "ADMIN" && (
                      <button
                        className="px-3 py-1 text-xs rounded border border-gray-300 hover:bg-gray-50"
                        onClick={() => openEditRules(batch.id)}
                      >
                        Edit rules
                      </button>
                    )}

                    {user.role === "DESIGNER" && (
                      <ExportExcel
                        batch={batch}
                        disabled={batch.capacity < batch.maxCapacity}
                      />
                    )}

                    {showDownload && (
                      <button
                        className="px-6 py-1 text-md bg-green-600 hover:bg-green-700 text-white rounded font-medium flex items-center gap-1 shadow-sm transition-all whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() =>
                          handleDownloadBatch(batch.id, batch.name)
                        }
                        disabled={isUpdatingThisBatch}
                        title={`Download ${fileCount} files as ZIP${user.role === "PRINTER" ? " (will set to PRINTING)" : ""}`}
                      >
                        {isUpdatingThisBatch ? (
                          <>
                            <Spinner size="sm" /> Updating...
                          </>
                        ) : (
                          "Download All"
                        )}
                      </button>
                    )}
                  </div>
                </Table.Cell>
              </Table.Row>
            );
          })}
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

      {/* Modal for editing rules - unchanged */}
      {editingBatchId && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold">
                Edit rules for {batchRules?.batch?.name || "Batch"}
              </h3>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto max-h-96">
              {batchRulesLoading ? (
                <Spinner />
              ) : (
                <>
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600">
                      Edit the max capacity and select the rules that should
                      apply to this batch.
                    </p>

                    <div className="flex items-center gap-3">
                      <label className="text-sm font-medium text-gray-700">
                        Max capacity
                      </label>
                      <input
                        type="number"
                        min={1}
                        className="border border-gray-300 rounded px-2 py-1 text-sm w-28 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={maxCapacityInput}
                        onChange={(e) => setMaxCapacityInput(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="border rounded-lg p-3 max-h-48 overflow-y-auto">
                    {localRules.map((rule) => (
                      <label
                        key={rule.id}
                        className="flex items-center gap-2 text-sm p-2 hover:bg-gray-50 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded focus:ring-2 focus:ring-blue-500"
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
                </>
              )}
            </div>

            <div className="border-t p-4 flex justify-end gap-2 bg-gray-50">
              <button
                className="px-4 py-2 text-sm rounded border border-gray-300 hover:bg-gray-50 transition-colors"
                onClick={closeEditRules}
                disabled={savingRules}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 text-sm rounded bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={savingRules}
                onClick={handleSaveRules}
              >
                {savingRules ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchesTable;
