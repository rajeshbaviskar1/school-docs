import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import SchoolLogin from "./components/SchoolLogin/SchoolLogin";
import SchoolRegister from "./components/SchoolLogin/SchoolRegister/SchoolRegister";
import Dashboard from "./components/Dashboard/Dashboard";
import ResetPassword from "./components/ResetPassword/ResetPassword";
import PrincipalDashboard from "./components/Principal/PrincipalDashboard";

function App() {

  // 🔐 Protected Route (any logged-in user)
  const ProtectedRoute = ({ children }) => {
    const schoolName = localStorage.getItem("schoolName");
    if (!schoolName) return <Navigate to="/" replace />;
    return children;
  };

  // 🔐 Principal-only Route
  const PrincipalRoute = ({ children }) => {
    const schoolName = localStorage.getItem("schoolName");
    const role = (localStorage.getItem("role") || "").trim().toUpperCase();

if (!schoolName) return <Navigate to="/" replace />;
if (role !== "PRINCIPAL") return <Navigate to="/dashboard" replace />;

    return children;
  };

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<SchoolLogin />} />
      <Route path="/register" element={<SchoolRegister />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Clerk / normal dashboard */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      {/* Principal dashboard */}
      <Route
        path="/principal-dashboard"
        element={
          <PrincipalRoute>
            
            <PrincipalDashboard />
          </PrincipalRoute>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
