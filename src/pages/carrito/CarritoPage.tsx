import { useState, useMemo } from "react";
import {
  Box,
  Paper,
  TextField,
  Button,
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
  Select,
  MenuItem,
  Snackbar,
  Alert,
  useTheme,
  Chip
} from "@mui/material";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import LocalOfferIcon from '@mui/icons-material/LocalOffer'; 
import { useThemeStore } from "../../store/themeStore";

import { IconTrash, IconPlus, IconMinus, IconLogout } from "@tabler/icons-react";

import { productosApi } from "../../api/productosApi";
import { ventasApi } from "../../api/ventasApi";
import { useAuthStore } from "../../store/authStore";
import { PromoScannerModal } from "./PromoScannerModal";
import { VoucherModal } from "./VoucherModal";

// CLP formatter
const formatCLP = (value: number) =>
  new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    minimumFractionDigits: 0,
  }).format(value);

// Tipos
interface Producto {
  id: number;
  codigo_producto: string;
  nombre_producto: string;
  precio_producto: number;
  exento_iva: 0 | 1;
  cantidad_mayorista?: number;
  precio_mayorista?: number;
}

export interface CartItem extends Producto {
  cantidad: number;
  es_promo?: boolean;     
  precio_final?: number;  
  aplicando_mayorista?: boolean;
}

const METODOS_PAGO = ["EFECTIVO", "GIRO", "DEBITO", "CREDITO", "TRANSFERENCIA"] as const;
type MetodoPago = (typeof METODOS_PAGO)[number];

interface Pago {
  tipo: MetodoPago;
  monto: number;
}

type TipoAlerta = "warning" | "error" | "info" | "success";

