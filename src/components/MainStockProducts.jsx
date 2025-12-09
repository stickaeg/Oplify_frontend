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

  // Fetch product quantities
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["mainStockProducts", mainStockId],
    queryFn: () => getProductsByMainStock(mainStockId),
  });

  // Initialize quantities when products data changes
  useEffect(() => {
    if (products && products.length > 0) {
      const initial = {};
      products.forEach((item) => {
        initial[item.sku] = item.totalQuantity || 0;
      });
      setQuantities(initial);
    }
  }, [products]);

  console.log(products);

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
  if (!products || products.length === 0)
    return <div>No products assigned yet.</div>;

  return (
    <Table>
      <Table.Head>
        <Table.HeaderCell>SKU</Table.HeaderCell>
        <Table.HeaderCell>Title</Table.HeaderCell>
        <Table.HeaderCell>Quantity</Table.HeaderCell>
        <Table.HeaderCell>Actions</Table.HeaderCell>
      </Table.Head>
      <Table.Body>
        {products.map((item) => (
          <Table.Row key={item.sku}>
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
  );
};

export default MainStockProducts;
