import axiosClient from "./axiosClient";

const base = "/usuarios";

export const usuariosApi = {
  
  // =============================
  // Obtener todos los usuarios
  // =============================
  getAll: async () => {
    const res = await axiosClient.get(base);
    return res.data;
  },

  // =============================
  // Crear usuario (solo vendedor)
  // =============================
  create: async (usuario: {
    nombre_usuario: string;
    rut_usuario: string;
    tipo_usuario: string; // "vendedor"
  }) => {
    const res = await axiosClient.post(base, usuario);
    return res.data;
  },

  // =============================
  // Actualizar datos del usuario
  // =============================
  update: async (id: number, usuario: any) => {
    const res = await axiosClient.put(`${base}/${id}`, usuario);
    return res.data;
  },

  // =============================
  // Activar / Desactivar usuario
  // =============================
  toggleEstado: async (id: number, nuevoEstado: boolean) => {
    const res = await axiosClient.patch(`${base}/${id}/estado`, {
      activo: nuevoEstado ? 1 : 0,
    });
    return res.data;
  },

  // =============================
  // Obtener 1 usuario
  // =============================
  getById: async (id: number) => {
    const res = await axiosClient.get(`${base}/${id}`);
    return res.data;
  },

};
