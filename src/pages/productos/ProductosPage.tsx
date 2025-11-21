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
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tooltip,
  Chip,
  Divider,
  Alert // Importamos Alert para el mensaje dentro del modal
} from "@mui/material";

import {
  IconPlus,
  IconSearch,
  IconPencil,
  IconTrash,
  IconDiscount2,
  IconAlertTriangle // Icono de advertencia
} from "@tabler/icons-react";

import { useThemeStore } from "../../store/themeStore";
import { productosApi } from "../../api/productosApi";
import { categoriasApi } from "../../api/categoriasApi";
import { proveedoresApi } from "../../api/proveedoresApi";

const formatCLP = (value: number) =>
  new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    minimumFractionDigits: 0,
  }).format(value);

export default function ProductosPage() {
  const mode = useThemeStore((s) => s.mode);

  // Datos
  const [productos, setProductos] = useState<any[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [listaCategorias, setListaCategorias] = useState<any[]>([]);
  const [listaProveedores, setListaProveedores] = useState<any[]>([]);

  // Modal Crear/Editar Producto
  const [openModal, setOpenModal] = useState(false);
  
  // Modal Ofertas
  const [openOfferModal, setOpenOfferModal] = useState(false);

  // ✅ Modal Eliminar (Nuevo)
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Formulario Principal (Producto)
  const [form, setForm] = useState({
    id: null,
    codigo_producto: "",
    nombre_producto: "",
    precio_producto: "",
    exento_iva: 0,
    id_categoria: "",
    id_proveedor_preferido: "",
    stock: 0,
    stock_minimo: 5,
  });

  // Formulario Oferta
  const [offerForm, setOfferForm] = useState({
    id: null, 
    nombre_producto: "", 
    precio_normal: 0,    
    cantidad_mayorista: 0,
    precio_mayorista: 0,
  });

  const cargarDatos = async () => {
    try {
      const [prods, cats, provs] = await Promise.all([
        productosApi.getAll(),
        categoriasApi.getAll(),
        proveedoresApi.getAll()
      ]);
      setProductos(prods);
      setListaCategorias(cats);
      setListaProveedores(provs);
    } catch (error) {
      console.error("Error cargando datos", error);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const productosFiltrados = productos.filter((p: any) =>
    p.nombre_producto.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.codigo_producto.toLowerCase().includes(busqueda.toLowerCase())
  );

  // --- MANEJO MODAL PRODUCTO ---
  const handleOpenModal = () => {
      setForm({
        id: null,
        codigo_producto: "",
        nombre_producto: "",
        precio_producto: "",
        exento_iva: 0,
        id_categoria: "",
        id_proveedor_preferido: "",
        stock: 0,
        stock_minimo: 5,
      });
      setOpenModal(true);
  };

  const handleCloseModal = () => setOpenModal(false);

  const handleEdit = (p: any) => {
    setForm({
        ...p,
        id_categoria: p.id_categoria || "",
        id_proveedor_preferido: p.id_proveedor_preferido || "",
        stock: p.stock || 0,
        stock_minimo: p.stock_minimo || 0
    });
    setOpenModal(true);
  };

  const handleSaveProduct = async () => {
    const payload = {
        ...form,
        id_categoria: form.id_categoria ? Number(form.id_categoria) : null,
        id_proveedor_preferido: form.id_proveedor_preferido ? Number(form.id_proveedor_preferido) : null,
        stock: Number(form.stock),
        stock_minimo: Number(form.stock_minimo)
    };

    if (form.id) await productosApi.update(form.id, payload);
    else await productosApi.create(payload);

    handleCloseModal();
    cargarDatos();
  };

  // --- MANEJO MODAL OFERTA ---
  const handleOpenOffer = (p: any) => {
    setOfferForm({
      id: p.id,
      nombre_producto: p.nombre_producto,
      precio_normal: Number(p.precio_producto),
      cantidad_mayorista: p.cantidad_mayorista || 0,
      precio_mayorista: p.precio_mayorista || 0
    });
    setOpenOfferModal(true);
  };

  const handleSaveOffer = async () => {
    if (Number(offerForm.cantidad_mayorista) > 0) {
        if (Number(offerForm.precio_mayorista) >= offerForm.precio_normal) {
            alert("El precio oferta debe ser menor al precio normal.");
            return;
        }
    }

    const productoOriginal = productos.find((p: any) => p.id === offerForm.id) as any;
    if (!productoOriginal) return;

    const payload = {
        ...productoOriginal, 
        cantidad_mayorista: Number(offerForm.cantidad_mayorista),
        precio_mayorista: Number(offerForm.precio_mayorista)
    };

    await productosApi.update(offerForm.id!, payload);
    
    setOpenOfferModal(false);
    cargarDatos(); 
  };

  // ✅ NUEVA LÓGICA DE ELIMINAR (MODAL)
  const handleOpenDelete = (id: number) => {
    setDeleteId(id);
    setOpenDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (deleteId) {
      try {
        await productosApi.remove(deleteId);
        cargarDatos();
      } catch (error) {
        console.error("Error al eliminar", error);
      }
    }
    setOpenDeleteModal(false);
    setDeleteId(null);
  };

  return (
    <Box sx={{ p: 0, pt: 2, flexGrow: 1, width: "100%" }}>
      
      {/* BARRA SUPERIOR */}
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <TextField
          variant="outlined"
          placeholder="Buscar producto..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          InputProps={{
            startAdornment: <InputAdornment position="start"><IconSearch size={18} style={{ opacity: 0.6 }} /></InputAdornment>,
            sx: { borderRadius: "12px" },
          }}
          sx={{ width: 280 }}
        />
        <Button
          variant="contained"
          onClick={handleOpenModal}
          startIcon={<IconPlus size={18} />}
          sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 600 }}
        >
          Agregar producto
        </Button>
      </Box>

      {/* TABLA */}
      <Paper sx={{ width: "100%", borderRadius: "16px", overflow: "hidden", bgcolor: "background.paper" }}>
        <Table sx={{ width: "100%", tableLayout: "fixed" }}>
          
          {/* --- HEAD --- */}
          <TableHead
            sx={{
              bgcolor: "background.paper", 
              borderBottom: "2px solid",
              borderColor: "divider",
            }}
          >
            <TableRow>
              <TableCell sx={{ width: '50px', fontWeight: 600, color: 'text.secondary', py: 1 }}>ID</TableCell>
              <TableCell sx={{ width: '90px', fontWeight: 600, color: 'text.secondary', whiteSpace: 'nowrap', py: 1 }}>Código</TableCell>
              <TableCell sx={{ fontWeight: 600, color: 'text.secondary', py: 1 }}>Nombre</TableCell>
              <TableCell sx={{ width: '80px', fontWeight: 600, color: 'text.secondary', whiteSpace: 'nowrap', py: 1 }}>Stock</TableCell>
              <TableCell sx={{ width: '110px', fontWeight: 600, color: 'text.secondary', whiteSpace: 'nowrap', py: 1 }}>Categoría</TableCell>
              <TableCell sx={{ width: '140px', fontWeight: 600, color: 'text.secondary', whiteSpace: 'nowrap', py: 1 }}>Proveedor</TableCell>
              <TableCell align="right" sx={{ width: '100px', fontWeight: 600, color: 'text.secondary', whiteSpace: 'nowrap', py: 1 }}>Precio Venta</TableCell>
              <TableCell align="center" sx={{ width: '60px', fontWeight: 600, color: 'text.secondary', whiteSpace: 'nowrap', py: 1 }}>Oferta</TableCell>
              <TableCell align="center" sx={{ width: '100px', fontWeight: 600, color: 'text.secondary', py: 1 }}>Acciones</TableCell>
            </TableRow>
          </TableHead>

          {/* --- BODY --- */}
          <TableBody>
            {productosFiltrados.map((p: any) => {
              const tieneOferta = Number(p.cantidad_mayorista) > 0;
              const stockBajo = p.stock <= p.stock_minimo;

              return (
                <TableRow key={p.id} hover>
                  <TableCell sx={{ py: 0.5 }}>{p.id}</TableCell>
                  <TableCell sx={{ py: 0.5, fontSize: '0.85rem' }}>{p.codigo_producto}</TableCell>
                  
                  <TableCell sx={{ py: 0.5, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.nombre_producto}
                  </TableCell>

                  <TableCell sx={{ py: 0.5, fontWeight: 'bold', color: stockBajo ? 'error.main' : 'text.primary' }}>
                     {p.stock}
                  </TableCell>

                  <TableCell sx={{ py: 0.5, fontSize: '0.85rem' }}>{p.categoria_producto || "-"}</TableCell>
                  <TableCell sx={{ py: 0.5, fontSize: '0.85rem' }}>{p.distribuidora_producto || "-"}</TableCell>
                  
                  <TableCell align="right" sx={{ py: 0.5, fontWeight: 600 }}>
                    {formatCLP(Number(p.precio_producto))}
                  </TableCell>
                  
                  <TableCell align="center" sx={{ py: 0.5 }}>
                     {tieneOferta ? (
                        <Tooltip title={`Oferta: ${formatCLP(p.precio_mayorista)} x ${p.cantidad_mayorista}u`}>
                           <IconButton size="small" color="success" onClick={() => handleOpenOffer(p)}>
                              <IconDiscount2 size={18} />
                           </IconButton>
                        </Tooltip>
                     ) : (
                        <Tooltip title="Crear Oferta">
                           <IconButton size="small" sx={{ opacity: 0.3 }} onClick={() => handleOpenOffer(p)}>
                              <IconDiscount2 size={18} />
                           </IconButton>
                        </Tooltip>
                     )}
                  </TableCell>

                  <TableCell align="center" sx={{ py: 0.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <IconButton color="primary" size="small" onClick={() => handleEdit(p)}>
                            <IconPencil size={18} />
                        </IconButton>
                        
                        {/* ✅ BOTÓN ELIMINAR AHORA ABRE MODAL */}
                        <IconButton color="error" size="small" onClick={() => handleOpenDelete(p.id)}>
                            <IconTrash size={18} />
                        </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </Paper>

      {/* 1. MODAL PRODUCTO */}
      <Dialog open={openModal} onClose={handleCloseModal} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: "18px", p: 1 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {form.id ? "Editar producto" : "Agregar producto"}
        </DialogTitle>
        <DialogContent sx={{ mt: 1 }}>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 3, mt: 1 }}>
            
            <TextField label="Código" value={form.codigo_producto} onChange={(e) => setForm({ ...form, codigo_producto: e.target.value })} fullWidth placeholder="Automático si vacío" InputProps={{ sx: { borderRadius: "12px" } }} />
            <TextField label="Nombre" value={form.nombre_producto} onChange={(e) => setForm({ ...form, nombre_producto: e.target.value })} fullWidth InputProps={{ sx: { borderRadius: "12px" } }} />
            
            <TextField label="Precio Venta" value={form.precio_producto} onChange={(e) => setForm({ ...form, precio_producto: e.target.value.replace(/\D/g, "") })} fullWidth InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment>, sx: { borderRadius: "12px" } }} />

            <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField 
                    label="Stock Actual" 
                    type="number"
                    value={form.stock} 
                    onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} 
                    fullWidth 
                    InputProps={{ sx: { borderRadius: "12px" } }} 
                />
                <TextField 
                    label="Stock Crítico" 
                    type="number"
                    helperText="Aviso si baja de esto"
                    value={form.stock_minimo} 
                    onChange={(e) => setForm({ ...form, stock_minimo: Number(e.target.value) })} 
                    fullWidth 
                    InputProps={{ sx: { borderRadius: "12px" } }} 
                />
            </Box>
            
            <FormControl fullWidth>
              <InputLabel>Categoría</InputLabel>
              <Select value={form.id_categoria} label="Categoría" onChange={(e) => setForm({ ...form, id_categoria: e.target.value })} sx={{ borderRadius: "12px" }}>
                <MenuItem value=""><em>Ninguna</em></MenuItem>
                {listaCategorias.map((cat) => <MenuItem key={cat.id} value={cat.id}>{cat.nombre}</MenuItem>)}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Distribuidora</InputLabel>
              <Select value={form.id_proveedor_preferido} label="Distribuidora" onChange={(e) => setForm({ ...form, id_proveedor_preferido: e.target.value })} sx={{ borderRadius: "12px" }}>
                <MenuItem value=""><em>Ninguna</em></MenuItem>
                {listaProveedores.map((prov) => <MenuItem key={prov.id} value={prov.id}>{prov.nombre}</MenuItem>)}
              </Select>
            </FormControl>

            <Box sx={{ display: "flex", alignItems: "center" }}>
              <FormControlLabel control={<Switch checked={form.exento_iva === 1} onChange={(e) => setForm({ ...form, exento_iva: e.target.checked ? 1 : 0 })} />} label="Exento IVA" />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleCloseModal} sx={{ fontWeight: 600, color: "text.secondary" }}>Cancelar</Button>
          <Button variant="contained" onClick={async () => {
              if (!form.codigo_producto) {
                const lastId = productos.length ? Math.max(...productos.map((p: any) => p.id)) : 0;
                form.codigo_producto = `P-${String(lastId + 1).padStart(5, "0")}`;
              }
              await handleSaveProduct();
            }} sx={{ borderRadius: "12px", fontWeight: 700 }}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      {/* 2. MODAL OFERTA */}
      <Dialog open={openOfferModal} onClose={() => setOpenOfferModal(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: "18px", p: 1 } }}>
        <DialogTitle sx={{ textAlign: 'center' }}>
            <IconDiscount2 size={40} stroke={1.5} color="#2e7d32" style={{display:'block', margin:'0 auto 10px auto'}} />
            Configurar Oferta Mayorista
        </DialogTitle>
        <DialogContent>
            <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 3 }}>
                Producto: <strong>{offerForm.nombre_producto}</strong><br/>
                Precio Normal: {formatCLP(offerForm.precio_normal)}
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexDirection: 'column' }}>
                <TextField label="Cantidad Mínima" type="number" helperText="Ej: 6 para sixpack" value={offerForm.cantidad_mayorista === 0 ? '' : offerForm.cantidad_mayorista} onChange={(e) => setOfferForm({ ...offerForm, cantidad_mayorista: Number(e.target.value) })} fullWidth />
                <TextField label="Precio Oferta (Unitario)" helperText="Precio unitario al llevar la cantidad mínima" value={offerForm.precio_mayorista === 0 ? '' : offerForm.precio_mayorista} onChange={(e) => setOfferForm({ ...offerForm, precio_mayorista: Number(e.target.value) })} fullWidth InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }} />
            </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, justifyContent: 'center' }}>
            <Button onClick={() => setOpenOfferModal(false)} color="inherit">Cancelar</Button>
            <Button variant="contained" color="success" onClick={handleSaveOffer}>Aplicar Oferta</Button>
        </DialogActions>
      </Dialog>

      {/* ✅ 3. MODAL DE CONFIRMACIÓN DE ELIMINAR (NUEVO) */}
      <Dialog 
        open={openDeleteModal} 
        onClose={() => setOpenDeleteModal(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: "16px", p: 1 } }}
      >
        <DialogContent sx={{ textAlign: 'center', pt: 3 }}>
            <Box sx={{ 
                width: 60, height: 60, borderRadius: '50%', bgcolor: '#ffebee', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', 
                mx: 'auto', mb: 2 
            }}>
                <IconAlertTriangle size={32} color="#d32f2f" />
            </Box>
            <Typography variant="h6" fontWeight={700} gutterBottom>
                ¿Eliminar producto?
            </Typography>
            <Typography variant="body2" color="text.secondary">
                Esta acción borrará el producto permanentemente del inventario.
            </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, justifyContent: 'center', gap: 1 }}>
            <Button onClick={() => setOpenDeleteModal(false)} color="inherit" sx={{ fontWeight: 600 }}>
                Cancelar
            </Button>
            <Button 
                onClick={handleConfirmDelete} 
                variant="contained" 
                color="error" 
                sx={{ borderRadius: "8px", fontWeight: 700, px: 3 }}
            >
                Sí, Eliminar
            </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}