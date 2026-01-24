import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useTransition,
  useRef,
} from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Table from "./Table";
import {
  assignProductQuantity,
  deleteProductQuantity,
  getProductsByMainStock,
} from "../api/adminsApi";

/* -----------------------------
   Debounce helper (stable)
-------------------------------- */
function debounce(fn, delay) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

const MainStockProducts = ({ mainStockId }) => {
  const queryClient = useQueryClient();

  /* -----------------------------
     Pagination & Search state
  -------------------------------- */
  const [page, setPage] = useState(1);
  const [debouncedSkuSearch, setDebouncedSkuSearch] = useState("");
  const [debouncedTitleSearch, setDebouncedTitleSearch] = useState("");

  /* -----------------------------
     FIXED Preview state & refs
  -------------------------------- */
  const [previewImage, setPreviewImage] = useState(null);
  const [previewProductName, setPreviewProductName] = useState("");
  const previewTimeoutRef = useRef(null);
  const previewRef = useRef(null);
  const thumbnailRef = useRef(null); // Track thumbnail for gap bridging

  /* -----------------------------
     FIXED Preview handlers
  -------------------------------- */
  const openPreview = useCallback((img, name, thumbRef) => {
    clearTimeout(previewTimeoutRef.current);
    setPreviewImage(img);
    setPreviewProductName(name);
    thumbnailRef.current = thumbRef; // Store current thumbnail ref
  }, []);

  const closePreview = useCallback(() => {
    setPreviewImage(null);
    setPreviewProductName("");
    thumbnailRef.current = null;
  }, []);

  const scheduleClose = useCallback(() => {
    previewTimeoutRef.current = setTimeout(closePreview, 750); // Shorter delay since preview keeps open
  }, [closePreview]);

  /* -----------------------------
     PERFECT Mouse tracking - Bridges thumbnail to preview gap
  -------------------------------- */
  useEffect(() => {
    if (!previewImage || (!previewRef.current && !thumbnailRef.current)) return;

    let ticking = false;
    const handleMouseMove = (e) => {
      // Check preview bounds
      if (previewRef.current) {
        const rect = previewRef.current.getBoundingClientRect();
        const isInsidePreview =
          e.clientX >= rect.left &&
          e.clientX <= rect.right &&
          e.clientY >= rect.top &&
          e.clientY <= rect.bottom;

        if (isInsidePreview) {
          clearTimeout(previewTimeoutRef.current);
          return;
        }
      }

      // Check thumbnail bounds (bridges the gap!)
      if (thumbnailRef.current) {
        const thumbRect = thumbnailRef.current.getBoundingClientRect();
        const isInsideThumbnail =
          e.clientX >= thumbRect.left &&
          e.clientX <= thumbRect.right &&
          e.clientY >= thumbRect.top &&
          e.clientY <= thumbRect.bottom;

        if (isInsideThumbnail) {
          clearTimeout(previewTimeoutRef.current);
          return;
        }
      }

      // Mouse outside both → schedule close
      scheduleClose();
    };

    const throttledMouseMove = (e) => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleMouseMove(e);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("mousemove", throttledMouseMove);
    return () => window.removeEventListener("mousemove", throttledMouseMove);
  }, [previewImage, scheduleClose]);

  const limit = 10;

  /* -----------------------------
     Quantities state
  -------------------------------- */
  const [quantities, setQuantities] = useState({});

  /* -----------------------------
     Smooth transitions
  -------------------------------- */
  const [isPending, startTransition] = useTransition();

  /* -----------------------------
     Debounced search setters
  -------------------------------- */
  const debouncedSetSkuSearch = useCallback(
    debounce((value) => {
      startTransition(() => {
        setDebouncedSkuSearch(value);
        setPage(1);
      });
    }, 800),
    [],
  );

  const debouncedSetTitleSearch = useCallback(
    debounce((value) => {
      startTransition(() => {
        setDebouncedTitleSearch(value);
        setPage(1);
      });
    }, 800),
    [],
  );

  /* -----------------------------
     Fetch products
  -------------------------------- */
  const {
    data: productsRes,
    isLoading,
    isFetching,
    isPreviousData,
  } = useQuery({
    queryKey: [
      "mainStockProducts",
      mainStockId,
      page,
      limit,
      debouncedSkuSearch,
      debouncedTitleSearch,
    ],
    queryFn: () =>
      getProductsByMainStock(mainStockId, {
        page,
        limit,
        sku: debouncedSkuSearch || undefined,
        title: debouncedTitleSearch || undefined,
      }),
    keepPreviousData: true,
  });

  const products = productsRes?.data ?? [];
  const pagination = productsRes?.pagination;

  /* -----------------------------
     Sync quantities when data changes
  -------------------------------- */
  useEffect(() => {
    const next = {};
    products.forEach((item) => {
      next[item.sku] = item.totalQuantity ?? 0;
    });
    setQuantities(next);
  }, [products]);

  /* -----------------------------
     Bulk mutation
  -------------------------------- */
  const bulkAssignMutation = useMutation({
    mutationFn: (bulkQuantities) =>
      Promise.all(
        Object.entries(bulkQuantities).map(([sku, quantity]) =>
          assignProductQuantity(mainStockId, { sku, quantity }),
        ),
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["mainStockProducts", mainStockId],
      });
    },
  });

  /* -----------------------------
     Single mutations
  -------------------------------- */
  const assignMutation = useMutation({
    mutationFn: ({ sku, quantity }) =>
      assignProductQuantity(mainStockId, { sku, quantity }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["mainStockProducts", mainStockId],
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (sku) => deleteProductQuantity(mainStockId, sku),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["mainStockProducts", mainStockId],
      });
    },
  });

  /* -----------------------------
     Bulk handler
  -------------------------------- */
  const handleBulkSave = useCallback(() => {
    const bulkQuantities = {};
    products.forEach((item) => {
      const qty = parseInt(quantities[item.sku], 10) || 0;
      if (qty > 0 || quantities[item.sku] !== undefined) {
        bulkQuantities[item.sku] = qty;
      }
    });

    if (Object.keys(bulkQuantities).length > 0) {
      bulkAssignMutation.mutate(bulkQuantities);
    }
  }, [products, quantities, bulkAssignMutation]);

  /* -----------------------------
     Optimized handlers
  -------------------------------- */
  const handleQuantityChange = useCallback((sku, value) => {
    setQuantities((prev) => ({
      ...prev,
      [sku]: value >= 0 ? value : 0,
    }));
  }, []);

  const handleSave = useCallback(
    (sku) => {
      const qty = parseInt(quantities[sku], 10) || 0;
      assignMutation.mutate({ sku, quantity: qty });
    },
    [quantities, assignMutation],
  );

  const handleDelete = useCallback(
    (sku) => {
      if (confirm("Are you sure you want to remove this SKU from stock?")) {
        deleteMutation.mutate(sku);
      }
    },
    [deleteMutation],
  );

  /* -----------------------------
     Check if any quantities changed
  -------------------------------- */
  const hasChangedQuantities = useMemo(() => {
    return products.some((item) => {
      const currentQty = parseInt(quantities[item.sku], 10) || 0;
      return currentQty !== (item.totalQuantity ?? 0);
    });
  }, [products, quantities]);

  /* -----------------------------
     Memoized row renderer
  -------------------------------- */
  const renderProductRow = useCallback(
    (item) => {
      const currentQty = parseInt(quantities[item.sku], 10) || 0;
      const originalQty = item.totalQuantity ?? 0;
      const hasChanged = currentQty !== originalQty;
      // const thumbRef = useRef(null);

      return (
        <Table.Row key={item.sku}>
          <Table.Cell>
            <div
              className="relative inline-block cursor-pointer group hover:z-10"
              onMouseEnter={() =>
                openPreview(item.productImgUrl, item.productName)
              }
              onMouseLeave={scheduleClose}
            >
              <img
                src={item.productImgUrl}
                alt={item.productName}
                className="w-12 h-12 object-cover rounded-lg shadow-md group-hover:scale-105 group-hover:shadow-xl transition-all duration-200 hover:brightness-110"
                loading="lazy"
              />
            </div>
          </Table.Cell>

          <Table.Cell>{item.sku}</Table.Cell>

          <Table.Cell className="max-w-[200px] truncate">
            {item.productName}
          </Table.Cell>

          <Table.Cell>
            <input
              type="number"
              min={0}
              value={quantities[item.sku] ?? 0}
              onChange={(e) =>
                handleQuantityChange(
                  item.sku,
                  parseInt(e.target.value, 10) || 0,
                )
              }
              className={`border rounded px-2 py-1 w-full max-w-[80px] transition-colors ${
                hasChanged
                  ? "border-yellow-400 ring-1 ring-yellow-400/50 bg-yellow-50"
                  : "border-gray-300 hover:border-gray-400"
              }`}
            />
          </Table.Cell>

          <Table.Cell>
            <div className="flex gap-1">
              <button
                onClick={() => handleSave(item.sku)}
                className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 disabled:opacity-50 transition-colors"
                disabled={assignMutation.isPending || !hasChanged}
                title="Save this item"
              >
                {assignMutation.isPending ? "Saving..." : "Save"}
              </button>
              <button
                onClick={() => handleDelete(item.sku)}
                className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 disabled:opacity-50 transition-colors"
                disabled={deleteMutation.isPending}
                title="Delete this item"
              >
                Delete
              </button>
            </div>
          </Table.Cell>
        </Table.Row>
      );
    },
    [
      quantities,
      handleQuantityChange,
      handleSave,
      handleDelete,
      assignMutation.isPending,
      deleteMutation.isPending,
      openPreview,
      scheduleClose,
    ],
  );

  return (
    <>
      {previewImage && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={closePreview}
        >
          <div
            ref={previewRef}
            className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl max-w-4xl max-h-[90vh] overflow-hidden border-8 border-white/80 relative cursor-default max-w-[95vw] max-h-[95vh] group"
            onMouseEnter={() => clearTimeout(previewTimeoutRef.current)}
            onMouseLeave={scheduleClose}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closePreview}
              className="absolute top-4 right-4 z-10 bg-black/60 hover:bg-black/80 text-white rounded-full w-10 h-10 flex items-center justify-center text-lg font-bold transition-all shadow-lg hover:scale-110"
              aria-label="Close preview"
            >
              ×
            </button>

            <div className="relative p-8">
              <img
                src={previewImage}
                alt={previewProductName}
                className="w-full h-[500px] object-contain transition-transform duration-200 group-hover:scale-[1.02]"
                loading="eager"
              />
            </div>

            <div className="p-6 bg-gradient-to-t from-black/40 to-transparent text-white text-xl font-medium text-center">
              {previewProductName}
            </div>
          </div>
        </div>
      )}

      {/* Search + Bulk Save toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Search by SKU"
          className="border rounded px-2 py-2 text-sm flex-1 max-w-md border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          onChange={(e) => debouncedSetSkuSearch(e.target.value)}
        />
        <input
          type="text"
          placeholder="Search by title"
          className="border rounded px-2 py-2 text-sm flex-1 max-w-md border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          onChange={(e) => debouncedSetTitleSearch(e.target.value)}
        />
        <button
          onClick={handleBulkSave}
          disabled={
            bulkAssignMutation.isPending ||
            !hasChangedQuantities ||
            products.length === 0
          }
          className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50 font-medium whitespace-nowrap transition-colors"
          title="Save all changed quantities on this page"
        >
          {bulkAssignMutation.isPending ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block mr-2" />
              Saving All...
            </>
          ) : (
            `Save All (${products.length})`
          )}
        </button>
      </div>

      {/* Main content with loading states */}
      <div className="relative">
        <Table>
          <Table.Head>
            <Table.HeaderCell>Image</Table.HeaderCell>
            <Table.HeaderCell>SKU</Table.HeaderCell>
            <Table.HeaderCell>Title</Table.HeaderCell>
            <Table.HeaderCell>Quantity</Table.HeaderCell>
            <Table.HeaderCell>Actions</Table.HeaderCell>
          </Table.Head>

          <Table.Body>
            {isLoading && products.length === 0 ? (
              <Table.Row>
                <Table.Cell
                  colSpan={5}
                  className="text-center py-12 text-gray-500"
                >
                  <div className="flex items-center gap-2 justify-center">
                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    Loading products...
                  </div>
                </Table.Cell>
              </Table.Row>
            ) : products.length === 0 ? (
              <Table.Row>
                <Table.Cell
                  colSpan={5}
                  className="text-center py-12 text-gray-500"
                >
                  {isFetching ? "Searching..." : "No products found"}
                </Table.Cell>
              </Table.Row>
            ) : (
              products.map(renderProductRow)
            )}
          </Table.Body>
        </Table>

        {/* Inline spinner overlay - only for background fetches */}
        {(isFetching || isPending) && !isLoading && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg border border-gray-300">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              {isPreviousData ? "Updating results..." : "Loading..."}
            </div>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="mt-6 flex items-center justify-between">
          <span className="text-sm text-gray-600">
            Page {pagination.currentPage} of {pagination.totalPages} —{" "}
            {pagination.totalItems} items
          </span>

          <div className="flex gap-2">
            <button
              type="button"
              disabled={!pagination.hasPreviousPage || isFetching}
              onClick={() =>
                startTransition(() => setPage((p) => Math.max(1, p - 1)))
              }
              className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-50 transition-colors"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={!pagination.hasNextPage || isFetching}
              onClick={() =>
                startTransition(() =>
                  setPage((p) =>
                    pagination.hasNextPage
                      ? Math.min(pagination.totalPages, p + 1)
                      : p,
                  ),
                )
              }
              className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-50 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default MainStockProducts;
