import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Table from "./Table";
import {
  assignProductQuantity,
  deleteProductQuantity,
  getProductsByMainStock,
} from "../api/adminsApi";

const MainStockProducts = ({ mainStockId }) => {
  const queryClient = useQueryClient();
  const [quantities, setQuantities] = useState({}); // track local changes
  const [skuSearch, setSkuSearch] = useState("");
  const [titleSearch, setTitleSearch] = useState("");

  const debouncedSkuSearch = useDebounce(skuSearch, 800);
  const debouncedTitleSearch = useDebounce(titleSearch, 800);

  // pagination state
  const [page, setPage] = useState(1);
  const limit = 10;

  // Fetch product quantities (paginated)
  const { data: productsRes, isLoading } = useQuery({
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
    keepPreviousData: true, // optional, smoother pagination
  });

  const products = productsRes?.data ?? [];
  const pagination = productsRes?.pagination;

  // Initialize quantities when products data changes
  useEffect(() => {
    if (products && products.length > 0) {
      const initial = {};
      products.forEach((item) => {
        initial[item.sku] = item.totalQuantity || 0;
      });
      setQuantities(initial);
    } else {
      setQuantities({});
    }
  }, [products]);

  // Mutation to update/assign quantity
  const assignMutation = useMutation({
    mutationFn: ({ sku, quantity }) =>
      assignProductQuantity(mainStockId, { sku, quantity }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["mainStockProducts", mainStockId],
      });
    },
  });

  // Mutation to delete SKU quantity
  const deleteMutation = useMutation({
    mutationFn: (sku) => deleteProductQuantity(mainStockId, sku),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["mainStockProducts", mainStockId],
      });
    },
  });

  const handleChange = (sku, value) => {
    setQuantities((prev) => ({
      ...prev,
      [sku]: value >= 0 ? value : 0,
    }));
  };

  const handleSave = (sku) => {
    const qty = parseInt(quantities[sku]) || 0;
    assignMutation.mutate({ sku, quantity: qty });
  };

  const handleDelete = (sku) => {
    if (confirm("Are you sure you want to remove this SKU from stock?")) {
      deleteMutation.mutate(sku);
    }
  };

  if (isLoading) return <div>Loading products...</div>;

  return (
    <>
      {/* Search toolbar */}
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <input
          type="text"
          value={skuSearch}
          onChange={(e) => {
            setSkuSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search by SKU"
          className="border rounded px-2 py-1 text-sm"
        />
        <input
          type="text"
          value={titleSearch}
          onChange={(e) => {
            setTitleSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search by title"
          className="border rounded px-2 py-1 text-sm"
        />
      </div>

      <Table>
        <Table.Head>
          <Table.HeaderCell>Image</Table.HeaderCell>
          <Table.HeaderCell>SKU</Table.HeaderCell>
          <Table.HeaderCell>Title</Table.HeaderCell>
          <Table.HeaderCell>Quantity</Table.HeaderCell>
          <Table.HeaderCell>Actions</Table.HeaderCell>
        </Table.Head>
        <Table.Body>
          {products.map((item) => (
            <Table.Row key={item.sku}>
              <Table.Cell>
                {item.productImgUrl ? (
                  <div className="relative inline-block group">
                    {/* small image */}
                    <img
                      src={item.productImgUrl}
                      alt={item.productName}
                      className="h-12 w-12 object-cover rounded"
                    />
                    {/* big image on hover */}
                    <div className="pointer-events-none absolute left-20 top-20 z-50 hidden -translate-x-1/2 -translate-y-1/2 rounded-lg border border-gray-300 bg-white p-1 shadow-lg group-hover:block">
                      <img
                        src={item.productImgUrl}
                        alt={item.productName}
                        className="max-h-50 max-w-50 object-contain rounded"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="h-12 w-12 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">
                    N/A
                  </div>
                )}
              </Table.Cell>

              <Table.Cell>{item.sku}</Table.Cell>

              <Table.Cell className="max-w-[200px] truncate">
                {item.productName}
              </Table.Cell>

              <Table.Cell>
                <input
                  type="number"
                  className="border rounded px-2 py-1 w-full max-w-[80px]"
                  value={quantities[item.sku] ?? 0}
                  onChange={(e) =>
                    handleChange(item.sku, parseInt(e.target.value) || 0)
                  }
                  min={0}
                />
              </Table.Cell>

              <Table.Cell>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSave(item.sku)}
                    className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => handleDelete(item.sku)}
                    className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>

      {pagination && (
        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm text-gray-600">
            Page {pagination.currentPage} of {pagination.totalPages} —{" "}
            {pagination.totalItems} items
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={!pagination.hasPreviousPage}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={!pagination.hasNextPage}
              onClick={() =>
                setPage((p) =>
                  pagination.hasNextPage
                    ? Math.min(pagination.totalPages, p + 1)
                    : p
                )
              }
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </>
  );
};

function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced;
}
export default MainStockProducts;
