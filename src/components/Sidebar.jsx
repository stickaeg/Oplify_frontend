import { useState } from "react";
import {
  FiMenu,
  FiHome,
  FiUsers,
  FiShoppingBag,
  FiLayers,
  FiArchive,
  FiCommand,
  FiLogOut,
  FiDatabase,
} from "react-icons/fi";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Role-based menu configuration
const menuByRole = {
  admin: [
    { name: "dashboard", path: "/dashboard", icon: <FiHome /> },
    { name: "Stock", path: "/stock", icon: <FiDatabase /> },
    { name: "Returns", path: "/returns", icon: <FiDatabase /> },
    { name: "Products", path: "/products", icon: <FiUsers /> },
    { name: "Orders", path: "/orders", icon: <FiShoppingBag /> },
    { name: "Batches", path: "/batches", icon: <FiArchive /> },
    { name: "Scanner", path: "/fulfillment", icon: <FiCommand /> },
  ],
  designer: [
    { name: "Batches", path: "/batches", icon: <FiLayers /> },
    { name: "Orders", path: "/orders", icon: <FiShoppingBag /> },
  ],
  printer: [
    { name: "Batches", path: "/batches", icon: <FiLayers /> },
    { name: "Orders", path: "/orders", icon: <FiShoppingBag /> },
  ],
  cutter: [
    { name: "Batches", path: "/batches", icon: <FiLayers /> },
    { name: "Orders", path: "/orders", icon: <FiShoppingBag /> },
  ],
  fullfillment: [
    { name: "Batches", path: "/batches", icon: <FiLayers /> },
    { name: "Orders", path: "/orders", icon: <FiShoppingBag /> },
    { name: "Scanner", path: "/fulfillment", icon: <FiCommand /> },
  ],
  user: [
    { name: "Dashboard", path: "/dashboard", icon: <FiHome /> },
    { name: "Stock", path: "/stock", icon: <FiDatabase /> },
    { name: "Returns", path: "/returns", icon: <FiDatabase /> },
    { name: "Orders", path: "/orders", icon: <FiShoppingBag /> },
    { name: "Products", path: "/products", icon: <FiUsers /> },
  ],
};

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, isLoading, logout } = useAuth();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <aside className="bg-gray-300 min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </aside>
    );
  }

  if (!user) {
    return (
      <aside className="bg-gray-300 min-h-screen flex items-center justify-center">
        <p>No user</p>
      </aside>
    );
  }

  const items = menuByRole[user.role?.toLowerCase()] || [];

  const handleLogout = () => {
    logout?.();
    navigate("/");
  };

  return (
    <aside
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
      className={`fixed bg-gray-300 min-h-screen transition-all duration-300 shadow-2xl z-10 
        ${isOpen ? "w-64" : "w-16"} flex flex-col`}
    >
      <div className="py-4 px-4">
        <button
          onClick={() => setIsOpen((prev) => !prev)}
          className="relative w-full h-12 flex items-center"
        >
          <div
            className={`absolute inset-0 flex justify-between items-center transition-all duration-500 ${
              isOpen ? "opacity-100 scale-100" : "opacity-0 scale-75"
            }`}
          >
            <h1 className="font-bold text-zinc-800 uppercase text-2xl self-start">
              Opify
            </h1>
            <div className="ps-2">
              <p className="font-medium capitalize text-blue-500">
                {user.name}
              </p>
              <p className="font-medium capitalize text-gray-500">
                {user.role.toLowerCase()}
              </p>
            </div>
          </div>

          <div
            className={`absolute inset-0 flex items-center justify-start transition-all duration-500 ${
              !isOpen ? "opacity-100 scale-100" : "opacity-0 scale-75"
            }`}
          >
            <FiMenu className="text-gray-800" size={24} />
          </div>
        </button>
      </div>

      <nav className="flex-1 flex flex-col gap-2 mt-5">
        {items.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2 rounded-md transition-colors capitalize
               ${isActive ? "bg-gray-400" : "text-gray-800 hover:bg-gray-400"}`
            }
          >
            <span className="flex-shrink-0 text-xl">{item.icon}</span>
            <span
              className={`whitespace-nowrap transition-opacity duration-300 ${
                isOpen ? "opacity-100" : "opacity-0"
              }`}
            >
              {item.name}
            </span>
          </NavLink>
        ))}
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-gray-400">
        <button
          onClick={handleLogout}
          className="w-full cursor-pointer flex items-center gap-3 px-3 py-2 text-gray-800 hover:bg-gray-400 rounded-md transition-all"
        >
          <FiLogOut className="flex-shrink-0 text-xl" />
          <span
            className={`whitespace-nowrap transition-opacity duration-300 ${
              isOpen ? "opacity-100" : "opacity-0"
            }`}
          >
            Logout
          </span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
