import axiosClient from "./axiosClient";

export const authApi = {
  login: async (rut: string) => {
    const response = await axiosClient.post("/auth/login", { rut });
    return response.data;
  },
};
