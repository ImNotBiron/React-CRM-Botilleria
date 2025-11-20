import axiosClient from "./axiosClient";

export const proveedoresApi = {
  getAll: async () => {
    const res = await axiosClient.get("/proveedores");
    return res.data;
  },
};