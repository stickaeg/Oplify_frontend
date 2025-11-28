import { useQuery } from "@tanstack/react-query";
import { getTotalOrders } from "../api/adminsApi";

const OrdersCard = ({ filters }) => {
  const { data, isLoading } = useQuery({
    queryKey: ["orders", filters],
    queryFn: () => getTotalOrders(filters),
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="p-4 flex flex-col gap-2 self-start items-center bg-white rounded-lg shadow-md w-60">
      <span className="font-semibold text-lg">Total Fulfilled Orders</span>

      <span className="text-gray-700">Fulfilled Orders:</span>

      <span className="text-3xl font-bold text-blue-600">
        {data.totalOrders}
      </span>
    </div>
  );
};

export default OrdersCard;
