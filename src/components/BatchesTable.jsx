import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import Table from "./Table";
import Spinner from "./Loading";
import ExportExcel from "./ExportExcel";
import { getBatches, getRules, updateBatchStatus } from "../api/agentsApi";
import getStatusClasses from "../utils/statusColors"; // ✅ shared color logic

const BatchesTable = () => {
  const [page, setPage] = useState(1);
  const [selectedRule, setSelectedRule] = useState("");
  const limit = 10;
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: rulesData, isLoading: rulesLoading } = useQuery({
    queryKey: ["rules"],
    queryFn: getRules,
  });

  const rules = rulesData?.data || [];

  const { data, isLoading, isError } = useQuery({
    queryKey: ["batches", page, limit, selectedRule],
    queryFn: () => getBatches({ page, limit, ruleName: selectedRule }),
    keepPreviousData: true,
  });

  const { mutate: changeStatus } = useMutation({
    mutationFn: ({ batchId, status }) => updateBatchStatus(batchId, status),
    onSuccess: () => queryClient.invalidateQueries(["batches"]),
    onError: (err) => {
      console.error("Failed to update batch status:", err);
      alert(
        `Error updating status: ${err.response?.data?.message || err.message}`
      );
    },
  });

  if (isLoading || rulesLoading) return <Spinner />;
  if (isError) return <p>Failed to load batches</p>;

  const { data: batches, page: currentPage, pages } = data;

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
              onClick={() => navigate(`/batches/${batch.id}`)}
            >
              <Table.Cell>{batch.name}</Table.Cell>

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

              <Table.Cell onClick={(e) => e.stopPropagation()}>
                <ExportExcel
                  batch={batch}
                  disabled={batch.capacity < batch.maxCapacity}
                />
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
    </div>
  );
};

export default BatchesTable;
