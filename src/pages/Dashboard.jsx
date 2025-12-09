import { useState } from "react";
import StoreTable from "../components/StoreTable";
import RulesTable from "../components/RulesTable";
import CreateStore from "../components/CreateStore";
import CreateRule from "../components/CreateRule";
import CreateBatch from "../components/CreateBatch";
import OrdersCard from "../components/OrdersCard";
import ProductTypesSoldCards from "./ProductTypesSoldCards";
import { getStores } from "../api/agentsApi";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import CreateMainStock from "../components/createMainStock";

const Dashboard = () => {
  const [isStoreOpen, setIsStoreOpen] = useState(false);
  const [isRuleOpen, setIsRuleOpen] = useState(false);
  const [isBatchOpen, setIsBatchOpen] = useState(false);
  const [isMainStockOpen, setIsMainStockOpen] = useState(false);

  const { user } = useAuth();

  const [filters, setFilters] = useState({
    storeId: "",
    startDate: "",
    endDate: "",
  });

  const { data: stores = [], isLoading: storesLoading } = useQuery({
    queryKey: ["stores"],
    queryFn: getStores,
  });

  if (storesLoading) return <div>Loading...</div>;

  return (
    <div className="p-4 space-y-4">
      {/* Buttons */}
      <div className="flex flex-col gap-4 p-4 ">
        {/* 🔵 Shared Filters for ALL components */}
        <div className="flex gap-4 bg-white p-4 rounded-lg shadow-md">
          {user.role != "USER" && (
            <select
              className="border p-2 rounded border-gray-300"
              value={filters.storeId}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, storeId: e.target.value }))
              }
            >
              <option value="">All Stores</option>
              {stores.data?.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.name}
                </option>
              ))}
            </select>
          )}

          {/* Date From */}
          <input
            type="date"
            className="border p-2 rounded border-gray-300"
            value={filters.startDate}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, startDate: e.target.value }))
            }
          />

          {/* Date To */}
          <input
            type="date"
            className="border p-2 rounded border-gray-300"
            value={filters.endDate}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, endDate: e.target.value }))
            }
          />
        </div>

        {/* Content */}
        <div className="flex justify-between gap-2">
          <ProductTypesSoldCards filters={filters} />
          <OrdersCard filters={filters} />
        </div>
      </div>

      {user.role !== "USER" && (
        <>
          <div className="flex gap-2 flex-wrap px-6">
            <button
              onClick={() => setIsStoreOpen(true)}
              className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
            >
              + Create Store
            </button>

            <button
              onClick={() => setIsRuleOpen(true)}
              className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
            >
              + Create Rule
            </button>

            <button
              onClick={() => setIsBatchOpen(true)}
              className="px-4 py-2 rounded bg-purple-600 text-white hover:bg-purple-700"
            >
              + Create Batch
            </button>
            <button
              onClick={() => setIsMainStockOpen(true)}
              className="px-4 py-2 rounded bg-orange-600 text-white hover:bg-orange-700"
            >
              + Create Main Stock
            </button>
          </div>
          {/* Tables */}
          <StoreTable />
          <RulesTable />
          {/* Create Store Modal */}
          {isStoreOpen && (
            <div className="fixed inset-0 flex items-center justify-center bg-black/20 z-50">
              <div className="bg-white rounded-lg p-6 shadow-lg">
                <CreateStore onClose={() => setIsStoreOpen(false)} />
              </div>
            </div>
          )}
          {/* Create Rule Modal */}
          {isRuleOpen && (
            <div className="fixed inset-0 flex items-center justify-center bg-black/20 z-50">
              <div className="bg-white rounded-lg p-6 shadow-lg">
                <CreateRule onClose={() => setIsRuleOpen(false)} />
              </div>
            </div>
          )}
          {/* ✅ Create Batch Modal */}
          {isBatchOpen && (
            <div className="fixed inset-0 flex items-center justify-center bg-black/20 z-50">
              <div className="bg-white rounded-lg p-6 shadow-lg">
                <CreateBatch onClose={() => setIsBatchOpen(false)} />
              </div>
            </div>
          )}
          {isMainStockOpen && (
            <div className="fixed inset-0 flex items-center justify-center bg-black/20 z-50">
              <div className="bg-white rounded-lg p-6 shadow-lg">
                <CreateMainStock onClose={() => setIsMainStockOpen(false)} />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Dashboard;
