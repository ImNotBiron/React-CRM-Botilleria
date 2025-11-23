import { useState, useEffect, useMemo } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Box, Typography, IconButton,
  Table, TableBody, TableCell, TableHead, TableRow,
  Autocomplete, Select, MenuItem, FormControl, InputLabel
} from "@mui/material";
import { IconTrash, IconShoppingCart, IconUserDollar } from "@tabler/icons-react";

import { productosApi } from "../../api/productosApi";
import { ventasApi } from "../../api/ventasApi";
import { useAuthStore } from "../../store/authStore";

const formatCLP = (val: number) => new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(val);

interface InternalSaleModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function InternalSaleModal({ open, onClose, onSuccess }: InternalSaleModalProps) {
  const user = useAuthStore(s => s.user);
  
  // Datos
  const [productos, setProductos] = useState<any[]>([]);
  const [carrito, setCarrito] = useState<any[]>([]);
  
  // Formulario Venta
  const [productoSeleccionado, setProductoSeleccionado] = useState<any>(null);
  const [montoFinalManual, setMontoFinalManual] = useState<string>(""); // El precio que decide el admin
  const [metodoPago, setMetodoPago] = useState("EFECTIVO");

  // Cargar productos para el buscador
  useEffect(() => {
    if (open) {
        productosApi.getAll().then(setProductos).catch(console.error);
        setCarrito([]);
        setMontoFinalManual("");
        setMetodoPago("EFECTIVO");
    }
  }, [open]);

  // Calcular totales reales (Referencia)
  const totalReferencia = useMemo(() => 
    carrito.reduce((acc, item) => acc + (item.precio_producto * 1), 0) // Cantidad fija en 1 por simplicidad o agregar input
  , [carrito]);

  // Agregar al carrito
  const handleAgregar = () => {
    if (!productoSeleccionado) return;
    setCarrito(prev => [...prev, { ...productoSeleccionado, cantidad: 1 }]);
    setProductoSeleccionado(null);
  };

  // Eliminar del carrito
  const handleEliminar = (index: number) => {
    setCarrito(prev => prev.filter((_, i) => i !== index));
  };

  // Confirmar Venta
  const handleFinalizar = async () => {
    if (carrito.length === 0) return alert("El carrito está vacío");
    if (!montoFinalManual) return alert("Debes definir el monto a cobrar");

    const totalCobrar = parseInt(montoFinalManual);

    const payload = {
        id_usuario: user?.id, // Ajusta según tu authStore (id o id_usuario)
        total_general: totalCobrar,
        total_afecto: totalCobrar, // Simplificado para interna
        total_exento: 0,
        tipo_venta: "INTERNA", // 🔴 CLAVE PARA DIFERENCIAR
        items: carrito.map(p => ({
            id_producto: p.id,
            nombre_producto: p.nombre_producto,
            cantidad: 1, // Podrías mejorar esto con un input de cantidad
            precio_unitario: p.precio_producto, // Precio referencia
            exento_iva: p.exento_iva
        })),
        pagos: [{ tipo: metodoPago, monto: totalCobrar }]
    };

    try {
        await ventasApi.create(payload);
        alert("✅ Venta Interna Registrada");
        onSuccess();
        onClose();
    } catch (error) {
        alert("Error al registrar venta interna");
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
        <IconUserDollar /> Venta Interna / Consumo
      </DialogTitle>
      
      <DialogContent dividers>
        <Typography variant="body2" color="text.secondary" mb={2}>
            Utilice este módulo para ventas a empleados, precio costo o mermas pagadas. 
            <strong> Se descontará stock</strong> pero usted define el precio final.
        </Typography>

        {/* BUSCADOR */}
        <Box display="flex" gap={1} mb={2}>
            <Autocomplete
                options={productos}
                getOptionLabel={(option) => `${option.nombre_producto} ($${option.precio_producto})`}
                value={productoSeleccionado}
                onChange={(_, newValue) => setProductoSeleccionado(newValue)}
                renderInput={(params) => <TextField {...params} label="Buscar Producto" size="small" />}
                sx={{ flexGrow: 1 }}
            />
            <Button variant="contained" onClick={handleAgregar} disabled={!productoSeleccionado}>
                <IconShoppingCart size={20} />
            </Button>
        </Box>

        {/* TABLA SIMPLE */}
        <Table size="small" sx={{ border: '1px solid #eee', borderRadius: 2, mb: 3 }}>
            <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                <TableRow>
                    <TableCell>Producto</TableCell>
                    <TableCell align="right">Ref.</TableCell>
                    <TableCell width={40}></TableCell>
                </TableRow>
            </TableHead>
            <TableBody>
                {carrito.map((item, idx) => (
                    <TableRow key={idx}>
                        <TableCell>{item.nombre_producto}</TableCell>
                        <TableCell align="right">{formatCLP(item.precio_producto)}</TableCell>
                        <TableCell>
                            <IconButton size="small" color="error" onClick={() => handleEliminar(idx)}>
                                <IconTrash size={16} />
                            </IconButton>
                        </TableCell>
                    </TableRow>
                ))}
                {carrito.length === 0 && (
                    <TableRow><TableCell colSpan={3} align="center">Carro vacío</TableCell></TableRow>
                )}
            </TableBody>
        </Table>

        {/* TOTALES Y COBRO */}
        <Box sx={{ bgcolor: '#e3f2fd', p: 2, borderRadius: 2 }}>
            <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">Precio Lista (Referencia):</Typography>
                <Typography variant="body2" fontWeight="bold" sx={{ textDecoration: 'line-through' }}>
                    {formatCLP(totalReferencia)}
                </Typography>
            </Box>
            
            <Box display="flex" gap={2} alignItems="center" mt={2}>
                <TextField 
                    label="Monto a Cobrar (Real)"
                    type="number"
                    fullWidth
                    value={montoFinalManual}
                    onChange={(e) => setMontoFinalManual(e.target.value)}
                    InputProps={{ sx: { bgcolor: 'white', fontWeight: 'bold', color: 'success.main' } }}
                    helperText="Ingrese cuánto pagará realmente"
                />
                <FormControl fullWidth>
                    <InputLabel>Medio Pago</InputLabel>
                    <Select 
                        value={metodoPago} 
                        label="Medio Pago" 
                        onChange={(e) => setMetodoPago(e.target.value)}
                        sx={{ bgcolor: 'white' }}
                    >
                        <MenuItem value="EFECTIVO">Efectivo</MenuItem>
                        <MenuItem value="TRANSFERENCIA">Transferencia</MenuItem>
                        <MenuItem value="DEBITO">Débito</MenuItem>
                        <MenuItem value="CREDITO">Crédito</MenuItem>
                    </Select>
                </FormControl>
            </Box>
        </Box>

      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} color="inherit">Cancelar</Button>
        <Button variant="contained" onClick={handleFinalizar} disabled={carrito.length === 0 || !montoFinalManual}>
            Confirmar Venta
        </Button>
      </DialogActions>
    </Dialog>
  );
}