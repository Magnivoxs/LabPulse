import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./style.css";
import "./styles/tables.css";
import AppLayout from "@/pages/_layout/AppLayout";
import Dashboard from "@/pages/dashboard/Dashboard";
import DevStorageTest from "./pages/dev-storage-test";
import ErrorBoundary from "@/components/ErrorBoundary";

const router = createBrowserRouter([
  {
    element: <AppLayout />,
    errorElement: <div style={{padding:16}}>Route error. Check path or component.</div>,
    children: [
      { path: "/", element: <Dashboard /> },
      { path: "/dev-storage-test", element: <DevStorageTest /> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <RouterProvider router={router} />
    </ErrorBoundary>
  </React.StrictMode>
);

