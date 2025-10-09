import { useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom"; // <--- import
import { getOrders } from "../api/agentsApi";
import Table from "./Table";
import Spinner from "./Loading";

const OrdersTable = () => {
  const [page, setPage] = useState(1);
  const limit = 10;
  const navigate = useNavigate(); //

  const { data, isLoading, isError } = useQuery({
    queryKey: ["orders", page, limit],
    queryFn: () => getOrders({ page, limit }),
  });

  if (isLoading) return <Spinner />;
  if (isError) return <p>Failed to load orders</p>;

  const { data: orders, page: currentPage, pages } = data;

  const handleRowClick = (orderId) => {
    navigate(`/orders/${orderId}`); // Redirect to order details page
  };

  return (
    <div className="space-y-4 relative">
      <h2 className="text-xl font-bold">Orders</h2>

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
              onClick={() => handleRowClick(order.id)} // entire row clickable
            >
              <Table.Cell>#{order.orderNumber}</Table.Cell>
              <Table.Cell>{order.store?.name || "—"}</Table.Cell>
              <Table.Cell>EGP {order.totalPrice?.toFixed(2) || 0}</Table.Cell>
              <Table.Cell>{order.status || "-"}</Table.Cell>
              <Table.Cell>
                {new Date(order.createdAt).toLocaleString()}
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>

      {/* Pagination controls */}
      <div className="flex items-center justify-center gap-4">
        <button
          className="px-4 py-2 bg-white border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-wh ite disabled:hover:border-gray-300 transition-colors cursor-pointer"
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
          className="px-4 py-2 bg-white border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-300 transition-colors cursor-pointer"
          disabled={currentPage === pages}
          onClick={() => setPage((p) => p + 1)}
        >
          Next →
        </button>
      </div>
    </div>
  );
};

export default OrdersTable;
