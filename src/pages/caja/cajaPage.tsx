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
  CircularProgress
} from "@mui/material";
import {
  IconLockOpen,
  IconLock,
  IconCash,
  IconCreditCard,
  IconCalculator
} from "@tabler/icons-react";

import { cajaApi } from "../../api/cajaApi";
import { useAuthStore } from "../../store/authStore";

// Formateador de moneda
const formatCLP = (val: number) => 
  new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(val);

export default function CajaAdminPage() {
  const user = useAuthStore(s => s.user);
  const [loading, setLoading] = useState(true);
  const [estadoCaja, setEstadoCaja] = useState<"abierta" | "cerrada">("cerrada");
  
  // Datos cuando está abierta
  const [datosCaja, setDatosCaja] = useState<any>(null);

  // Inputs
  const [montoInicial, setMontoInicial] = useState("");
  const [montoCierre, setMontoCierre] = useState("");
  
  // Modales
  const [openCierreModal, setOpenCierreModal] = useState(false);

  const cargarEstado = async () => {
    setLoading(true);
    try {
      const res = await cajaApi.getEstado();
      setEstadoCaja(res.estado);
      if (res.estado === "abierta") {
        setDatosCaja(res.datos);
      }
    } catch (error) {
      console.error("Error cargando caja", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarEstado();
  }, []);

  // --- ACCIÓN: ABRIR CAJA ---
  const handleAbrirCaja = async () => {
    const monto = parseInt(montoInicial);
    if (isNaN(monto) || monto < 0) return alert("Ingrese un monto válido");

    if (!user) return alert("Error de usuario");

    try {
      // ✅ CORRECCIÓN: Usamos user.id
      const userId = (user as any).id || (user as any).id_usuario; 

      await cajaApi.abrir(monto, userId);
      
      alert("✅ Caja Abierta Correctamente");
      setMontoInicial("");
      cargarEstado();
    } catch (error) {
      console.error(error);
      alert("Error al abrir caja");
    }
  };

  // --- ACCIÓN: CERRAR CAJA ---
  const handlePreCierre = () => {
    setOpenCierreModal(true);
  };

  const handleConfirmarCierre = async () => {
    const montoReal = parseInt(montoCierre);
    if (isNaN(montoReal) || montoReal < 0) return alert("Ingrese el monto contado");

    try {
      await cajaApi.cerrar({
        id_caja: datosCaja.id,
        monto_final_real: montoReal,
        totales_sistema: {
            ventas_efectivo: datosCaja.ventas_efectivo,
            ventas_digital: datosCaja.ventas_digital,
            monto_inicial: datosCaja.monto_inicial
        }
      });
      
      alert("🔒 Caja Cerrada Correctamente");
      setOpenCierreModal(false);
      setMontoCierre("");
      cargarEstado(); // Volverá a estado cerrada
    } catch (error) {
      alert("Error al cerrar caja");
    }
  };

  if (loading) return <Box p={4}><CircularProgress /></Box>;

  // =======================================================
  // VISTA 1: CAJA CERRADA (FORMULARIO APERTURA)
  // =======================================================
  if (estadoCaja === "cerrada") {
    return (
      <Box sx={{ maxWidth: 500, mx: "auto", mt: 4 }}>
        <Paper elevation={3} sx={{ p: 4, borderRadius: 4, textAlign: "center" }}>
          <Box sx={{ bgcolor: "#f5f5f5", width: 80, height: 80, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", mx: "auto", mb: 2 }}>
            <IconLock size={40} color="#757575" />
          </Box>
          
          <Typography variant="h5" fontWeight={700} gutterBottom>
            Turno Cerrado
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={4}>
            Para comenzar a vender, debe abrir la caja indicando el dinero inicial (sencillo) disponible.
          </Typography>

          <TextField 
            label="Monto Inicial (Fondo de Caja)"
            fullWidth
            type="number"
            value={montoInicial}
            onChange={(e) => setMontoInicial(e.target.value)}
            InputProps={{ startAdornment: <Typography mr={1}>$</Typography> }}
            sx={{ mb: 3 }}
          />

          <Button 
            variant="contained" 
            fullWidth 
            size="large"
            startIcon={<IconLockOpen />}
            onClick={handleAbrirCaja}
            sx={{ borderRadius: 3, py: 1.5, fontWeight: "bold" }}
          >
            ABRIR CAJA
          </Button>
        </Paper>
      </Box>
    );
  }

  // =======================================================
  // VISTA 2: CAJA ABIERTA (DASHBOARD CONTROL)
  // =======================================================
  const diferencia = (parseInt(montoCierre) || 0) - (datosCaja?.total_esperado_cajon || 0);
  
  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>Control de Caja</Typography>
        <Button 
            variant="contained" 
            color="error" 
            startIcon={<IconLock />}
            onClick={handlePreCierre}
        >
            CERRAR TURNO
        </Button>
      </Box>

      {/* ✅ GRILLA REEMPLAZADA POR CSS GRID NATIVO (MÁS ESTABLE) */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', md: '1fr 1fr', lg: '1fr 1fr 1fr 1fr' }, 
        gap: 3 
      }}>
        
        {/* RESUMEN TARJETAS */}
        <Card sx={{ borderRadius: 3, bgcolor: "#e3f2fd", color: "#1565c0" }}>
          <CardContent>
              <Typography variant="subtitle2" fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <IconCreditCard size={20} /> VENTAS TARJETA/TRANSF
              </Typography>
              <Typography variant="h4" fontWeight={800} mt={1}>
                  {formatCLP(datosCaja.ventas_digital)}
              </Typography>
              <Typography variant="caption">
                  Dinero directo a banco
              </Typography>
          </CardContent>
        </Card>

        {/* RESUMEN EFECTIVO (LO IMPORTANTE) */}
        <Card sx={{ borderRadius: 3, bgcolor: "#e8f5e9", color: "#2e7d32" }}>
          <CardContent>
              <Typography variant="subtitle2" fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <IconCash size={20} /> VENTAS EFECTIVO
              </Typography>
              <Typography variant="h4" fontWeight={800} mt={1}>
                  {formatCLP(datosCaja.ventas_efectivo)}
              </Typography>
              <Typography variant="caption">
                  Dinero en cajón
              </Typography>
          </CardContent>
        </Card>

        {/* FONDO INICIAL */}
        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
              <Typography variant="subtitle2" color="text.secondary">FONDO INICIAL</Typography>
              <Typography variant="h5" fontWeight={700} mt={1}>
                  {formatCLP(datosCaja.monto_inicial)}
              </Typography>
          </CardContent>
        </Card>

        {/* TOTAL ESPERADO */}
        <Card sx={{ borderRadius: 3, border: '2px solid #2e7d32' }}>
          <CardContent>
              <Typography variant="subtitle2" color="primary.main" fontWeight={700}>
                  DEBE HABER EN CAJÓN
              </Typography>
              <Typography variant="h4" fontWeight={800} mt={1} color="text.primary">
                  {formatCLP(datosCaja.total_esperado_cajon)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                  (Fondo + Ventas Efectivo)
              </Typography>
          </CardContent>
        </Card>

      </Box>

      {/* MODAL DE CIERRE (ARQUEO) */}
      <Dialog open={openCierreModal} onClose={() => setOpenCierreModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, textAlign: "center" }}>
            Arqueo de Caja
        </DialogTitle>
        <DialogContent>
            <Box sx={{ textAlign: "center", py: 2 }}>
                <Typography variant="body1" mb={2}>
                    El sistema calcula que debe haber en efectivo:
                </Typography>
                <Typography variant="h4" fontWeight={800} color="primary" mb={4}>
                    {formatCLP(datosCaja.total_esperado_cajon)}
                </Typography>

                <Divider sx={{ mb: 3 }}>CONTEO REAL</Divider>

                <TextField 
                    label="¿Cuánto dinero contaste?"
                    fullWidth
                    type="number"
                    value={montoCierre}
                    onChange={(e) => setMontoCierre(e.target.value)}
                    InputProps={{ 
                        startAdornment: <IconCalculator size={20} style={{marginRight: 8}} />,
                        sx: { fontSize: '1.2rem', fontWeight: 'bold' }
                    }}
                    helperText="Ingresa el total de billetes y monedas en el cajón"
                />

                {/* CÁLCULO DE DIFERENCIA EN VIVO */}
                {montoCierre !== "" && (
                    <Alert 
                        severity={diferencia === 0 ? "success" : diferencia > 0 ? "info" : "error"}
                        variant="filled"
                        sx={{ mt: 3, justifyContent: "center" }}
                    >
                        <Typography fontWeight="bold">
                            {diferencia === 0 
                                ? "¡CAJA CUADRADA PERFECTA! 🎉" 
                                : diferencia > 0 
                                    ? `SOBRAN ${formatCLP(diferencia)} (Propina?)`
                                    : `FALTAN ${formatCLP(Math.abs(diferencia))} 😱`
                            }
                        </Typography>
                    </Alert>
                )}
            </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, justifyContent: "center" }}>
            <Button onClick={() => setOpenCierreModal(false)} color="inherit">Cancelar</Button>
            <Button 
                variant="contained" 
                color="error" 
                size="large"
                onClick={handleConfirmarCierre}
                disabled={montoCierre === ""}
            >
                CONFIRMAR CIERRE
            </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}