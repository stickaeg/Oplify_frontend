import { useQuery } from "@tanstack/react-query";
import { getMe } from "../api/authApi";

export default function UserInfo() {
  const { data, isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: getMe,
  });

  if (isLoading) return <p>Loading...</p>;
  if (!data) return <p>Not logged in</p>;

  return (
    <div className="p-4 bg-white rounded shadow">
      <h3 className="text-lg font-bold">Logged in as:</h3>
      <p>ID: {data.data.id}</p>
      <p>Name: {data.data.name}</p>
      <p>Role: {data.data.role}</p>
    </div>
  );
}
