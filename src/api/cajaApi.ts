import axiosClient from "./axiosClient";

export const cajaApi = {
  // Consultar si está abierta o cerrada
  getEstado: async () => {
    const res = await axiosClient.get("/caja/estado");
    return res.data;
  },

  // Abrir turno
  abrir: async (monto_inicial: number, id_usuario: number) => {
    const res = await axiosClient.post("/caja/abrir", { 
        monto_inicial, 
        id_usuario 
    });
    return res.data;
  },

  // Cerrar turno (Arqueo)
  cerrar: async (payload: { 
      id_caja: number; 
      monto_final_real: number; 
      totales_sistema: any; 
  }) => {
    const res = await axiosClient.post("/caja/cerrar", payload);
    return res.data;
  }
};