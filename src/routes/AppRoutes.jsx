import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import ProtectedRoute from "../routes/ProtectedRoute";
import MainLayout from "../layout/MainLayout";
import Spinner from "../components/Loading"; // 👈 A simple loading indicator
import BatchesDetail from "../pages/BatchesDetail";
import PrinterScanner from "../pages/PrinterScanner";
import CutterScanner from "../pages/CutterScanner";
import FulfillmentScanner from "../pages/FulfillmentScanner";

// 🧩 Lazy-loaded pages
const LoginPage = lazy(() => import("../pages/LoginPage"));
const Dashboard = lazy(() => import("../pages/Dashboard"));
const Products = lazy(() => import("../pages/Products"));
const Orders = lazy(() => import("../pages/Orders"));
const Batches = lazy(() => import("../pages/Batches"));
const OrderDetail = lazy(() => import("../pages/OrderDetail"));
const UserInfo = lazy(() => import("../pages/UserInfo"));

const AppRoutes = () => {
  return (
    <Router>
      {/* Suspense will show the fallback (spinner) while the page is loading */}
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-screen">
            <Spinner />
          </div>
        }
      >
        <Routes>
          {/* Public route */}
          <Route path="/" element={<LoginPage />} />

          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/products" element={<Products />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/batches" element={<Batches />} />
              <Route path="/batches/:batchId" element={<BatchesDetail />} />
              <Route path="/scan/printer" element={<PrinterScanner />} />
              <Route path="/scan/cutter" element={<CutterScanner />} />
              <Route
                path="/scan/fulfillment"
                element={<FulfillmentScanner />}
              />
              <Route path="/orders/:id" element={<OrderDetail />} />
              <Route path="/me" element={<UserInfo />} />
            </Route>
          </Route>
        </Routes>
      </Suspense>
    </Router>
  );
};

export default AppRoutes;
