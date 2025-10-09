import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom"; // 👈 import navigate
import Table from "./Table";
import { getBatches, updateBatchStatus } from "../api/agentsApi";
import Spinner from "./Loading";
import ExportExcel from "./ExportExcel";
import { useAuth } from "../context/AuthContext";

const BATCH_STATUSES = [
  "PENDING",
  "WAITING_BATCH",
  "BATCHED",
  "DESIGNING",
  "DESIGNED",
  "PRINTING",
  "CUTTING",
  "FULFILLMENT",
  "COMPLETED",
  "CANCELLED",
];

const BatchesTable = () => {
  const [page, setPage] = useState(1);
  const limit = 10;
  const queryClient = useQueryClient();
  const navigate = useNavigate(); // 👈 hook

  const { data, isLoading, isError } = useQuery({
    queryKey: ["batches", page, limit],
    queryFn: () => getBatches({ page, limit }),
    keepPreviousData: true,
  });

  const { mutate: changeStatus, isPending } = useMutation({
    mutationFn: ({ batchId, status }) => updateBatchStatus(batchId, status),
    onSuccess: () => queryClient.invalidateQueries(["batches"]),
    onError: (err) => {
      console.error("Failed to update batch status:", err);
      alert(
        `Error updating status: ${err.response?.data?.message || err.message}`
      );
    },
  });

  if (isLoading) return <Spinner />;
  if (isError) return <p>Failed to load batches</p>;

  const { data: batches, page: currentPage, pages } = data;

  return (
    <div className="space-y-4 relative">
      <h2 className="text-xl font-bold">Batches</h2>

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

              {/* 👇 Protect dropdown */}
              <Table.Cell>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold
      ${
        batch.status === "PENDING"
          ? "bg-yellow-200 text-yellow-800"
          : batch.status === "WAITING_BATCH"
          ? "bg-orange-200 text-orange-800"
          : batch.status === "BATCHED"
          ? "bg-blue-200 text-blue-800"
          : batch.status === "DESIGNING"
          ? "bg-purple-200 text-purple-800"
          : batch.status === "DESIGNED"
          ? "bg-indigo-200 text-violet-800"
          : batch.status === "PRINTING"
          ? "bg-teal-200 text-teal-800"
          : batch.status === "CUTTING"
          ? "bg-pink-200 text-pink-800"
          : batch.status === "FULFILLMENT"
          ? "bg-gray-200 text-gray-800"
          : batch.status === "COMPLETED"
          ? "bg-green-200 text-green-800"
          : batch.status === "CANCELLED"
          ? "bg-red-200 text-red-800"
          : "bg-gray-100 text-gray-700"
      }`}
                >
                  {batch.status.replaceAll("_", " ")}
                </span>
              </Table.Cell>
              <Table.Cell>
                {new Date(batch.createdAt).toLocaleString()}
              </Table.Cell>

              {/* 👇 Protect export button */}
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

      {/* Pagination */}
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
