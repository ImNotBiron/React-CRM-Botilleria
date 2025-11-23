import { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Divider,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Snackbar,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  useTheme,
  Chip,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody 
} from "@mui/material";
import {
  IconLockOpen,
  IconLock,
  IconCash,
  IconCreditCard,
  IconCalculator,
  IconTrendingDown,
  IconCirclePlus,
  IconArrowUp,
  IconArrowDown,
  IconHistory,
  IconShoppingCart,
  IconUserDollar // Nuevo Icono
} from "@tabler/icons-react";

import { cajaApi } from "../../api/cajaApi";
import { useAuthStore } from "../../store/authStore";
import InternalSaleModal from "./InternalSaleModal"; // ✅ IMPORTADO

const formatCLP = (val: number) => 
  new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(val);

const TipoMovimientoChip = ({ tipo }: { tipo: string }) => {
  if (tipo === 'VENTA') return <Chip icon={<IconShoppingCart size={16}/>} label="Venta" color="primary" size="small" variant="outlined" sx={{fontWeight:'bold'}} />;
  if (tipo === 'INGRESO') return <Chip icon={<IconArrowUp size={16}/>} label="Ingreso Extra" color="success" size="small" variant="outlined" sx={{fontWeight:'bold'}} />;
  return <Chip icon={<IconArrowDown size={16}/>} label="Egreso/Gasto" color="error" size="small" variant="outlined" sx={{fontWeight:'bold'}} />;
};

