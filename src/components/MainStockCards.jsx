import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { listMainStock } from "../api/adminsApi";
import { useAuth } from "../context/AuthContext";
import MainStockProducts from "./MainStockProducts"; // new component

const MainStockCards = ({ filters }) => {
  const [selectedMainStockId, setSelectedMainStockId] = useState(null);
  const { data, isLoading } = useQuery({
    queryKey: ["mainStock", filters],
    queryFn: () => listMainStock(filters),
  });

  const { user } = useAuth();

  if (isLoading) return <div>Loading main stock...</div>;
  if (!data || data.length === 0) return <div>No main stock available</div>;

  const totalMainStocks = data.length;

  const handleOpenMainStock = (id) => setSelectedMainStockId(id);

  return (
    <div className="flex flex-col gap-4 pb-8">
      {/* Summary Card */}
      <div className="p-4 bg-white rounded-lg shadow-md w-60 text-center">
        <h2 className="font-semibold text-lg">Stock Totals</h2>
        <p className="text-gray-700">
          Stock items:{" "}
          <span className="font-bold text-green-600">{totalMainStocks}</span>
        </p>
      </div>

      {/* Main Stock Cards */}
      <div className="flex flex-wrap gap-4">
        {data.map((stock) => (
          <div
            key={stock.id}
            className="p-4 bg-white rounded-md shadow-md w-64 text-center hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => handleOpenMainStock(stock.id)}
          >
            <h3 className="font-semibold text-xl text-gray-800 truncate">
              {stock.name}
            </h3>
            <p className="text-2xl font-bold text-green-600 mt-2">
              {stock.quantity}
            </p>
            <p className="text-sm text-gray-500 mt-1">Available</p>

            {user.role !== "USER" && stock.rules.length > 0 && (
              <div className="mt-3 p-2 bg-gray-50 rounded">
                <p className="text-xs text-gray-600 mb-1">
                  Rules ({stock.rules.length})
                </p>
                <div className="max-h-20 overflow-y-auto">
                  {stock.rules.map((rule) => (
                    <div
                      key={rule.id}
                      className="text-xs text-gray-700 truncate flex items-center justify-between"
                    >
                      <span>
                        • {rule.name}
                        {rule.variantTitle ? ` - ${rule.variantTitle}` : ""}
                      </span>
                      <span className="text-xs text-blue-600 bg-blue-50 px-1 py-0.5 rounded ml-2">
                        {rule.store.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Products table */}
      {selectedMainStockId && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-2">Products in this Stock</h2>
          <MainStockProducts mainStockId={selectedMainStockId} />
        </div>
      )}
    </div>
  );
};

export default MainStockCards;
