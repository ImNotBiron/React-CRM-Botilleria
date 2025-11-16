import axiosClient from "./axiosClient";

const base = "/ventas";

export const ventasApi = {
  create: async (venta: any) => {
    const res = await axiosClient.post(base, venta);
    return res.data;
  },
};
