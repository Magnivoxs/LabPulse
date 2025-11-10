import React from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./style.css";
import AppLayout from "@/pages/_layout/AppLayout";
import App from "./App";
import DevStorageTest from "./pages/dev-storage-test";

const router = createBrowserRouter([
  { 
    element: <AppLayout />, 
    children: [
      { path: "/", element: <App /> },
      { path: "/dev-storage-test", element: <DevStorageTest /> },
    ]
  },
]);

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);

