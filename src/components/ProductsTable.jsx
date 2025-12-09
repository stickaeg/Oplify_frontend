import { useState, useEffect } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { getProducts, getStores } from "../api/agentsApi";
import { listProductTypesByStore } from "../api/adminsApi";

import Table from "./Table";
import Spinner from "./Loading";
import { useAuth } from "../context/AuthContext";

const ProductsTable = () => {
  const [page, setPage] = useState(1);
  const limit = 10;

  // 🧩 Filters
  const [storeId, setStoreId] = useState("");
  const [productType, setProductType] = useState("");
  const [debouncedProductType, setDebouncedProductType] = useState(""); // 👈 for debounce
  const [isPod, setIsPod] = useState("");
  const { user } = useAuth();

  // 🕒 Debounce effect for productType (runs 500ms after user stops typing)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedProductType(productType);
    }, 500);

    return () => clearTimeout(handler); // cleanup old timer
  }, [productType]);

  // 🏪 Fetch stores
  const { data: stores = [] } = useQuery({
    queryKey: ["stores"],
    queryFn: getStores,
  });

  const { data: productTypes = [], isLoading: typesLoading } = useQuery({
    queryKey: ["productTypes", storeId],
    queryFn: () =>
      listProductTypesByStore(
        stores.data?.find((s) => s.id === storeId)?.name || ""
      ),
    enabled: !!storeId, // only run when a store is selected
  });

  // 📦 Fetch products with filters (using debouncedProductType)
  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: ["products", page, limit, storeId, debouncedProductType, isPod],
    queryFn: () =>
      getProducts({
        page,
        limit,
        storeId: storeId || undefined,
        productType: debouncedProductType || undefined,
        isPod: isPod || undefined,
      }),
    staleTime: 1000 * 60 * 2, // 2 minutes cache
    placeholderData: keepPreviousData,
  });

  if (isLoading) return <Spinner />;
  if (isError) return <p>Failed to load products</p>;

  const { data: products, page: currentPage, pages } = data;

  return (
    <div className="space-y-6 relative p-6">
      {isFetching && (
        <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-10">
          <Spinner />
        </div>
      )}

      {/* ===== Filters ===== */}
      <div className="flex flex-wrap gap-4 items-end bg-white p-4 rounded-lg shadow-sm">
        {user.role !== "USER" && (
          <>
            {/* Store Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Store
              </label>
              <select
                value={storeId}
                onChange={(e) => {
                  setStoreId(e.target.value);
                  setPage(1);
                }}
                className="border border-gray-300 rounded-lg px-3 py-2 w-48"
              >
                <option value="">All Stores</option>
                {stores.data?.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Product Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Type
              </label>
              <select
                value={productType}
                onChange={(e) => {
                  setProductType(e.target.value);
                  setPage(1);
                }}
                disabled={!storeId || typesLoading}
                className={`border rounded-lg px-3 py-2 w-48 transition-colors duration-200
          ${
            !storeId || typesLoading
              ? "bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed"
              : "bg-white text-gray-800 border-gray-300 hover:border-gray-400 focus:border-blue-500"
          }`}
              >
                <option value="">
                  {typesLoading ? "Loading..." : "All Types"}
                </option>
                {productTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}

        {/* POD Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            POD
          </label>
          <select
            value={isPod}
            onChange={(e) => {
              setIsPod(e.target.value);
              setPage(1);
            }}
            className="border border-gray-300 rounded-lg px-3 py-2 w-32"
          >
            <option value="">All</option>
            <option value="true">POD</option>
            <option value="false">Stock</option>
          </select>
        </div>
      </div>

      <Table>
        <Table.Head>
          <Table.HeaderCell>Image</Table.HeaderCell>
          <Table.HeaderCell>Name</Table.HeaderCell>
          <Table.HeaderCell>Type</Table.HeaderCell>
          <Table.HeaderCell>POD</Table.HeaderCell>
          <Table.HeaderCell>Store</Table.HeaderCell>
        </Table.Head>
        <Table.Body>
          {products.map((product) => (
            <Table.Row key={product.id}>
              <Table.Cell>
                <img
                  className="max-w-full h-16 object-contain"
                  src={product.imgUrl}
                  alt={product.title}
                  loading="lazy"
                />
              </Table.Cell>
              <Table.Cell>{product.title}</Table.Cell>
              <Table.Cell>{product.productType || "-"}</Table.Cell>
              <Table.Cell>{product.isPod ? "Yes" : "No"}</Table.Cell>
              <Table.Cell>{product.store?.name || "—"}</Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>

      {/* ===== Pagination ===== */}
      <div className="flex items-center justify-center gap-4">
        <button
          className="px-4 py-2 bg-white border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          disabled={currentPage === 1 || isFetching}
          onClick={() => setPage((p) => p - 1)}
        >
          ← Previous
        </button>
        <span className="text-sm font-medium text-gray-700">
          Page <b>{currentPage}</b> of <b>{pages}</b>
        </span>
        <button
          className="px-4 py-2 bg-white border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          disabled={currentPage === pages || isFetching}
          onClick={() => setPage((p) => p + 1)}
        >
          Next →
        </button>
      </div>
    </div>
  );
};

export default ProductsTable;
