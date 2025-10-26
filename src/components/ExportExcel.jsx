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

  const fetchImageAsBase64 = async (url) => {
    try {
      if (url.startsWith("data:image")) {
        return url;
      }
      const response = await fetch(url);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error("Failed to fetch image:", error);
      return null;
    }
  };

  const exportToExcel = async () => {
    if (disabled) return;

    // ✅ If user is DESIGNER, update status before exporting
    if (user?.role === "DESIGNER" && batch.status === "BATCHED") {
      changeStatus({ batchId: batch.id, status: "DESIGNING" });
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Items");

    // ===== Batch Title =====
    worksheet.mergeCells("A1:E1");
    const titleRow = worksheet.getCell("A1");
    titleRow.value = `Batch: ${batch.name}`;
    titleRow.font = { size: 16, bold: true };
    titleRow.alignment = { vertical: "middle", horizontal: "center" };
    worksheet.getRow(1).height = 30;

    // ===== Table Header =====
    worksheet.getRow(3).values = [
      "Title",
      "Store Name",
      "SKU",
      "Order Number",
      "Unit QR Code",
    ];

    worksheet.getRow(3).font = { bold: true };
    worksheet.getRow(3).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE0E0E0" },
    };

    worksheet.columns = [
      { width: 30 }, // Title
      { width: 20 }, // Store Name
      { width: 15 }, // SKU
      { width: 18 }, // Order Number
      { width: 20 }, // Unit QR
    ];

    // ===== Add Item Rows =====
    let currentRow = 4;
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
          "",
        ]);
        row.height = 80;

        if (unit.qrCodeUrl) {
          const unitQRBase64 = await fetchImageAsBase64(unit.qrCodeUrl);
          if (unitQRBase64) {
            const unitImageId = workbook.addImage({
              base64: unitQRBase64,
              extension: "png",
            });
            worksheet.addImage(unitImageId, {
              tl: { col: 4, row: currentRow - 1 },
              ext: { width: 80, height: 80 },
            });
          }
        }

        currentRow++;
      }
    }

    // ===== Add Batch QR Code at End =====
    if (batch.qrCodeUrl) {
      currentRow += 2;

      worksheet.mergeCells(`A${currentRow}:E${currentRow}`);
      const qrTitle = worksheet.getCell(`A${currentRow}`);
      qrTitle.value = "Batch QR Code";
      qrTitle.font = { bold: true, size: 14 };
      qrTitle.alignment = { horizontal: "center", vertical: "middle" };
      worksheet.getRow(currentRow).height = 25;

      const batchQRBase64 = await fetchImageAsBase64(batch.qrCodeUrl);
      if (batchQRBase64) {
        const batchImageId = workbook.addImage({
          base64: batchQRBase64,
          extension: "png",
        });

        worksheet.addImage(batchImageId, {
          tl: { col: 2, row: currentRow },
          ext: { width: 120, height: 120 },
        });
        worksheet.getRow(currentRow + 1).height = 100;
      }
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
