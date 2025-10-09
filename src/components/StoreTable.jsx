import { useQuery, useQueryClient } from "@tanstack/react-query";
import Table from "./Table";
import { getStores } from "../api/agentsApi";

const StoreTable = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["stores"],
    queryFn: getStores,
  });

  const stores = data?.data || [];

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Stores</h2>
      <Table>
        <Table.Head>
          <Table.HeaderCell>Name</Table.HeaderCell>
          <Table.HeaderCell>Domain</Table.HeaderCell>
        </Table.Head>
        <Table.Body>
          {stores.map((data) => (
            <Table.Row key={data.id}>
              <Table.Cell>{data.name}</Table.Cell>
              <Table.Cell>{data.shopDomain}</Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    </div>
  );
};
export default StoreTable;
