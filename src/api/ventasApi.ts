import axiosClient from "./axiosClient";

const base = "/ventas";

export const ventasApi = {
  // Crear nueva venta (POS)
  create: async (venta: any) => {
    const res = await axiosClient.post(base, venta);
    return res.data;
  },

  // ✅ NUEVO: Obtener historial de ventas (Dashboard y Reportes)
  // Permite filtrar opcionalmente por fecha de inicio y fin
  getAll: async (fechaInicio?: string, fechaFin?: string) => {
    const res = await axiosClient.get(base, {
      params: { fechaInicio, fechaFin }
    });
    return res.data;
  }
};