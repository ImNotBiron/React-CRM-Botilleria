import { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Chip,
  CircularProgress,
  Card,
  CardContent,
  useTheme,
  Avatar,
  Button,
  Divider,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemText,
  Alert
} from "@mui/material";
import {
  IconCash,
  IconShoppingCart,
  IconUser,
  IconReceipt
} from "@tabler/icons-react";

import { cajaApi } from "../../api/cajaApi";
import { ventasApi } from "../../api/ventasApi"; 
import { useAuthStore } from "../../store/authStore";
import { VoucherModal } from "../carrito/VoucherModal"; // Reutilizamos el voucher

// Componente Luz de Estado
const StatusLight = ({ active }: { active: boolean }) => (
  <Box
    sx={{
      width: 12,
      height: 12,
      borderRadius: "50%",
      bgcolor: active ? "#00e676" : "#757575",
      boxShadow: active ? "0 0 10px #00e676, 0 0 20px #00e676" : "none",
      mr: 1.5,
      transition: "all 0.3s ease",
      border: active ? "1px solid #b9f6ca" : "1px solid #424242"
    }}
  />
);

const formatCLP = (val: number) => 
  new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(val);

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const theme = useTheme();
  
  const [loading, setLoading] = useState(true);
  const [estadoCaja, setEstadoCaja] = useState<"abierta" | "cerrada">("cerrada");
  const [resumenVentas, setResumenVentas] = useState({ total: 0, count: 0 });
  
  // ✅ ESTADOS NUEVOS PARA VENDEDORES
  const [vendedores, setVendedores] = useState<any[]>([]);
  const [cajaAbiertaFlag, setCajaAbiertaFlag] = useState(false);

  // Modales de Acción
  const [openVoucher, setOpenVoucher] = useState(false);
  const [datosVoucher, setDatosVoucher] = useState<any>(null);
  
  const [openList, setOpenList] = useState(false);
  const [ventasVendedor, setVentasVendedor] = useState<any[]>([]); // Lista simple
  const [vendedorSeleccionado, setVendedorSeleccionado] = useState("");

  const cargarDatos = async () => {
    try {
      // 1. Estado Caja
      const resCaja = await cajaApi.getEstado();
      setEstadoCaja(resCaja.estado);

      // 2. Ventas Globales Hoy
      const hoy = new Date().toISOString().split('T')[0];
      try {
          const resVentas = await ventasApi.getAll(hoy, hoy);
          const total = resVentas.reduce((acc: any, v: any) => acc + v.total_general, 0);
          setResumenVentas({ total, count: resVentas.length });
      } catch (err) {
          console.warn("Error cargando ventas globales", err);
      }

      // 3. Resumen Vendedores (Nuevo Endpoint)
      try {
          const resVend = await ventasApi.getResumenVendedores();
          setVendedores(resVend.vendedores);
          setCajaAbiertaFlag(resVend.caja_abierta);
      } catch (err) {
          console.warn("Error cargando vendedores", err);
      }

    } catch (error) {
      console.error("Error general dashboard", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // --- ACCIÓN: VER ÚLTIMA VENTA (VOUCHER) ---
  const handleVerUltima = async (lastId: number) => {
      if (!lastId) return alert("Este vendedor no ha realizado ventas en este turno.");
      try {
          const venta = await ventasApi.getById(lastId);
          
          // Reconstruir estructura para VoucherModal
          let items = [];
          let pagos = [];
          if (venta.json_voucher) {
             try {
                 const parsed = JSON.parse(venta.json_voucher);
                 items = parsed.items || [];
                 pagos = parsed.pagos || [];
             } catch (e) {}
          }

          const datosParaImprimir = {
            id_venta: venta.id,
            fecha: new Date(venta.fecha).toLocaleString("es-CL"),
            vendedor: venta.vendedor,
            items: items.map((i: any) => ({
                ...i,
                nombre_producto: i.nombre_producto || `Prod ${i.id}`,
                precio_final: i.precio, 
                cantidad: i.cantidad || i.cant
            })),
            total: venta.total_general,
            pagos: pagos
          };

          setDatosVoucher(datosParaImprimir);
          setOpenVoucher(true);

      } catch (error) {
          alert("Error al cargar la venta");
      }
  };

  // --- ACCIÓN: VER TODAS (LISTA) ---
  const handleVerTodas = async (idVendedor: number, nombre: string) => {
      // Reutilizamos el endpoint de historial filtrando en el cliente (o idealmente en backend)
      // Para hacerlo simple y rápido, filtramos las ventas globales que ya cargamos si coinciden con el vendedor
      // Si no, habría que llamar a la API. Como ya tenemos ventas de HOY, filtramos de ahí.
      
      // 1. Traer ventas del día (ya las tenemos en caché o volvemos a pedir para asegurar)
      const hoy = new Date().toISOString().split('T')[0];
      const todasLasVentas = await ventasApi.getAll(hoy, hoy);
      
      // 2. Filtrar por vendedor (El backend getAll devuelve nombre vendedor, no ID, hay que tener ojo)
      // El backend getHistorialVentas devuelve 'vendedor' (string). 
      // Para ser precisos, mejor sería que devolviera id_usuario. 
      // Asumiremos filtro por nombre por ahora.
      
      const misVentas = todasLasVentas.filter((v: any) => v.vendedor === nombre);
      
      setVentasVendedor(misVentas);
      setVendedorSeleccionado(nombre);
      setOpenList(true);
  };


  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10, width: "100%" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%" }}>
      
      {/* HEADER */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4, flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} sx={{ mb: 0.5 }}>
            Hola, {user?.nombre_usuario} 👋
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Resumen de operación en tiempo real.
          </Typography>
        </Box>

        <Paper
          elevation={0}
          sx={{
            display: "flex", alignItems: "center", px: 2, py: 1, borderRadius: "50px",
            bgcolor: estadoCaja === "abierta" ? (theme.palette.mode === 'dark' ? 'rgba(0, 230, 118, 0.1)' : '#e8f5e9') : (theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#f5f5f5'),
            border: `1px solid ${estadoCaja === "abierta" ? theme.palette.success.light : theme.palette.divider}`
          }}
        >
          <StatusLight active={estadoCaja === "abierta"} />
          <Typography fontWeight={700} color={estadoCaja === "abierta" ? "success.main" : "text.secondary"} sx={{ textTransform: "uppercase", fontSize: "0.85rem" }}>
            {estadoCaja === "abierta" ? "Caja Abierta" : "Caja Cerrada"}
          </Typography>
        </Paper>
      </Box>

      {/* KPIs GENERALES */}
      <Box sx={{ display: "grid", width: "100%", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 3, mb: 4 }}>
        <Card sx={{ borderRadius: 4, position: 'relative', overflow: 'visible' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ position: 'absolute', top: -15, right: 20, width: 60, height: 60, bgcolor: '#6D79FF', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(109, 121, 255, 0.4)' }}>
                <IconCash color="white" size={32} />
              </Box>
              <Typography color="text.secondary" variant="subtitle2" fontWeight={600}>VENTAS TOTALES (HOY)</Typography>
              <Typography variant="h4" fontWeight={800} sx={{ mt: 1 }}>{formatCLP(resumenVentas.total)}</Typography>
            </CardContent>
        </Card>

        <Card sx={{ borderRadius: 4, position: 'relative', overflow: 'visible' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ position: 'absolute', top: -15, right: 20, width: 60, height: 60, bgcolor: '#00e676', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0, 230, 118, 0.4)' }}>
                <IconShoppingCart color="white" size={32} />
              </Box>
              <Typography color="text.secondary" variant="subtitle2" fontWeight={600}>TRANSACCIONES</Typography>
              <Typography variant="h4" fontWeight={800} sx={{ mt: 1 }}>{resumenVentas.count}</Typography>
            </CardContent>
        </Card>
      </Box>

      {/* 👥 SECCIÓN EQUIPO EN TURNO */}
      <Typography variant="h6" fontWeight={700} mb={2} display="flex" alignItems="center" gap={1}>
        <IconUser size={22} /> Equipo en Turno
      </Typography>

      {cajaAbiertaFlag ? (
          <Box sx={{ display: "grid", width: "100%", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "1fr 1fr 1fr" }, gap: 3 }}>
            {vendedores.map((v) => (
                <Card key={v.id} sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider', transition: '0.3s', '&:hover': { boxShadow: 4 } }}>
                    <CardContent>
                        <Box display="flex" alignItems="center" mb={2}>
                            <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>{v.nombre_usuario[0]}</Avatar>
                            <Box>
                                <Typography fontWeight={700}>{v.nombre_usuario}</Typography>
                                <Chip label="En Línea" size="small" color="success" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 'bold' }} />
                            </Box>
                        </Box>
                        
                        <Divider sx={{ my: 2 }} />
                        
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                            <Typography variant="body2" color="text.secondary">Vendido Turno</Typography>
                            <Typography fontWeight={800} color="primary.main">{formatCLP(Number(v.total_vendido))}</Typography>
                        </Box>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography variant="body2" color="text.secondary">Tickets</Typography>
                            <Typography fontWeight={700}>{v.cantidad_ventas}</Typography>
                        </Box>

                        <Box display="flex" gap={1} mt={3}>
                            <Button 
                                variant="outlined" 
                                size="small" 
                                fullWidth 
                                sx={{ borderRadius: 2 }}
                                onClick={() => handleVerTodas(v.id, v.nombre_usuario)}
                            >
                                Ver Todas
                            </Button>
                            <Button 
                                variant="contained" 
                                size="small" 
                                fullWidth 
                                sx={{ borderRadius: 2, boxShadow: 'none' }}
                                onClick={() => handleVerUltima(v.last_venta_id)}
                                disabled={!v.last_venta_id}
                            >
                                Ver Última
                            </Button>
                        </Box>
                    </CardContent>
                </Card>
            ))}
            {vendedores.length === 0 && (
                <Typography color="text.secondary" sx={{ fontStyle: 'italic' }}>No hay vendedores activos registrados.</Typography>
            )}
          </Box>
      ) : (
          <Alert severity="info" variant="outlined" sx={{ borderRadius: 3 }}>
              La caja está cerrada. No hay métricas de turno en tiempo real.
          </Alert>
      )}

      {/* MODAL VOUCHER (Para "Ver Última") */}
      <VoucherModal 
        open={openVoucher} 
        onClose={() => setOpenVoucher(false)} 
        datosVenta={datosVoucher} 
      />

      {/* MODAL LISTA (Para "Ver Todas") */}
      <Dialog open={openList} onClose={() => setOpenList(false)} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight={700}>Ventas de {vendedorSeleccionado}</DialogTitle>
        <DialogContent dividers sx={{ p: 0 }}>
            <List>
                {ventasVendedor.map((v) => (
                    <ListItem key={v.id} secondaryAction={
                        <IconButton edge="end" onClick={() => handleVerUltima(v.id)}>
                            <IconReceipt size={20} />
                        </IconButton>
                    }>
                        <ListItemText 
                            primary={formatCLP(v.total_general)} 
                            secondary={new Date(v.fecha).toLocaleTimeString()} 
                            primaryTypographyProps={{ fontWeight: 700 }}
                        />
                    </ListItem>
                ))}
                {ventasVendedor.length === 0 && (
                    <Box p={3} textAlign="center"><Typography variant="body2">Sin ventas hoy.</Typography></Box>
                )}
            </List>
        </DialogContent>
        <Box p={2} textAlign="center">
            <Button onClick={() => setOpenList(false)}>Cerrar</Button>
        </Box>
      </Dialog>

    </Box>
  );
}