import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { useAuth } from "../context/AuthContext";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateBatchStatus } from "../api/agentsApi";

const ExportExcel = ({ batch, disabled }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { mutate: changeStatus } = useMutation({
    mutationFn: ({ batchId, status }) => updateBatchStatus(batchId, status),
    onSuccess: () => queryClient.invalidateQueries(["batches"]),
    onError: (err) => console.error("Failed to update batch status:", err),
  });

  const exportToExcel = async () => {
    if (disabled) return;

    // If designer, auto-update batch status
    if (user?.role === "DESIGNER" && batch.status === "BATCHED") {
      changeStatus({ batchId: batch.id, status: "DESIGNING" });
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Items");

    // ===== HEADER ROW =====
    worksheet.addRow([
      "Title",
      "Store Name",
      "SKU",
      "Order Number",
      "Unit QR Code (URL)",
      "Batch QR (URL)",
    ]);

    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE0E0E0" },
    };
    headerRow.alignment = { horizontal: "center", vertical: "middle" };

    // ===== COLUMN WIDTHS =====
    const widths = [30, 20, 15, 18, 45, 45];
    widths.forEach((w, i) => (worksheet.getColumn(i + 1).width = w));

    // ===== ADD ITEM ROWS =====
    const orderCounters = {};
    let isFirstBatchQR = true;

    for (const item of batch.items || []) {
      if (!orderCounters[item.orderNumber]) {
        orderCounters[item.orderNumber] = 0;
      }

      for (const unit of item.units || []) {
        orderCounters[item.orderNumber]++;
        const unitNumber = orderCounters[item.orderNumber];

        const row = worksheet.addRow([
          item.productTitle || "",
          item.storeName || "",
          item.sku || "",
          `${item.orderNumber} - ${unitNumber}`,
          "", // Unit QR placeholder
          "", // Batch QR placeholder
        ]);

        // ===== Add Unit QR hyperlink (col E)
        if (unit.qrCodeUrl) {
          const unitQRCell = row.getCell(5);
          unitQRCell.value = {
            text: unit.qrCodeUrl,
            hyperlink: unit.qrCodeUrl,
          };
          unitQRCell.font = { color: { argb: "FF0000FF" }, underline: true };
        }

        // ===== Add Batch QR hyperlink ONLY for first row =====
        if (batch.qrCodeUrl && isFirstBatchQR) {
          const batchQRCell = row.getCell(6);
          batchQRCell.value = {
            text: batch.qrCodeUrl,
            hyperlink: batch.qrCodeUrl,
          };
          batchQRCell.font = { color: { argb: "FF0000FF" }, underline: true };
          isFirstBatchQR = false; // disable for next rows
        }
      }
    }

    // ===== SAVE FILE =====
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    saveAs(blob, `${batch.name}_items.xlsx`);
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
