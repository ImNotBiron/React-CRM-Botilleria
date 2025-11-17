import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Paper,
  TextField,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Chip,
  Snackbar,
  Alert,
} from "@mui/material";

import {
  IconPlus,
  IconPencil,
  IconUserOff,
  IconUserCheck,
} from "@tabler/icons-react";

import { usuariosApi } from "../../api/usuariosApi";


// =============================================
// Utilidad para formatear RUT visualmente
// =============================================
const formatRut = (rut: string) => {
  if (!rut) return "";
  rut = rut.replace(/\./g, "").replace(/-/g, "").toUpperCase();

  const cuerpo = rut.slice(0, -1);
  const dv = rut.slice(-1);

  const format = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${format}-${dv}`;
};

// =============================================
// Página
// =============================================
export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState([]);

  // Modal
  const [openModal, setOpenModal] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const [form, setForm] = useState({
    id: null,
    nombre_usuario: "",
    rut_usuario: "",
    tipo_usuario: "vendedor",
  });

  // Alertas visuales
  const [alerta, setAlerta] = useState({
    open: false,
    mensaje: "",
    tipo: "info",
  });

  const mostrarAlerta = (msg: string, tipo: any = "info") => {
    setAlerta({ open: true, mensaje: msg, tipo });
  };

  // =======================
  // Cargar usuarios
  // =======================
  const cargarUsuarios = async () => {
    const data = await usuariosApi.getAll();
    setUsuarios(data);
  };

  useEffect(() => {
    cargarUsuarios();
  }, []);

  // =======================
  // Abrir Modal Crear
  // =======================
  const handleOpenCrear = () => {
    setForm({
      id: null,
      nombre_usuario: "",
      rut_usuario: "",
      tipo_usuario: "vendedor",
    });
    setEditMode(false);
    setOpenModal(true);
  };

  // =======================
  // Abrir Modal Editar
  // =======================
  const handleOpenEditar = (u: any) => {
    setForm(u);
    setEditMode(true);
    setOpenModal(true);
  };

  const handleCloseModal = () => setOpenModal(false);

  // =======================
  // Guardar (crear o editar)
  // =======================
 const handleSave = async () => {
  if (!form.nombre_usuario.trim()) {
    mostrarAlerta("Debe ingresar el nombre.", "warning");
    return;
  }

  if (!form.rut_usuario.trim()) {
    mostrarAlerta("Debe ingresar el RUT.", "warning");
    return;
  }

  // Normalizar RUT
  const cleanRut = form.rut_usuario.replace(/[^\dkK]/g, "").toUpperCase();

  if (editMode) {
    if (!form.id) {
      console.error("❌ Error: form.id es null al actualizar.");
      return;
    }

    await usuariosApi.update(form.id as number, {
      ...form,
      rut_usuario: cleanRut,
    });

    mostrarAlerta("Usuario actualizado.", "success");
  } else {
    await usuariosApi.create({
      ...form,
      rut_usuario: cleanRut,
    });

    mostrarAlerta("Usuario creado.", "success");
  }

  handleCloseModal();
  cargarUsuarios();
};


  // =======================
  // Activar / Desactivar
  // =======================
  const toggleEstado = async (u: any) => {
    if (u.tipo_usuario === "admin") {
      mostrarAlerta("El usuario admin no puede ser desactivado.", "error");
      return;
    }

    await usuariosApi.toggleEstado(u.id, !u.activo);
    cargarUsuarios();

    mostrarAlerta(
      u.activo
        ? "Usuario desactivado."
        : "Usuario activado.",
      "info"
    );
  };

  // =======================
  // UI
  // =======================
  return (
  <Box 
    sx={{ 
      p: 0, 
      pt: 2, 
      flexGrow: 1, 
      width: "100%", 
      maxWidth: "100%" 
    }}
  >


      {/* Controles */}
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>
          Usuarios
        </Typography>

        <Button
          variant="contained"
          startIcon={<IconPlus size={18} />}
          onClick={handleOpenCrear}
          sx={{
            bgcolor: "#695cfe",
            borderRadius: "10px",
            textTransform: "none",
            fontWeight: 600,
            "&:hover": { bgcolor: "#5a4ee3" },
          }}
        >
          Crear usuario
        </Button>
      </Box>

      {/* TABLA */}
      <Paper sx={{ width: "100%", borderRadius: "16px", overflow: "hidden" }}>
        <Table sx={{ width: "100%", tableLayout: "fixed" }}>
          <TableHead
  sx={(theme) => ({
    bgcolor:
      theme.palette.mode === "dark"
        ? theme.palette.action.hover      // tono más oscuro en dark
        : theme.palette.action.selected,  // lila suave en light
  })}
>

            <TableRow>
              <TableCell><strong>Nombre</strong></TableCell>
              <TableCell><strong>RUT</strong></TableCell>
              <TableCell><strong>Tipo</strong></TableCell>
              <TableCell><strong>Estado</strong></TableCell>
              <TableCell><strong>Acciones</strong></TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {usuarios.map((u: any) => (
              <TableRow key={u.id}>
                <TableCell>{u.nombre_usuario}</TableCell>
                <TableCell>{formatRut(u.rut_usuario)}</TableCell>

                <TableCell>
                  <Chip
                    label={u.tipo_usuario}
                    color={u.tipo_usuario === "admin" ? "info" : "default"}
                    size="small"
                  />
                </TableCell>

                <TableCell>
                  <Chip
                    label={u.activo ? "Activo" : "Inactivo"}
                    color={u.activo ? "success" : "default"}
                    size="small"
                  />
                </TableCell>

                <TableCell>
                  <IconButton
                    color="primary"
                    onClick={() => handleOpenEditar(u)}
                    disabled={u.tipo_usuario === "admin"}
                  >
                    <IconPencil size={20} stroke={1.6} />
                  </IconButton>

                  <IconButton
                    color={u.activo ? "error" : "success"}
                    onClick={() => toggleEstado(u)}
                  >
                    {u.activo ? (
                      <IconUserOff size={20} />
                    ) : (
                      <IconUserCheck size={20} />
                    )}
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}

            {!usuarios.length && (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <Typography color="text.secondary">
                    No hay usuarios registrados.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>

      {/* MODAL */}
      <Dialog open={openModal} onClose={handleCloseModal} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editMode ? "Editar usuario" : "Crear usuario"}
        </DialogTitle>

        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            
            <TextField
              label="Nombre"
              fullWidth
              value={form.nombre_usuario}
              onChange={(e) =>
                setForm({ ...form, nombre_usuario: e.target.value })
              }
            />

            <TextField
              label="RUT"
              fullWidth
              value={form.rut_usuario}
              onChange={(e) =>
                setForm({ ...form, rut_usuario: e.target.value })
              }
            />

            <TextField
              label="Tipo de usuario"
              fullWidth
              value={form.tipo_usuario}
              disabled
              helperText="Solo se pueden crear vendedores desde esta sección."
            />
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCloseModal}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            sx={{ bgcolor: "#695cfe", "&:hover": { bgcolor: "#5a4ee3" } }}
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      {/* ALERTA */}
      <Snackbar
        open={alerta.open}
        autoHideDuration={3000}
        onClose={() => setAlerta({ ...alerta, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          severity={alerta.tipo as any}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {alerta.mensaje}
        </Alert>
      </Snackbar>

    </Box>
  );
}
