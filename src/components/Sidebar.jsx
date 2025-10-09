import { useState } from "react";
import {
  FiMenu,
  FiHome,
  FiUsers,
  FiShoppingBag,
  FiLayers,
  FiArchive,
} from "react-icons/fi";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Role-based menu configuration
const menuByRole = {
  admin: [
    { name: "dashboard", path: "/dashboard", icon: <FiHome /> },
    { name: "Products", path: "/products", icon: <FiUsers /> },
    { name: "Orders", path: "/orders", icon: <FiShoppingBag /> },
    { name: "Batches", path: "/batches", icon: <FiArchive /> },
  ],

  designer: [
    { name: "Batches", path: "/batches", icon: <FiLayers /> },
    { name: "Orders", path: "/orders", icon: <FiHome /> },
  ],
  printer: [
    { name: "Batches", path: "/batches", icon: <FiLayers /> },
    { name: "Orders", path: "/orders", icon: <FiHome /> },
  ],
  cutter: [
    { name: "Batches", path: "/batches", icon: <FiLayers /> },
    { name: "Orders", path: "/orders", icon: <FiHome /> },
  ],
};

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, isLoading } = useAuth();

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

  return (
    <aside
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
      className={`bg-gray-300 min-h-screen transition-all duration-300 shadow-2xl z-10 
        ${isOpen ? "w-64" : "w-16"} flex flex-col`}
    >
      <div className="py-4 px-4">
        <button
          onClick={() => setIsOpen((prev) => !prev)}
          className="relative w-full h-12 flex items-center"
        >
          <div
            className={`absolute inset-0 flex items-center transition-all duration-500 ${
              isOpen ? "opacity-100 scale-100 " : "opacity-0 scale-75 "
            }`}
          >
            <h1 className="font-bold text-zinc-800 uppercase text-2xl">
              Opify
            </h1>
          </div>

          <div
            className={`absolute inset-0 flex items-center justify-start transition-all duration-500 ${
              !isOpen ? "opacity-100 scale-100 " : "opacity-0 scale-75 "
            }`}
          >
            <FiMenu className="text-gray-800" size={24} />
          </div>
        </button>
      </div>

      <nav className="flex-1 flex flex-col gap-2 mt-2">
        {items.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2 rounded-md transition-colors capitalize
               ${isActive ? "bg-gray-400 " : "text-gray-800 hover:bg-gray-400"}`
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
    </aside>
  );
};

export default Sidebar;
