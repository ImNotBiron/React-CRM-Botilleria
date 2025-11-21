import axiosClient from "./axiosClient";

export const cajaApi = {
  getEstado: async () => {
    const res = await axiosClient.get("/caja/estado");
    return res.data;
  },

  abrir: async (monto_inicial: number, id_usuario: number) => {
    const res = await axiosClient.post("/caja/abrir", { monto_inicial, id_usuario });
    return res.data;
  },

  cerrar: async (payload: any) => {
    const res = await axiosClient.post("/caja/cerrar", payload);
    return res.data;
  },

  // Registrar Ingreso/Egreso
  registrarMovimiento: async (data: {
      id_caja: number;
      tipo: 'INGRESO' | 'EGRESO';
      monto: number;
      comentario: string;
      id_usuario: number;
  }) => {
      const res = await axiosClient.post("/caja/movimiento", data);
      return res.data;
  }
};