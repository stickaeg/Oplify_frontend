import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createStore } from "../api/adminsApi";

const CreateStore = ({ onClose }) => {
  const [formData, setFormData] = useState({
    shopDomain: "",
    name: "",
    accessToken: "",
    apiSecret: "",
  });
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: createStore,
    onSuccess: () => {
      if (onClose) onClose();
      queryClient.invalidateQueries({ queryKey: ["stores"] });
    },
    onError: (error) => {
      console.error("Error creating store:", error);
    },
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate(formData); // send form data
  };

  return (
    <div className="w-96">
      <h2 className="text-xl font-semibold mb-4">Create Store</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Shop Domain */}
        <div>
          <label
            htmlFor="shopDomain"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Shop Domain
          </label>
          <input
            type="text"
            id="shopDomain"
            name="shopDomain"
            value={formData.shopDomain}
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
            placeholder="example.myshopify.com"
            required
          />
        </div>

        {/* Store Name */}
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Store Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
            placeholder="My Store"
            required
          />
        </div>

        {/* Access Token */}
        <div>
          <label
            htmlFor="accessToken"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Access Token
          </label>
          <input
            type="password"
            id="accessToken"
            name="accessToken"
            value={formData.accessToken}
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
            placeholder="Enter access token"
            required
          />
        </div>
        {/* Access Token */}

        <div>
          <label
            htmlFor="apiSecret"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            API Secret
          </label>
          <input
            type="password"
            id="apiSecret"
            name="apiSecret"
            value={formData.apiSecret}
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
            placeholder="Enter API secret"
            required
          />
        </div>

        {/* Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="px-5 py-2 rounded-lg bg-blue-600 text-white shadow-md hover:bg-blue-700 transition disabled:opacity-70"
          >
            {mutation.isPending ? "Creating..." : "Create"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateStore;
