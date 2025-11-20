import axiosClient from "./axiosClient";

export const categoriasApi = {
  getAll: async () => {
    const res = await axiosClient.get("/categorias");
    return res.data;
  },
};