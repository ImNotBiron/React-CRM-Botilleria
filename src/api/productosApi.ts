import axiosClient from "./axiosClient";

const base = "/productos";

export const productosApi = {
  // Obtener todos los productos
  getAll: async () => {
    const res = await axiosClient.get(base);
    return res.data;
  },

  // Obtener un producto por ID
  getById: async (id: number) => {
    const res = await axiosClient.get(`${base}/${id}`);
    return res.data;
  },

  // Obtener por código de barras
  getByCodigo: async (codigo: string) => {
    const res = await axiosClient.get(`${base}/codigo/${codigo}`);
    return res.data;
  },

  // Crear producto
  create: async (producto: any) => {
    const res = await axiosClient.post(base, producto);
    return res.data;
  },

  // Actualizar producto
  update: async (id: number, producto: any) => {
    const res = await axiosClient.put(`${base}/${id}`, producto);
    return res.data;
  },

  // Eliminar producto
  remove: async (id: number) => {
    const res = await axiosClient.delete(`${base}/${id}`);
    return res.data;
  },
};
