import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listRules, deleteRule } from "../api/adminsApi";
import Table from "./Table";

const RulesTable = () => {
  const queryClient = useQueryClient();

  // Fetch rules
  const { data: rulesResponse, isLoading } = useQuery({
    queryKey: ["rules"],
    queryFn: listRules,
  });
  console.log(rulesResponse);
  const rules = Array.isArray(rulesResponse)
    ? rulesResponse
    : rulesResponse?.data || [];

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteRule,
    onSuccess: () => {
      queryClient.invalidateQueries(["rules"]);
    },
  });

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this rule?")) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) return <p>Loading...</p>;

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Rules</h2>

      <Table>
        <Table.Head>
          <Table.HeaderCell>Rule Name</Table.HeaderCell>
          <Table.HeaderCell>Store Name</Table.HeaderCell>
          <Table.HeaderCell>Rule Type</Table.HeaderCell>
          <Table.HeaderCell>Actions</Table.HeaderCell>
        </Table.Head>
        <Table.Body>
          {rules.map((rule) => (
            <Table.Row key={rule.id}>
              <Table.Cell>{rule.name}</Table.Cell>
              <Table.Cell>{rule.store?.name}</Table.Cell>
              <Table.Cell>{rule.isPod ? "POD" : "Stock"}</Table.Cell>
              <Table.Cell>
                <button
                  onClick={() => handleDelete(rule.id)}
                  className="px-2 py-1 text-white bg-red-600 rounded hover:bg-red-700"
                >
                  Delete
                </button>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    </div>
  );
};

export default RulesTable;
