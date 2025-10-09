import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { useAuth } from "../context/AuthContext";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateBatchStatus } from "../api/agentsApi";

const ExportExcel = ({ batch, disabled }) => {
  const { user } = useAuth(); // 👈 from your AuthContext
  const queryClient = useQueryClient();

  const { mutate: changeStatus } = useMutation({
    mutationFn: ({ batchId, status }) => updateBatchStatus(batchId, status),
    onSuccess: () => {
      queryClient.invalidateQueries(["batches"]);
    },
    onError: (err) => {
      console.error("Failed to update batch status:", err);
    },
  });

  const exportToExcel = () => {
    if (disabled) return; // Prevent click when disabled
    // ✅ If user is DESIGNER, update status before exporting
    if (user?.role === "DESIGNER" && batch.status === "BATCHED") {
      changeStatus({ batchId: batch.id, status: "DESIGNING" });
    }

    // ✅ Generate Excel
    const rows = batch.items.flatMap((item) =>
      Array.from({ length: item.quantityInBatch }, () => ({
        BatchName: batch.name,
        Title: item.title,
        StoreName: item.storeName,
        SKU: item.sku,
        OrderNumber: item.orderNumber,
      }))
    );

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Items");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const file = new Blob([excelBuffer], { type: "application/octet-stream" });

    saveAs(file, `${batch.name}_items.xlsx`);
  };

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        exportToExcel();
      }}
      disabled={disabled}
      className={`px-3 py-1 rounded ${
        disabled
          ? "bg-gray-300 text-gray-600 cursor-not-allowed"
          : "bg-blue-600 text-white hover:bg-blue-700"
      }`}
    >
      Download Excel
    </button>
  );
};

export default ExportExcel;
