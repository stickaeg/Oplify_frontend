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
    onSuccess: () => {
      queryClient.invalidateQueries(["batches"]);
    },
    onError: (err) => {
      console.error("Failed to update batch status:", err);
    },
  });

  const exportToExcel = async () => {
    if (disabled) return;

    // ✅ Update status if designer
    if (user?.role === "DESIGNER" && batch.status === "BATCHED") {
      changeStatus({ batchId: batch.id, status: "DESIGNING" });
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Items");

    // ===== Table Header =====
    worksheet.getRow(1).values = [
      "Title",
      "Store Name",
      "SKU",
      "Order Number",
      "Unit QR Code (URL)",
    ];

    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE0E0E0" },
    };

    worksheet.columns = [
      { width: 30 },
      { width: 20 },
      { width: 15 },
      { width: 18 },
      { width: 45 },
    ];

    // ===== Add Item Rows =====
    let currentRow = 2;
    const orderCounters = {};

    for (const item of batch.items) {
      if (!orderCounters[item.orderNumber]) {
        orderCounters[item.orderNumber] = 0;
      }

      for (const unit of item.units) {
        orderCounters[item.orderNumber]++;
        const unitNumber = orderCounters[item.orderNumber];

        const row = worksheet.addRow([
          item.productTitle,
          item.storeName,
          item.sku,
          `${item.orderNumber} - ${unitNumber}`,
          "", // Placeholder for QR URL link
        ]);

        // Add QR code as hyperlink (not image)
        if (unit.qrCodeUrl) {
          const cell = worksheet.getCell(`E${currentRow}`);
          cell.value = {
            text: unit.qrCodeUrl,
            hyperlink: unit.qrCodeUrl,
          };
          cell.font = { color: { argb: "FF0000FF" }, underline: true };
        }

        currentRow++;
      }
    }

    // ===== Add Batch QR Code (as link) at the Bottom =====
    if (batch.qrCodeUrl) {
      currentRow += 2;

      worksheet.mergeCells(`A${currentRow}:E${currentRow}`);
      const qrTitle = worksheet.getCell(`A${currentRow}`);
      qrTitle.value = "Batch QR Code";
      qrTitle.font = { bold: true, size: 14 };
      qrTitle.alignment = { horizontal: "center", vertical: "middle" };

      worksheet.mergeCells(`A${currentRow + 1}:E${currentRow + 1}`);
      const qrLinkCell = worksheet.getCell(`A${currentRow + 1}`);
      qrLinkCell.value = {
        text: batch.qrCodeUrl,
        hyperlink: batch.qrCodeUrl,
      };
      qrLinkCell.font = { color: { argb: "FF0000FF" }, underline: true };
      qrLinkCell.alignment = { horizontal: "center", vertical: "middle" };
    }

    // ===== Save Excel File =====
    const buffer = await workbook.xlsx.writeBuffer();
    const file = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

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
