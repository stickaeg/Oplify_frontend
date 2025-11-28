import { useQuery } from "@tanstack/react-query";
import { getTotalProductTypesSold } from "../api/adminsApi";

const ProductTypesSoldCards = ({ filters }) => {
  const { data, isLoading } = useQuery({
    queryKey: ["productTypesSold", filters],
    queryFn: () => getTotalProductTypesSold(filters),
  });

  if (isLoading) return <div>Loading...</div>;
  if (!data) return <div>No data</div>;

  const { totalsByProductType, totalQuantitySold, distinctProductTypesSold } =
    data;

  return (
    <div className="flex flex-col gap-4">
      {/* Summary Card */}
      <div className="p-4 bg-white rounded-lg shadow-md w-60 text-center">
        <h2 className="font-semibold text-lg">Totals</h2>

        <p className="text-gray-700">
          Total Quantity Sold:{" "}
          <span className="font-bold text-blue-600">{totalQuantitySold}</span>
        </p>

        <p className="text-gray-700">
          Distinct Types:{" "}
          <span className="font-bold text-blue-600">
            {distinctProductTypesSold}
          </span>
        </p>
      </div>

      {/* Product Types */}
      <div className="flex flex-wrap gap-4">
        {Object.entries(totalsByProductType).map(([type, count]) => (
          <div
            key={type}
            className="p-4 bg-white rounded-lg shadow-md w-52 text-center"
          >
            <h3 className="font-semibold text-gray-800">{type}</h3>
            <p className="text-gray-600 mt-2">
              Sold: <span className="font-bold text-blue-600">{count}</span>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductTypesSoldCards;