export default function CarritoPage() {
  const theme = useTheme();
  const mode = useThemeStore((s) => s.mode);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);

  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  // Estados
  const [openPromoScanner, setOpenPromoScanner] = useState(false);
  const [codigo, setCodigo] = useState("");
  const [carrito, setCarrito] = useState<CartItem[]>([]);
  
  // ✅ ESTADO PARA EL VUELTO
  const [vuelto, setVuelto] = useState(0); 

  // Voucher
  const [openVoucher, setOpenVoucher] = useState(false);
  const [datosUltimaVenta, setDatosUltimaVenta] = useState<any>(null);

  // Modales
  const [openCantidad, setOpenCantidad] = useState(false);
  const [itemSeleccionado, setItemSeleccionado] = useState<CartItem | null>(null);
  const [cantidadInput, setCantidadInput] = useState("");

  const [openPago, setOpenPago] = useState(false);
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [nuevoPagoTipo, setNuevoPagoTipo] = useState<MetodoPago>("EFECTIVO");
  const [nuevoPagoMonto, setNuevoPagoMonto] = useState("");

  const [alerta, setAlerta] = useState({
    open: false,
    mensaje: "",
    tipo: "warning" as TipoAlerta,
  });

  const mostrarAlerta = (mensaje: string, tipo: TipoAlerta = "warning") => {
    setAlerta({ open: true, mensaje, tipo });
  };

  // =================================================================
  // 🧠 CEREBRO DE PRECIOS (Lógica Mayorista)
  // =================================================================
  const recalcularOfertas = (items: CartItem[]): CartItem[] => {
    return items.map(item => {
        if (item.es_promo) return item;

        const cantMinima = item.cantidad_mayorista || 0;
        const precioOferta = item.precio_mayorista || 0;

        if (cantMinima > 0 && item.cantidad >= cantMinima && precioOferta > 0) {
            return {
                ...item,
                precio_final: precioOferta,
                aplicando_mayorista: true
            };
        } 
        
        const { precio_final, aplicando_mayorista, ...resto } = item;
        return resto as CartItem;
    });
  };

  // =================================================================
  // ⚡ GESTIÓN CENTRALIZADA DEL CARRITO
  // =================================================================
  const agregarAlCarrito = (input: CartItem | CartItem[]) => {
    const nuevosItems = Array.isArray(input) ? input : [input];

    setCarrito((prev) => {
      let nuevoEstado = [...prev];

      nuevosItems.forEach((nuevoItem) => {
         const precioBase = nuevoItem.precio_final ?? nuevoItem.precio_producto;

         const index = nuevoEstado.findIndex(i => {
             const pExistente = i.precio_final ?? i.precio_producto;
             if (i.es_promo) return i.id === nuevoItem.id && pExistente === precioBase;
             return i.id === nuevoItem.id; 
         });

         if (index !== -1) {
             nuevoEstado[index] = { 
               ...nuevoEstado[index], 
               cantidad: nuevoEstado[index].cantidad + nuevoItem.cantidad 
             };
         } else {
             nuevoEstado.push(nuevoItem);
         }
      });

      return recalcularOfertas(nuevoEstado);
    });
  };

  // Handlers
  const handleAgregarPorCodigo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codigo.trim()) return;

    try {
      const producto: Producto = await productosApi.getByCodigo(codigo.trim());
      if (!producto) {
        mostrarAlerta("Producto no encontrado", "info");
        return;
      }
      agregarAlCarrito({ ...producto, cantidad: 1 });
      setCodigo("");
    } catch (error) {
      mostrarAlerta("Error al buscar producto", "error");
    }
  };

  const handlePromoAdd = (itemsPromo: CartItem[]) => {
    agregarAlCarrito(itemsPromo);
    mostrarAlerta("Combo agregado correctamente", "success");
  };

  const modificarCantidad = (index: number, delta: number) => {
    setCarrito((prev) => {
        const nuevoEstado = [...prev];
        const nuevaCant = nuevoEstado[index].cantidad + delta;
        
        if (nuevaCant <= 0) {
             nuevoEstado[index].cantidad = 1;
        } else {
             nuevoEstado[index].cantidad = nuevaCant;
        }
        return recalcularOfertas(nuevoEstado);
    });
  };

  const handleIncrement = (index: number) => modificarCantidad(index, 1);
  const handleDecrement = (index: number) => modificarCantidad(index, -1);

  const handleEliminar = (index: number) => {
    if (!confirm("¿Eliminar este producto del carrito?")) return;
    setCarrito((prev) => {
        const nuevoEstado = prev.filter((_, i) => i !== index);
        return recalcularOfertas(nuevoEstado);
    });
  };

  // ==========================
  // TOTALES
  // ==========================
  const totalExento = useMemo(() =>
    carrito.reduce((acc, item) => {
      const precio = item.precio_final ?? item.precio_producto;
      return item.exento_iva === 1 ? acc + precio * item.cantidad : acc;
    }, 0),
  [carrito]);

  const totalAfecto = useMemo(() =>
    carrito.reduce((acc, item) => {
      const precio = item.precio_final ?? item.precio_producto;
      return item.exento_iva === 0 ? acc + precio * item.cantidad : acc;
    }, 0),
  [carrito]);

  const totalGeneral = totalAfecto + totalExento;
  const totalPagado = useMemo(() => pagos.reduce((acc, p) => acc + p.monto, 0), [pagos]);
  const saldoRestante = totalGeneral - totalPagado;
  const totalNoEfectivo = useMemo(() =>
    pagos.filter((p) => p.tipo !== "EFECTIVO" && p.tipo !== "GIRO").reduce((acc, p) => acc + p.monto, 0),
  [pagos]);

  // ==========================
  // MODALES AUXILIARES
  // ==========================
  const abrirModalCantidad = (item: CartItem) => {
    setItemSeleccionado(item);
    setCantidadInput(String(item.cantidad));
    setOpenCantidad(true);
  };

  const cerrarModalCantidad = () => {
    setOpenCantidad(false);
    setItemSeleccionado(null);
    setCantidadInput("");
  };

  const handleTeclaCantidad = (valor: string) => {
    if (valor === "DEL") return setCantidadInput((v) => v.slice(0, -1));
    if (valor === "CLR") return setCantidadInput("");
    setCantidadInput((prev) => (prev === "0" ? valor : prev + valor));
  };

  const confirmarCantidad = () => {
    const nueva = parseInt(cantidadInput);
    if (isNaN(nueva) || nueva <= 0) {
      mostrarAlerta("Cantidad inválida", "warning");
      return;
    }
    if (itemSeleccionado) {
        setCarrito(prev => {
             const nuevoEstado = prev.map(i => {
                 if (i === itemSeleccionado) return { ...i, cantidad: nueva };
                 return i;
             });
             return recalcularOfertas(nuevoEstado);
        });
    }
    cerrarModalCantidad();
  };

  // PAGO 
  const abrirModalPago = () => {
    if (!carrito.length) return mostrarAlerta("No hay productos", "info");
    setOpenPago(true);
  };
  
  const cerrarModalPago = () => { 
    setOpenPago(false); 
    setPagos([]); 
    setNuevoPagoMonto(""); 
    setNuevoPagoTipo("EFECTIVO"); 
    setVuelto(0); // ✅ Reseteamos vuelto al cerrar
  };
  
  const agregarPago = () => {
     const montoIngresado = parseInt(nuevoPagoMonto);
     if (isNaN(montoIngresado) || montoIngresado <= 0) return mostrarAlerta("Monto inválido", "warning");
     
     const esEfectivo = ["EFECTIVO", "GIRO"].includes(nuevoPagoTipo);
     const esCreditoDebito = ["DEBITO", "CREDITO", "TRANSFERENCIA"].includes(nuevoPagoTipo);

     // Validación Exentos (Cigarros)
     if (esCreditoDebito && totalNoEfectivo + montoIngresado > totalAfecto) {
        mostrarAlerta("⛔ Las ventas con productos EXENTOS solo se realizan con Efectivo o Giro", "error");
        return;
     }

     // ✅ LÓGICA DE VUELTO MEJORADA
     let montoARegistrar = montoIngresado;

     if (montoIngresado > saldoRestante) {
        if (esEfectivo) {
            // Si es efectivo, calculamos vuelto y guardamos solo lo que falta
            const vueltoCalculado = montoIngresado - saldoRestante;
            setVuelto(vueltoCalculado); // Guardar estado para mostrar
            montoARegistrar = saldoRestante; // Registrar solo el saldo pendiente
            mostrarAlerta(`💰 Entregar vuelto: ${formatCLP(vueltoCalculado)}`, "success");
        } else {
            // Si es tarjeta, no permitimos pagar de más
            return mostrarAlerta("El monto excede el saldo restante", "warning");
        }
     }

     setPagos((prev) => [...prev, { tipo: nuevoPagoTipo, monto: montoARegistrar }]);
     setNuevoPagoMonto("");
  };

  const confirmarVenta = async () => {
    if (saldoRestante !== 0) return mostrarAlerta("Aún queda saldo pendiente", "warning");
    if (!user) return mostrarAlerta("Usuario no válido", "error");

    const payload = {
      id_usuario: user.id, 
      total_general: totalGeneral,
      total_afecto: totalAfecto,
      total_exento: totalExento,
      pagos,
      items: carrito.map((i) => ({
        id_producto: i.id,
        cantidad: i.cantidad,
        precio_unitario: i.precio_final ?? i.precio_producto, 
        exento_iva: i.exento_iva,
      })),
    };

    try {
      const res = await ventasApi.create(payload);
      
      const datosParaVoucher = {
         id_venta: res.id_venta,
         fecha: new Date().toLocaleString("es-CL"),
         vendedor: user.nombre_usuario || "Vendedor",
         items: [...carrito],
         total: totalGeneral,
         pagos: [...pagos]
      };

      setDatosUltimaVenta(datosParaVoucher);
      setOpenVoucher(true);

      mostrarAlerta("Venta registrada con éxito", "success");
      setCarrito([]);
      cerrarModalPago();
    } catch (error) {
      mostrarAlerta("Error al registrar venta", "error");
    }
  };

  return (
    <Box sx={{ width: "100%", mt: 1 }}>
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
        <IconButton onClick={toggleTheme}>
          {mode === "light" ? <DarkModeIcon sx={{ color: "text.primary" }} /> : <LightModeIcon sx={{ color: "yellow" }} />}
        </IconButton>
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "0.4fr 1fr" }, gap: 3 }}>
        {/* IZQUIERDA */}
        <Box>
          {/* ESCANEO */}
          <Paper sx={{ p: 3, mb: 3, borderRadius: "16px", bgcolor: "background.paper" }}>
            <Typography variant="h6" fontWeight={700} mb={2}>Escaneo de productos</Typography>
            
            <form onSubmit={handleAgregarPorCodigo}>
              <TextField
                autoFocus
                fullWidth
                label="Código de barras"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                InputProps={{ sx: { borderRadius: "12px" } }}
              />
              <Button type="submit" variant="contained" fullWidth sx={{ mt: 2, py: 1.2, borderRadius: "12px", textTransform: "none" }}>
                Agregar
              </Button>
            </form>

            <Button 
              variant="outlined" 
              color="primary" 
              fullWidth 
              startIcon={<LocalOfferIcon />}
              onClick={() => setOpenPromoScanner(true)}
              sx={{ mt: 2, py: 1.2, borderRadius: "12px", textTransform: "none", fontWeight: 600 }}
            >
              Armar Promo Combo
            </Button>

            <Typography variant="body2" sx={{ mt: 1.5, color: "text.secondary" }}>
              Puede escanear con la pistola o ingresar el código manualmente.
            </Typography>
          </Paper>

          {/* RESUMEN */}
          <Paper sx={{ p: 3, borderRadius: "16px", bgcolor: "background.paper" }}>
            <Typography variant="subtitle1" fontWeight={700} mb={1}>Resumen</Typography>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
              <Typography color="text.secondary">Total afecto</Typography>
              <Typography>{formatCLP(totalAfecto)}</Typography>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
              <Typography color="text.secondary">Total exento</Typography>
              <Typography>{formatCLP(totalExento)}</Typography>
            </Box>
            <Box sx={{ mt: 2, pt: 1.5, borderTop: `1px solid ${theme.palette.divider}`, display: "flex", justifyContent: "space-between" }}>
              <Typography fontWeight={700}>Total venta</Typography>
              <Typography fontWeight={700} color="primary">{formatCLP(totalGeneral)}</Typography>
            </Box>
            <Button
              variant="contained"
              fullWidth
              sx={{ mt: 3, py: 1.3, borderRadius: "12px", fontWeight: 700, textTransform: "none" }}
              disabled={!carrito.length}
              onClick={abrirModalPago}
            >
              Finalizar venta
            </Button>
          </Paper>

          <Button
            variant="outlined"
            startIcon={<IconLogout size={18} />}
            onClick={logout}
            fullWidth
            sx={{ mt: 2, py: 1.2, borderRadius: "12px", textTransform: "none", fontWeight: 600, color: theme.palette.error.main, borderColor: theme.palette.error.main }}
          >
            Salir
          </Button>
        </Box>

        {/* DERECHA: TABLA CARRITO */}
        <Box>
          <Paper sx={{ p: 2.5, borderRadius: "16px", bgcolor: "background.paper" }}>
            <Typography variant="h6" fontWeight={700} mb={2}>Carrito de compra</Typography>
            <Table size="small">
              <TableHead sx={{ bgcolor: theme.palette.mode === "dark" ? "rgba(105,92,254,0.20)" : "rgba(105,92,254,0.12)" }}>
                <TableRow>
                  <TableCell>Producto</TableCell>
                  <TableCell align="center">Cant.</TableCell>
                  <TableCell align="right">Precio</TableCell>
                  <TableCell align="right">Total</TableCell>
                  <TableCell align="center">Exento</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {carrito.map((item, index) => {
                   const precioReal = item.precio_final ?? item.precio_producto;
                   return (
                  <TableRow key={`${item.id}-${index}`} sx={{ "&:hover": { bgcolor: theme.palette.mode === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)" } }}>
                    <TableCell>
                      <Box>
                         <Typography fontWeight={500}>{item.nombre_producto}</Typography>
                         <Typography variant="caption" color="text.secondary" component="div">
                             {item.codigo_producto}
                             {item.aplicando_mayorista && (
                                <Chip label="Oferta Mayorista" size="small" color="success" variant="outlined" sx={{ height: 20, fontSize: '0.7rem', ml: 1, fontWeight: 'bold' }} />
                             )}
                             {item.es_promo && (
                                <Chip label="Combo" size="small" color="secondary" variant="outlined" sx={{ height: 20, fontSize: '0.7rem', ml: 1, fontWeight: 'bold' }} />
                             )}
                         </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1 }}>
                        <IconButton size="small" onClick={() => handleDecrement(index)}><IconMinus size={16} /></IconButton>
                        <Button size="small" variant="outlined" sx={{ minWidth: 40, borderRadius: "10px", px: 1, textTransform: "none" }} onClick={() => abrirModalCantidad(item)}>
                          {item.cantidad}
                        </Button>
                        <IconButton size="small" onClick={() => handleIncrement(index)}><IconPlus size={16} /></IconButton>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                        {(item.precio_final !== undefined && item.precio_final < item.precio_producto) ? (
                            <>
                                <Typography variant="caption" sx={{textDecoration:'line-through', display:'block', color:'text.secondary'}}>
                                    {formatCLP(item.precio_producto)}
                                </Typography>
                                <Typography fontWeight="bold" color="success.main">
                                    {formatCLP(precioReal)}
                                </Typography>
                            </>
                        ) : (
                            formatCLP(precioReal)
                        )}
                    </TableCell>
                    <TableCell align="right">{formatCLP(precioReal * item.cantidad)}</TableCell>
                    <TableCell align="center">{item.exento_iva === 1 ? "Sí" : "No"}</TableCell>
                    <TableCell align="center">
                      <IconButton color="error" size="small" onClick={() => handleEliminar(index)}><IconTrash size={18} /></IconButton>
                    </TableCell>
                  </TableRow>
                )})}
                {!carrito.length && (
                  <TableRow>
                    <TableCell colSpan={6} align="center"><Typography color="text.secondary">No hay productos en el carrito.</Typography></TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Paper>
        </Box>
      </Box>

      {/* MODAL PROMO SCANNER */}
      <PromoScannerModal 
        open={openPromoScanner} 
        onClose={() => setOpenPromoScanner(false)} 
        onPromoAdd={handlePromoAdd} 
      />

      {/* MODAL CANTIDAD */}
      <Dialog open={openCantidad} onClose={cerrarModalCantidad} maxWidth="xs" fullWidth>
        <DialogTitle>Modificar cantidad</DialogTitle>
        <DialogContent>
          <Typography mb={2}>{itemSeleccionado?.nombre_producto}</Typography>
          <TextField fullWidth value={cantidadInput} sx={{ mb: 2 }} InputProps={{ sx: { fontSize: "24px", textAlign: "center", borderRadius: "12px" } }} />
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1 }}>
            {["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"].map((num) => (
              <Button key={num} variant="outlined" onClick={() => handleTeclaCantidad(num)} sx={{ py: 1.5, fontSize: "18px" }}>{num}</Button>
            ))}
            <Button variant="outlined" onClick={() => handleTeclaCantidad("DEL")}>Borrar</Button>
            <Button variant="outlined" onClick={() => handleTeclaCantidad("CLR")}>Limpiar</Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={cerrarModalCantidad}>Cancelar</Button>
          <Button variant="contained" onClick={confirmarCantidad}>Aceptar</Button>
        </DialogActions>
      </Dialog>

      {/* MODAL PAGO */}
      <Dialog open={openPago} onClose={cerrarModalPago} maxWidth="md" fullWidth>
        <DialogTitle>Finalizar venta</DialogTitle>
        <DialogContent>
          <Typography fontWeight={600} mb={1}>Resumen de productos</Typography>
          <Box sx={{ maxHeight: 200, overflowY: "auto", mb: 2 }}>
            {carrito.map((item, idx) => (
              <Box key={idx} sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                <Typography variant="body2">
                    {item.cantidad} x {item.nombre_producto} 
                    {item.aplicando_mayorista && " (Mayorista)"}
                    {item.es_promo && " (Promo)"}
                </Typography>
                <Typography variant="body2">{formatCLP((item.precio_final ?? item.precio_producto) * item.cantidad)}</Typography>
              </Box>
            ))}
          </Box>
           <Box sx={{ mb: 2 }}>
             <Box sx={{ display: "flex", justifyContent: "space-between" }}>
               <Typography color="text.secondary">Total afecto</Typography><Typography>{formatCLP(totalAfecto)}</Typography>
             </Box>
             <Box sx={{ display: "flex", justifyContent: "space-between" }}>
               <Typography color="text.secondary">Total exento</Typography><Typography>{formatCLP(totalExento)}</Typography>
             </Box>
             <Box sx={{ mt: 1, pt: 1, borderTop: `1px solid ${theme.palette.divider}`, display: "flex", justifyContent: "space-between" }}>
               <Typography fontWeight={700}>Total venta</Typography><Typography fontWeight={700}>{formatCLP(totalGeneral)}</Typography>
             </Box>
           </Box>
           <Typography fontWeight={600} mb={1}>Pagos</Typography>
           <Box sx={{ display: "flex", gap: 2, mb: 2, flexWrap: "wrap", alignItems: "center" }}>
             <Select value={nuevoPagoTipo} onChange={(e) => setNuevoPagoTipo(e.target.value as MetodoPago)} size="small" sx={{ minWidth: 140 }}>
               {METODOS_PAGO.map((m) => <MenuItem key={m} value={m}>{m}</MenuItem>)}
             </Select>
             <TextField label="Monto" size="small" value={nuevoPagoMonto} onChange={(e) => setNuevoPagoMonto(e.target.value.replace(/\D/g, ""))} InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }} />
             <Button variant="outlined" onClick={() => {
                if (nuevoPagoTipo === "EFECTIVO" || nuevoPagoTipo === "GIRO") setNuevoPagoMonto(String(totalGeneral - totalPagado));
                else setNuevoPagoMonto(String(totalAfecto - totalNoEfectivo));
             }}>Usar total</Button>
             <Button variant="outlined" onClick={agregarPago}>Agregar pago</Button>
           </Box>

           {/* ✅ VISUALIZACIÓN DE VUELTO GIGANTE */}
           {vuelto > 0 && (
             <Paper 
                elevation={0} 
                sx={{ 
                    mt: 2, 
                    mb: 2,
                    p: 2, 
                    bgcolor: 'success.light', 
                    color: 'success.contrastText',
                    textAlign: 'center',
                    borderRadius: 2,
                }}
             >
                <Typography variant="subtitle2" fontWeight="bold" textTransform="uppercase">
                    Vuelto a Entregar
                </Typography>
                <Typography variant="h3" fontWeight={800}>
                    {formatCLP(vuelto)}
                </Typography>
             </Paper>
           )}

           {pagos.map((p, idx) => (
             <Box key={idx} sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
               <Typography variant="body2">{p.tipo}</Typography><Typography variant="body2">{formatCLP(p.monto)}</Typography>
             </Box>
           ))}
           <Box sx={{ mt: 2, pt: 1, borderTop: `1px solid ${theme.palette.divider}`, display: "flex", justifyContent: "space-between" }}>
             <Typography>Pagado</Typography><Typography>{formatCLP(totalPagado)}</Typography>
           </Box>
           <Box sx={{ mt: 1, display: "flex", justifyContent: "space-between" }}>
             <Typography fontWeight={700}>Saldo restante</Typography>
             <Typography fontWeight={700} color={saldoRestante === 0 ? theme.palette.success.main : theme.palette.error.main}>{formatCLP(saldoRestante)}</Typography>
           </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={cerrarModalPago}>Cancelar</Button>
          <Button variant="contained" onClick={confirmarVenta} disabled={saldoRestante !== 0}>Confirmar venta</Button>
        </DialogActions>
      </Dialog>

      <VoucherModal 
        open={openVoucher}
        onClose={() => setOpenVoucher(false)}
        datosVenta={datosUltimaVenta}
      />

      {/* ALERTAS PERSONALIZADAS */}
      <Snackbar 
        open={alerta.open} 
        autoHideDuration={4000} // Un poco más de tiempo para leer
        onClose={() => setAlerta({ ...alerta, open: false })} 
        anchorOrigin={{ vertical: "top", horizontal: "center" }} // Arriba al centro es más visible
      >
        <Alert 
          onClose={() => setAlerta({ ...alerta, open: false })} 
          severity={alerta.tipo} 
          variant="filled" // "filled" hace que el color sea sólido e intenso
          sx={{ 
            width: "100%",
            boxShadow: 6,
            // Si es error, aumentamos tamaño de letra y padding
            ...(alerta.tipo === 'error' && {
                fontSize: '1.1rem',
                fontWeight: 'bold',
                py: 2, // Más alto
                px: 4  // Más ancho
            })
          }}
        >
          {alerta.mensaje}
        </Alert>
      </Snackbar>
    </Box>
  );
}