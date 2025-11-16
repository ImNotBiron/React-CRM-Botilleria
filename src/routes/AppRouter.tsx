import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

import Layout from "../components/layout/Layout";               // Admin layout
import VendedorLayout from "../components/layout/VendedorLayout"; // Nuevo layout para vendedor

import DashboardPage from "../pages/dashboard/DashboardPage";
import ProductosPage from "../pages/productos/ProductosPage";
import VentasPage from "../pages/ventas/VentasPage";
import CarritoPage from "../pages/carrito/CarritoPage";

import LoginPage from "../pages/auth/LoginPage";

export default function AppRouter() {
  const user = useAuthStore((state) => state.user);
  const isLoggedIn = user !== null;

  console.log("Router detecta usuario:", user);
  console.log("isLoggedIn:", isLoggedIn);

  return (
    <BrowserRouter>
      <Routes>

        {/* 🔐 RUTAS CUANDO NO HAY SESIÓN */}
        {!isLoggedIn && (
          <>
            <Route path="/login" element={<LoginPage />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </>
        )}

        {/* 🔐 RUTAS CUANDO SÍ HAY SESIÓN */}
        {isLoggedIn && (
          <>
            {/* 🟦 RUTAS PARA ADMIN */}
            {user.tipo_usuario === "admin" && (
              <Route element={<Layout />}>
                <Route index element={<DashboardPage />} />
                <Route path="productos" element={<ProductosPage />} />
                <Route path="ventas" element={<VentasPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            )}

            {/* 🟩 RUTAS PARA VENDEDOR */}
            {user.tipo_usuario === "vendedor" && (
              <Route element={<VendedorLayout />}>
                <Route path="/carrito" element={<CarritoPage />} />
                <Route path="*" element={<Navigate to="/carrito" replace />} />
              </Route>
            )}
          </>
        )}

      </Routes>
    </BrowserRouter>
  );
}


