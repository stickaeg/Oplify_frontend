import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";

const MainLayout = () => {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-4 bg-gray-100">
        <Outlet />
      </main>
    </div>
  );
};
export default MainLayout;
