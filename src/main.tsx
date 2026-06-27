import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Layout from "./app/Layout";
import ProtectedRoute from "./app/ProtectedRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import VerifyEmail from "./pages/VerifyEmail";
import OrganizationSetup from "./pages/OrganizationSetup";
import Dashboard from "./pages/Dashboard";
import Estimation from "./pages/Estimation";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import Sprints from "./pages/Sprints";
import Analytics from "./pages/Analytics";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import UsersPage from "./pages/Users";
import "./styles/index.css";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route
            path="/setup-organization"
            element={
              <ProtectedRoute>
                <OrganizationSetup />
              </ProtectedRoute>
            }
          />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="estimation" element={<Estimation />} />
            <Route path="projects" element={<Projects />} />
            <Route path="projects/:id" element={<ProjectDetail />} />
            <Route path="sprints" element={<Sprints />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="reports" element={<Reports />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
);
