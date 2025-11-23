import axiosClient from "./axiosClient";

const base = "/ventas";

export const ventasApi = {
  create: async (venta: any) => {
    const res = await axiosClient.post(base, venta);
    return res.data;
  },

  getAll: async (fechaInicio?: string, fechaFin?: string) => {
    const res = await axiosClient.get(base, {
      params: { fechaInicio, fechaFin }
    });
    return res.data;
  },


  getResumenVendedores: async () => {
      const res = await axiosClient.get(`${base}/dashboard-vendedores`);
      return res.data;
  },

  getById: async (id: number) => {
      const res = await axiosClient.get(`${base}/${id}`);
      return res.data;
  },
  
  getPorBoletear: async () => {
      const res = await axiosClient.get(`${base}/pendientes/boletear`);
      return res.data;
  },

  marcarBoleteado: async (id_venta: number) => {
      const res = await axiosClient.post(`${base}/marcar-boleteado`, { id_venta });
      return res.data;
  }
};