export default function CajaAdminPage() {
  const theme = useTheme();
  const user = useAuthStore(s => s.user);
  
  const [loading, setLoading] = useState(true);
  const [estadoCaja, setEstadoCaja] = useState<"abierta" | "cerrada">("cerrada");
  const [datosCaja, setDatosCaja] = useState<any>(null);

  const [montoInicial, setMontoInicial] = useState("");
  const [montoCierre, setMontoCierre] = useState("");
  
  const [movTipo, setMovTipo] = useState<"INGRESO" | "EGRESO">("EGRESO");
  const [movMonto, setMovMonto] = useState("");
  const [movComentario, setMovComentario] = useState("");

  const [openCierreModal, setOpenCierreModal] = useState(false);
  const [openMovModal, setOpenMovModal] = useState(false);
  
  // ✅ NUEVO ESTADO
  const [openInternalModal, setOpenInternalModal] = useState(false);

  const [alerta, setAlerta] = useState({
    open: false,
    mensaje: "",
    tipo: "info" as "success" | "error" | "warning" | "info"
  });

  const mostrarAlerta = (mensaje: string, tipo: "success" | "error" | "warning" | "info" = "info") => {
    setAlerta({ open: true, mensaje, tipo });
  };

  // Carga con polling silencioso
  const cargarEstado = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const res = await cajaApi.getEstado();
      setEstadoCaja(res.estado);
      if (res.estado === "abierta") {
        setDatosCaja(res.datos);
      }
    } catch (error) {
      if (!isRefresh) mostrarAlerta("Error al conectar", "error");
    } finally {
      if (!isRefresh) setLoading(false);
    }
  };

  useEffect(() => {
    cargarEstado();
    const interval = setInterval(() => { if (!document.hidden) cargarEstado(true); }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleAbrirCaja = async () => {
    const monto = parseInt(montoInicial);
    if (isNaN(monto) || monto < 0) return mostrarAlerta("Ingrese un monto válido", "warning");
    if (!user) return mostrarAlerta("Error de usuario", "error");

    try {
      const userId = (user as any).id || (user as any).id_usuario; 
      await cajaApi.abrir(monto, userId);
      mostrarAlerta("✅ Caja Abierta Correctamente", "success");
      setMontoInicial("");
      cargarEstado();
    } catch (error) {
      mostrarAlerta("Error al abrir la caja", "error");
    }
  };

  const handleRegistrarMovimiento = async () => {
    const monto = parseInt(movMonto);
    if (isNaN(monto) || monto <= 0) return mostrarAlerta("Monto inválido", "warning");
    if (!movComentario.trim()) return mostrarAlerta("Ingrese un motivo", "warning");
    
    try {
        const userId = (user as any).id || (user as any).id_usuario; 
        await cajaApi.registrarMovimiento({
            id_caja: datosCaja.id,
            tipo: movTipo,
            monto: monto,
            comentario: movComentario,
            id_usuario: userId
        });
        mostrarAlerta("Movimiento registrado", "success");
        setOpenMovModal(false);
        setMovMonto("");
        setMovComentario("");
        cargarEstado();
    } catch (error) {
        mostrarAlerta("Error al registrar", "error");
    }
  };

  const handleConfirmarCierre = async () => {
    const montoReal = parseInt(montoCierre);
    if (isNaN(montoReal) || montoReal < 0) return mostrarAlerta("Ingrese el monto contado", "warning");

    try {
      await cajaApi.cerrar({
        id_caja: datosCaja.id,
        monto_final_real: montoReal,
        totales_sistema: { ...datosCaja, total_esperado_cajon: datosCaja.total_esperado_cajon }
      });
      mostrarAlerta("🔒 Caja Cerrada Correctamente", "success");
      setOpenCierreModal(false);
      setMontoCierre("");
      cargarEstado();
    } catch (error) {
      mostrarAlerta("Error al cerrar caja", "error");
    }
  };

  if (loading) return <Box sx={{ width: "100%", display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;

  if (estadoCaja === "cerrada") {
    return (
      <Box sx={{ width: "100%", height: "80vh", display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Paper elevation={3} sx={{ p: 5, borderRadius: 5, textAlign: "center", maxWidth: 450, width: '100%', bgcolor: theme.palette.background.paper }}>
          <Box sx={{ bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : '#f8f9fa', width: 70, height: 70, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", mx: "auto", mb: 3 }}>
            <IconLock size={32} color={theme.palette.text.secondary} />
          </Box>
          <Typography variant="h5" fontWeight={700} gutterBottom>Turno Cerrado</Typography>
          <TextField 
            label="Monto Inicial" fullWidth type="tel"
            value={montoInicial ? parseInt(montoInicial).toLocaleString("es-CL") : ""}
            onChange={(e) => setMontoInicial(e.target.value.replace(/\D/g, ""))}
            InputProps={{ startAdornment: <Typography mr={1} fontWeight={500} color="text.secondary">$</Typography>, sx: { borderRadius: 3, fontSize: '1.1rem', fontWeight: 500, textAlign: 'center' } }}
            inputProps={{ style: { textAlign: 'center' } }} sx={{ mb: 3 }} autoFocus
          />
          <Button variant="contained" fullWidth size="large" startIcon={<IconLockOpen size={20} />} onClick={handleAbrirCaja} sx={{ borderRadius: 3, py: 1.5, fontWeight: 700, fontSize: '0.95rem', bgcolor: '#695cfe', '&:hover': { bgcolor: '#5a4ee3' } }}>
            ABRIR TURNO
          </Button>
        </Paper>
        <Snackbar open={alerta.open} autoHideDuration={4000} onClose={() => setAlerta({...alerta, open: false})} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
            <Alert severity={alerta.tipo} variant="filled" sx={{ width: '100%' }}>{alerta.mensaje}</Alert>
        </Snackbar>
      </Box>
    );
  }
  
  return (
    <Box sx={{ width: "100%" }}>
      {/* HEADER */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
        <Box>
            <Typography variant="h5" fontWeight={700}>Control de Caja</Typography>
            <Typography variant="body2" color="text.secondary">Inicio: {new Date(datosCaja.fecha_apertura).toLocaleTimeString()}</Typography>
        </Box>
        <Box display="flex" gap={2}>
            {/* ✅ BOTÓN VENTA INTERNA */}
            <Button 
                variant="contained" 
                color="warning" 
                startIcon={<IconUserDollar size={20} />}
                onClick={() => setOpenInternalModal(true)}
                sx={{ fontWeight: 600, borderRadius: 2, px: 2, boxShadow: 'none' }}
            >
                Venta Interna
            </Button>

            <Button 
                variant="outlined" 
                startIcon={<IconCirclePlus size={20} />}
                onClick={() => setOpenMovModal(true)}
                sx={{ fontWeight: 600, borderRadius: 2, border: '1px solid', textTransform: 'none', px: 2 }}
            >
                Gasto / Ingreso
            </Button>
            
            <Button 
                variant="contained" 
                color="error" 
                startIcon={<IconLock size={20} />} 
                onClick={() => setOpenCierreModal(true)}
                sx={{ fontWeight: 600, borderRadius: 2, px: 3, boxShadow: 'none' }}
            >
                CERRAR TURNO
            </Button>
        </Box>
      </Box>

      <Box sx={{ display: 'grid', width: "100%", gridTemplateColumns: { xs: '1fr', md: '1fr 1fr', lg: '1fr 1fr 1fr 1fr' }, gap: 3, mb: 4 }}>
        {/* ... Tarjetas de resumen igual que antes ... */}
        <Card sx={{ borderRadius: 4, boxShadow: 1 }}>
          <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>FONDO INICIAL</Typography>
              <Typography variant="h5" fontWeight={700} mt={0.5} color="text.primary">{formatCLP(datosCaja.monto_inicial)}</Typography>
          </CardContent>
        </Card>
        <Card sx={{ borderRadius: 4, bgcolor: "#e8f5e9", color: "#1b5e20", boxShadow: 'none', border: '1px solid #c8e6c9' }}>
          <CardContent sx={{ textAlign: 'center' }}>
              <Box display="flex" alignItems="center" justifyContent="center" gap={1} mb={0.5}><IconCash size={20} opacity={0.7} /><Typography variant="subtitle2" fontWeight={700} sx={{opacity: 0.8}}>VENTAS EFECTIVO</Typography></Box>
              <Typography variant="h5" fontWeight={700}>{formatCLP(datosCaja.ventas_efectivo)}</Typography>
          </CardContent>
        </Card>
        <Card sx={{ borderRadius: 4, bgcolor: "#ffebee", color: "#b71c1c", boxShadow: 'none', border: '1px solid #ffcdd2' }}>
          <CardContent sx={{ textAlign: 'center' }}>
              <Box display="flex" alignItems="center" justifyContent="center" gap={1} mb={0.5}><IconTrendingDown size={20} opacity={0.7} /><Typography variant="subtitle2" fontWeight={700} sx={{opacity: 0.8}}>GASTOS / RETIROS</Typography></Box>
              <Typography variant="h5" fontWeight={700}>- {formatCLP(datosCaja.egresos)}</Typography>
          </CardContent>
        </Card>
        <Card sx={{ borderRadius: 4, border: '2px solid #4caf50', bgcolor: theme.palette.background.paper }}>
          <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="subtitle2" color="success.main" fontWeight={800}>DEBE HABER EN CAJÓN</Typography>
              <Typography variant="h4" fontWeight={800} mt={1} color="text.primary">{formatCLP(datosCaja.total_esperado_cajon)}</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', display: 'block', mt: 0.5 }}>(Fondo + Ventas - Gastos)</Typography>
          </CardContent>
        </Card>
      </Box>

      {/* TABLA DE MOVIMIENTOS */}
      <Paper sx={{ borderRadius: 4, overflow: 'hidden', width: '100%', mt: 4 }}>
          <Box sx={{ p: 2, bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : '#f8f9fa', borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconHistory size={20} color="gray" />
              <Typography variant="subtitle1" fontWeight={700}>Flujo de Efectivo (Ventas + Movimientos)</Typography>
          </Box>
          <Table>
              <TableHead sx={{ bgcolor: 'background.paper' }}>
                  <TableRow>
                      <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Hora</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Tipo</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Detalle</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Usuario</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, color: 'text.secondary' }}>Monto</TableCell>
                  </TableRow>
              </TableHead>
              <TableBody>
                  {datosCaja.lista_movimientos?.length > 0 ? (
                      datosCaja.lista_movimientos.map((m: any, index: number) => (
                          <TableRow key={index} hover>
                              <TableCell>{new Date(m.fecha).toLocaleTimeString()}</TableCell>
                              <TableCell><TipoMovimientoChip tipo={m.tipo} /></TableCell>
                              <TableCell>{m.comentario}</TableCell>
                              <TableCell sx={{ textTransform: 'capitalize' }}>{m.nombre_usuario || 'Admin'}</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 'bold', color: m.tipo === 'EGRESO' ? 'error.main' : 'success.main' }}>
                                  {m.tipo === 'EGRESO' ? '- ' : '+ '}{formatCLP(m.monto)}
                              </TableCell>
                          </TableRow>
                      ))
                  ) : (
                      <TableRow><TableCell colSpan={5} align="center" sx={{ py: 3, color: 'text.secondary' }}>No hay movimientos registrados.</TableCell></TableRow>
                  )}
              </TableBody>
          </Table>
      </Paper>

      {/* Modales anteriores */}
      <Dialog open={openMovModal} onClose={() => setOpenMovModal(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 4, p: 1 } }}>
        {/* ... contenido modal gasto ... */}
        <DialogTitle fontWeight={700} textAlign="center">Registrar Movimiento</DialogTitle>
        <DialogContent>
            <Box display="flex" flexDirection="column" gap={3} mt={1}>
                <FormControl fullWidth>
                    <InputLabel>Tipo</InputLabel>
                    <Select value={movTipo} label="Tipo" onChange={(e) => setMovTipo(e.target.value as any)} sx={{ borderRadius: 3 }}>
                        <MenuItem value="EGRESO">🔻 EGRESO (Gasto/Retiro)</MenuItem>
                        <MenuItem value="INGRESO">🔺 INGRESO (Extra)</MenuItem>
                    </Select>
                </FormControl>
                <TextField label="Monto" fullWidth type="tel" value={movMonto} onChange={(e) => setMovMonto(e.target.value.replace(/\D/g, ""))} InputProps={{ startAdornment: <Typography mr={1} fontWeight="bold">$</Typography> }} />
                <TextField label="Motivo" fullWidth multiline rows={2} value={movComentario} onChange={(e) => setMovComentario(e.target.value)} />
            </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, justifyContent: 'center' }}>
            <Button onClick={() => setOpenMovModal(false)}>Cancelar</Button>
            <Button variant="contained" onClick={handleRegistrarMovimiento}>Guardar</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openCierreModal} onClose={() => setOpenCierreModal(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4, p: 1 } }}>
        {/* ... contenido modal cierre ... */}
        <DialogTitle fontWeight={700} textAlign="center">Arqueo de Caja</DialogTitle>
        <DialogContent>
             {/* ... inputs cierre ... */}
             <Box sx={{ textAlign: "center", py: 2 }}>
                <Typography variant="body1">Sistema:</Typography>
                <Typography variant="h4" fontWeight={800} color="primary" mb={3}>{formatCLP(datosCaja.total_esperado_cajon)}</Typography>
                <TextField label="Conteo Real" fullWidth type="tel" value={montoCierre} onChange={(e) => setMontoCierre(e.target.value.replace(/\D/g, ""))} InputProps={{ startAdornment: <IconCalculator size={20} style={{marginRight:8}}/> }} />
             </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, justifyContent: 'center' }}>
            <Button onClick={() => setOpenCierreModal(false)}>Cancelar</Button>
            <Button variant="contained" color="error" onClick={handleConfirmarCierre} disabled={!montoCierre}>Confirmar</Button>
        </DialogActions>
      </Dialog>

      {/* ✅ NUEVO MODAL: VENTA INTERNA */}
      <InternalSaleModal 
        open={openInternalModal} 
        onClose={() => setOpenInternalModal(false)} 
        onSuccess={() => cargarEstado(true)} 
      />

      <Snackbar open={alerta.open} autoHideDuration={4000} onClose={() => setAlerta({...alerta, open: false})} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity={alerta.tipo} variant="filled" sx={{ width: '100%', fontWeight: 600, boxShadow: 4 }}>{alerta.mensaje}</Alert>
      </Snackbar>
    </Box>
  );
}