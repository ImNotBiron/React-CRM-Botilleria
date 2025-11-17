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
  InputAdornment,
  Switch,
  FormControlLabel
} from "@mui/material";

import {
  IconPlus,
  IconSearch,
  IconPencil,
  IconTrash,
} from "@tabler/icons-react";

import { useThemeStore } from "../../store/themeStore";
import { productosApi } from "../../api/productosApi";

const formatCLP = (value: number) =>
  new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    minimumFractionDigits: 0,
  }).format(value);

export default function ProductosPage() {
  const mode = useThemeStore((s) => s.mode);

  const [productos, setProductos] = useState([]);
  const [busqueda, setBusqueda] = useState("");

  const [openModal, setOpenModal] = useState(false);
  const [form, setForm] = useState({
    id: null,
    codigo_producto: "",
    nombre_producto: "",
    precio_producto: "",
    exento_iva: 0,
    categoria_producto: "",
    distribuidora_producto: "",
  });

  // Cargar productos
  const cargarProductos = async () => {
    const data = await productosApi.getAll();
    setProductos(data);
  };

  useEffect(() => {
    cargarProductos();
  }, []);

  const productosFiltrados = productos.filter((p: any) =>
    p.nombre_producto.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.codigo_producto.toLowerCase().includes(busqueda.toLowerCase())
  );

  const handleOpenModal = () => setOpenModal(true);

  const handleCloseModal = () => {
    setOpenModal(false);
    setForm({
      id: null,
      codigo_producto: "",
      nombre_producto: "",
      precio_producto: "",
      exento_iva: 0,
      categoria_producto: "",
      distribuidora_producto: "",
    });
  };

  const handleSave = async () => {
    if (form.id) {
      await productosApi.update(form.id, form);
    } else {
      await productosApi.create(form);
    }

    handleCloseModal();
    cargarProductos();
  };

  const handleEdit = (p: any) => {
    setForm(p);
    setOpenModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Seguro que desea eliminar este producto?")) return;

    await productosApi.remove(id);
    cargarProductos();
  };

  return (
    <Box sx={{ p: 0, pt: 2, flexGrow: 1, width: "100%" }}>
      {/* CONTROLES */}
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <TextField
          variant="outlined"
          placeholder="Buscar producto..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <IconSearch size={18} style={{ opacity: 0.6 }} />
              </InputAdornment>
            ),
            sx: { borderRadius: "12px" },
          }}
          sx={{ width: 280 }}
        />

        <Button
          variant="contained"
          onClick={handleOpenModal}
          startIcon={<IconPlus size={18} />}
          sx={{
            borderRadius: "10px",
            textTransform: "none",
            fontWeight: 600,
          }}
        >
          Agregar producto
        </Button>
      </Box>

      {/* TABLA */}
      <Paper
        sx={{
          width: "100%",
          borderRadius: "16px",
          overflow: "hidden",
          bgcolor: "background.paper",
        }}
      >
        <Table sx={{ width: "100%", tableLayout: "fixed" }}>
          <TableHead
            sx={{
              bgcolor:
                mode === "dark"
                  ? "rgba(255,255,255,0.08)"
                  : "rgba(105,92,254,0.12)",
            }}
          >
            <TableRow>
              <TableCell><strong>ID</strong></TableCell>
              <TableCell><strong>Código</strong></TableCell>
              <TableCell><strong>Nombre</strong></TableCell>
              <TableCell><strong>Precio</strong></TableCell>
              <TableCell><strong>Categoría</strong></TableCell>
              <TableCell><strong>Distribuidora</strong></TableCell>
              <TableCell><strong>Acciones</strong></TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {productosFiltrados.map((p: any) => (
              <TableRow key={p.id}
                sx={{
                  "&:hover": {
                    bgcolor:
                      mode === "dark"
                        ? "rgba(255,255,255,0.06)"
                        : "rgba(0,0,0,0.04)",
                  },
                }}
              >
                <TableCell>{p.id}</TableCell>
                <TableCell>{p.codigo_producto}</TableCell>
                <TableCell>{p.nombre_producto}</TableCell>
                <TableCell>{formatCLP(Number(p.precio_producto))}</TableCell>
                <TableCell>{p.categoria_producto}</TableCell>
                <TableCell>{p.distribuidora_producto}</TableCell>
                <TableCell>
                  <IconButton color="primary" onClick={() => handleEdit(p)}>
                    <IconPencil size={20} stroke={1.6} />
                  </IconButton>

                  <IconButton color="error" onClick={() => handleDelete(p.id)}>
                    <IconTrash size={20} stroke={1.6} />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      {/* MODAL */}
      <Dialog
        open={openModal}
        onClose={handleCloseModal}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "18px",
            p: 1,
            bgcolor: "background.paper",
          },
        }}
      >
        <DialogTitle
          sx={{
            fontWeight: 700,
            fontSize: "22px",
            pb: 0,
            color: "text.primary",
          }}
        >
          {form.id ? "Editar producto" : "Agregar producto"}
        </DialogTitle>

        <Typography
          sx={{
            color: "text.secondary",
            px: 3,
            mt: 0,
            mb: 2,
          }}
        >
          Ingrese los datos del producto correctamente.
        </Typography>

        <DialogContent sx={{ mt: 1, pb: 1 }}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
              gap: 3,
              mt: 1,
            }}
          >
            {/* Código */}
            <TextField
              label="Código del producto"
              value={form.codigo_producto}
              onChange={(e) =>
                setForm({ ...form, codigo_producto: e.target.value })
              }
              fullWidth
              placeholder="(automático si queda vacío)"
              InputProps={{ sx: { borderRadius: "12px" } }}
            />

            {/* Nombre */}
            <TextField
              label="Nombre del producto"
              value={form.nombre_producto}
              onChange={(e) =>
                setForm({ ...form, nombre_producto: e.target.value })
              }
              fullWidth
              InputProps={{ sx: { borderRadius: "12px" } }}
            />

            {/* Precio */}
            <TextField
              label="Precio"
              type="text"
              value={
                form.precio_producto
                  ? new Intl.NumberFormat("es-CL", {
                      style: "currency",
                      currency: "CLP",
                      minimumFractionDigits: 0,
                    }).format(Number(form.precio_producto))
                  : ""
              }
              onChange={(e) => {
                const raw = e.target.value.replace(/\D/g, "");
                setForm({ ...form, precio_producto: raw });
              }}
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">$</InputAdornment>
                ),
                sx: { borderRadius: "12px" },
              }}
            />

            {/* Categoría */}
            <TextField
              label="Categoría"
              value={form.categoria_producto}
              onChange={(e) =>
                setForm({ ...form, categoria_producto: e.target.value })
              }
              fullWidth
              InputProps={{ sx: { borderRadius: "12px" } }}
            />

            {/* Distribuidora */}
            <TextField
              label="Distribuidora"
              value={form.distribuidora_producto}
              onChange={(e) =>
                setForm({ ...form, distribuidora_producto: e.target.value })
              }
              fullWidth
              InputProps={{ sx: { borderRadius: "12px" } }}
            />

            {/* Exento IVA */}
            <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={form.exento_iva === 1}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        exento_iva: e.target.checked ? 1 : 0,
                      })
                    }
                    color="primary"
                  />
                }
                label="Exento IVA"
                sx={{ fontWeight: 600 }}
              />
            </Box>
          </Box>
        </DialogContent>

        <DialogActions
          sx={{
            p: 3,
            pt: 1,
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <Button
            onClick={handleCloseModal}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              color: "text.secondary",
            }}
          >
            Cancelar
          </Button>

          <Button
            variant="contained"
            onClick={async () => {
              if (!form.codigo_producto) {
                const lastId = productos.length
                  ? Math.max(...productos.map((p: any) => p.id))
                  : 0;

                const newCode = `P-${String(lastId + 1).padStart(5, "0")}`;
                form.codigo_producto = newCode;
              }

              await handleSave();
            }}
            sx={{
              px: 4,
              py: 1,
              borderRadius: "12px",
              textTransform: "none",
              fontSize: "15px",
              fontWeight: 700,
            }}
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
