import MainStockCards from "../components/MainStockCards";
import StockItemsList from "../components/StockItemsList";
import { useAuth } from "../context/AuthContext";

const Stock = () => {
  const { user } = useAuth();
  return (
    <div className="p-6">
      <h2 className="text-xl font-bold pb-6 capitalize">stock</h2>{" "}
      <MainStockCards />
      {user.role !== "USER" && <StockItemsList />}
    </div>
  );
};
export default Stock;
