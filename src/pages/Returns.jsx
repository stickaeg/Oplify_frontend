import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getReturnedItems } from "../api/adminsApi";
import { getStores } from "../api/agentsApi";

const Returns = () => {
  // filters that drive the query
  const [queryFilters, setQueryFilters] = useState({
    storeId: "",
    productType: "",
    startDate: "",
    endDate: "",
    page: 1,
    limit: 20,
  });

  // filters bound to inputs
  const [pendingFilters, setPendingFilters] = useState(queryFilters);

  const [previewImg, setPreviewImg] = useState(null);

  // stores dropdown
  const {
    data: storesData,
    isLoading: storesLoading,
    isError: storesError,
  } = useQuery({
    queryKey: ["stores"],
    queryFn: getStores,
  });

  const stores = storesData?.data || [];

  const { data, isLoading, isError, error, isFetching } = useQuery({
    queryKey: ["returnedItems", queryFilters],
    queryFn: () => getReturnedItems(queryFilters),
    keepPreviousData: true,
  });

  console.log(queryFilters);
  
  const returnedItems = data?.data || [];
  const pagination = data?.pagination || {
    total: 0,
    page: queryFilters.page,
    limit: queryFilters.limit,
    totalPages: 1,
  };

  const handleThumbEnter = (item) => {
    if (!item.product?.imgUrl) return;
    setPreviewImg({
      src: item.product.imgUrl,
      title: item.product.title,
    });
  };

  const handleThumbLeave = () => setPreviewImg(null);

  // update inputs only
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPendingFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // apply filters -> triggers query
  const applyFilters = () => {
    setQueryFilters((prev) => ({
      ...prev,
      ...pendingFilters,
      page: 1,
    }));
  };

  const resetFilters = () => {
    const base = {
      storeId: "",
      productType: "",
      startDate: "",
      endDate: "",
      page: 1,
      limit: 20,
    };
    setPendingFilters(base);
    setQueryFilters(base);
  };

  const goToPage = (nextPage) => {
    setQueryFilters((prev) => ({
      ...prev,
      page: nextPage,
    }));
  };

  if (isLoading && !isFetching) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold mb-4">Returns</h1>
        <div className="text-gray-500">Loading returns...</div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold mb-4">Returns</h1>
        <div className="text-red-500">
          Error loading returns: {error.message}
        </div>
      </div>
    );
  }

  return (
    <div className="relative p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold">Returns</h1>
          {isFetching && (
            <span className="text-xs text-gray-400">(refreshing...)</span>
          )}
        </div>
        <span className="text-sm text-gray-500">
          Total returns: {pagination.total}
        </span>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 gap-3 rounded-lg border border-gray-200 bg-white p-4 text-sm md:grid-cols-6">
        {/* Store dropdown */}
        <div className="flex flex-col">
          <label className="mb-1 text-xs font-medium text-gray-600">
            Store
          </label>
          <select
            name="storeId"
            value={pendingFilters.storeId}
            onChange={handleInputChange}
            className="rounded border border-gray-300 px-2 py-1"
            disabled={storesLoading || storesError}
          >
            <option value="">All stores</option>
            {stores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Product type */}
        <div className="flex flex-col">
          <label className="mb-1 text-xs font-medium text-gray-600">
            Product type
          </label>
          <input
            name="productType"
            value={pendingFilters.productType}
            onChange={handleInputChange}
            className="rounded border border-gray-300 px-2 py-1"
            placeholder="e.g. ACRYLIC KEYCHAINS"
          />
        </div>

        {/* Start date */}
        <div className="flex flex-col">
          <label className="mb-1 text-xs font-medium text-gray-600">
            Start date
          </label>
          <input
            type="date"
            name="startDate"
            value={pendingFilters.startDate}
            onChange={handleInputChange}
            className="rounded border border-gray-300 px-2 py-1"
          />
        </div>

        {/* End date */}
        <div className="flex flex-col">
          <label className="mb-1 text-xs font-medium text-gray-600">
            End date
          </label>
          <input
            type="date"
            name="endDate"
            value={pendingFilters.endDate}
            onChange={handleInputChange}
            className="rounded border border-gray-300 px-2 py-1"
          />
        </div>

        {/* Limit */}
        <div className="flex flex-col">
          <label className="mb-1 text-xs font-medium text-gray-600">
            Per page
          </label>
          <select
            name="limit"
            value={pendingFilters.limit}
            onChange={handleInputChange}
            className="rounded border border-gray-300 px-2 py-1"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>

        {/* Actions */}
        <div className="flex items-end gap-2">
          <button
            type="button"
            onClick={applyFilters}
            className="rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700"
          >
            Apply
          </button>
          <button
            type="button"
            onClick={resetFilters}
            className="rounded border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Table */}
      {returnedItems.length === 0 ? (
        <div className="rounded-md border border-dashed border-gray-300 p-6 text-center text-gray-500">
          No returned items found.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3 border-b border-gray-400">Item</th>
                <th className="px-4 py-3 border-b border-gray-400">Store</th>
                <th className="px-4 py-3 border-b border-gray-400">Order #</th>
                <th className="px-4 py-3 border-b border-gray-400">Variant</th>
                <th className="px-4 py-3 border-b border-gray-400 text-right">
                  Qty
                </th>
                <th className="px-4 py-3 border-b">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {returnedItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 max-w-xs text-gray-800">
                    <div className="flex items-center gap-3">
                      {item.product?.imgUrl && (
                        <button
                          type="button"
                          onMouseEnter={() => handleThumbEnter(item)}
                          onMouseLeave={handleThumbLeave}
                          className="h-10 w-10 rounded border border-gray-200 bg-gray-100 overflow-hidden focus:outline-none"
                        >
                          <img
                            src={item.product.imgUrl}
                            alt={item.product.title}
                            className="h-full w-full object-cover"
                          />
                        </button>
                      )}
                      <div className="flex flex-col">
                        <span className="font-medium truncate">
                          {item.product?.title}
                        </span>
                        <span className="text-xs text-gray-500 truncate">
                          {item.product?.productType}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-gray-700">
                    {item.store?.name || "—"}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-gray-700">
                    {item.order?.orderNumber ?? item.orderId}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-gray-700">
                    <div className="flex flex-col">
                      <span>{item.variant?.title || "—"}</span>
                      {item.variant?.sku && (
                        <span className="text-xs text-gray-500">
                          SKU: {item.variant.sku}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-right font-medium text-gray-800">
                    {item.quantity}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-gray-700">
                    {new Date(item.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between pt-3 text-sm text-gray-600">
        <span>
          Page {pagination.page} of {pagination.totalPages} • {pagination.total}{" "}
          results
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={pagination.page <= 1}
            onClick={() => goToPage(pagination.page - 1)}
            className="rounded border border-gray-300 px-3 py-1 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Prev
          </button>
          <button
            type="button"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => goToPage(pagination.page + 1)}
            className="rounded border border-gray-300 px-3 py-1 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      {previewImg && (
        <div className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <div className="pointer-events-auto max-h-[80vh] max-w-[80vw] rounded-lg bg-white p-3 shadow-2xl">
            <img
              src={previewImg.src}
              alt={previewImg.title}
              className="max-h-[70vh] max-w-[70vw] object-contain rounded"
            />
            <div className="mt-2 text-center text-sm text-gray-700">
              {previewImg.title}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Returns;
