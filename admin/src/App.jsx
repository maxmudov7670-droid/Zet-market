import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./components/Sidebar.jsx";
import Orders from "./pages/Orders.jsx";
import Products from "./pages/Products.jsx";
import Stories from "./pages/Stories.jsx";
import Login from "./pages/Login.jsx";

function RequireAuth({ children }) {
  const hasPassword = Boolean(localStorage.getItem("admin_password"));
  if (!hasPassword) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/*"
        element={
          <RequireAuth>
            <div className="flex min-h-screen bg-gray-50">
              <Sidebar />
              <main className="flex-1 p-8">
                <Routes>
                  <Route path="/" element={<Navigate to="/orders" replace />} />
                  <Route path="/orders" element={<Orders />} />
                  <Route path="/products" element={<Products />} />
                  <Route path="/stories" element={<Stories />} />
                  <Route path="*" element={<Navigate to="/orders" replace />} />
                </Routes>
              </main>
            </div>
          </RequireAuth>
        }
      />
    </Routes>
  );
}
