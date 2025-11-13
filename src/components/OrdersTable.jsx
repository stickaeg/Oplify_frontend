import { useState, useEffect } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { getOrders, getStores } from "../api/agentsApi";
import Table from "./Table";
import Spinner from "./Loading";
import getStatusClasses from "../utils/statusColors";

const OrdersTable = () => {
  const [page, setPage] = useState(1);
  const limit = 10;
  const navigate = useNavigate();

  // ===== Filters =====
  const [storeId, setStoreId] = useState("");
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(handler);
  }, [search]);

  // ===== Fetch Stores =====
  const { data: stores = [] } = useQuery({
    queryKey: ["stores"],
    queryFn: getStores,
    staleTime: 1000 * 60 * 10,
  });

  // ===== Fetch Orders =====
  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: [
      "orders",
      page,
      limit,
      storeId,
      status,
      debouncedSearch,
      startDate,
      endDate,
    ],
    queryFn: () =>
      getOrders({
        page,
        limit,
        storeId: storeId || undefined,
        status: status || undefined,
        search: debouncedSearch || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      }),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 2,
  });

  if (isLoading) return <Spinner />;
  if (isError) return <p>Failed to load orders</p>;

  const { data: orders, page: currentPage, pages } = data;

  const handleRowClick = (orderId) => navigate(`/orders/${orderId}`);

  return (
    <div className="space-y-6 relative">
      <h2 className="text-xl font-bold">Orders</h2>

      {/* ===== Filters ===== */}
      <div className="flex flex-wrap gap-4 items-end bg-white p-4 rounded-lg shadow-sm border border-gray-200">
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
            className="border border-gray-300 rounded-lg px-3 py-2 w-48 bg-white text-gray-800 hover:border-gray-400 focus:border-blue-500 transition-colors"
          >
            <option value="">All Stores</option>
            {stores.data?.map((store) => (
              <option key={store.id} value={store.id}>
                {store.name}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="border border-gray-300 rounded-lg px-3 py-2 w-40 bg-white text-gray-800 hover:border-gray-400 focus:border-blue-500 transition-colors"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="WAITING_BATCH">Waiting batch</option>
            <option value="BATCHED">Batched</option>
            <option value="DESIGNING">Designing</option>
            <option value="DESIGNED">Designed</option>
            <option value="PRINTING">Printing</option>
            <option value="PRINTED">Printed</option>
            <option value="CUTTING">Cutting</option>
            <option value="CUT">Cut</option>
            <option value="FULFILLMENT">Fulfillment</option>
            <option value="PACKED">Packed</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        {/* Search Filter (Order #) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Search by Order number, email or phone
          </label>
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Enter order number, phone, email..."
            className="border border-gray-300 rounded-lg px-3 py-2 w-64 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
          />
        </div>

        {/* Date Range Filters */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Start Date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setPage(1);
            }}
            className="border border-gray-300 rounded-lg px-3 py-2 w-44 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            End Date
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setPage(1);
            }}
            className="border border-gray-300 rounded-lg px-3 py-2 w-44 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
          />
        </div>
      </div>

      {/* ===== Orders Table ===== */}
      <div className="relative">
        {isFetching && (
          <div className="absolute inset-0 bg-white/50 flex items-center justify-center rounded-lg z-10">
            <Spinner />
          </div>
        )}

        <Table>
          <Table.Head>
            <Table.HeaderCell>Order Number</Table.HeaderCell>
            <Table.HeaderCell>Store</Table.HeaderCell>
            <Table.HeaderCell>Total Price</Table.HeaderCell>
            <Table.HeaderCell>Status</Table.HeaderCell>
            <Table.HeaderCell>Created At</Table.HeaderCell>
          </Table.Head>
          <Table.Body>
            {orders.map((order) => (
              <Table.Row
                key={order.id}
                onClick={() => handleRowClick(order.id)}
                className="cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <Table.Cell>#{order.orderNumber}</Table.Cell>
                <Table.Cell>{order.store?.name || "—"}</Table.Cell>
                <Table.Cell>EGP {order.totalPrice?.toFixed(2) || 0}</Table.Cell>
                <Table.Cell>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusClasses(
                      order.status
                    )}`}
                  >
                    {order.status || "-"}
                  </span>
                </Table.Cell>{" "}
                <Table.Cell>
                  {new Date(order.createdAt).toLocaleString()}
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </div>

      {/* ===== Pagination ===== */}
      <div className="flex items-center justify-center gap-4">
        <button
          className="px-4 py-2 bg-white border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          disabled={currentPage === 1 || isFetching}
          onClick={() => setPage((p) => p - 1)}
        >
          ← Previous
        </button>
        <span className="text-sm font-medium text-gray-700">
          Page <b>{currentPage}</b> of <b>{pages}</b>
        </span>
        <button
          className="px-4 py-2 bg-white border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          disabled={currentPage === pages || isFetching}
          onClick={() => setPage((p) => p + 1)}
        >
          Next →
        </button>
      </div>
    </div>
  );
};

export default OrdersTable;
