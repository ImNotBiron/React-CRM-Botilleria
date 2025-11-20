import { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Chip,
  CircularProgress,
  Card,
  CardContent,
  useTheme
} from "@mui/material";

import {
  IconCash,
  IconShoppingCart,
  IconTrendingUp
} from "@tabler/icons-react";

import { cajaApi } from "../../api/cajaApi";
import { ventasApi } from "../../api/ventasApi";
import { useAuthStore } from "../../store/authStore";

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

  const cargarDatos = async () => {
    try {
      const resCaja = await cajaApi.getEstado();
      setEstadoCaja(resCaja.estado);

      const hoy = new Date().toISOString().split("T")[0];
      const resVentas = await ventasApi.getAll(hoy, hoy);

      const total = resVentas.reduce((acc: any, v: any) => acc + v.total_general, 0);
      setResumenVentas({ total, count: resVentas.length });
    } catch (error) {
      console.error("Error cargando dashboard", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 10, width: "100%" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        width: "100%",
        flexGrow: 1,
        minHeight: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center", // <-- CENTRA TODO EL DASHBOARD
      }}
    >
      {/* CONTENEDOR CENTRAL RESPONSIVE */}
      <Box
        sx={{
          width: "100%",
          maxWidth: "1400px",      // <-- LIMITA ANCHO IDEAL DE DASHBOARD
          px: 2,
          py: 1,
        }}
      >

        {/* --- ENCABEZADO --- */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 4,
            flexWrap: "wrap",
            gap: 2,
            width: "100%",
          }}
        >
          <Box>
            <Typography variant="h4" fontWeight={700} sx={{ mb: 0.5 }}>
              Hola, {user?.nombre_usuario} 👋
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Aquí tienes el resumen de hoy.
            </Typography>
          </Box>

          <Paper
            elevation={0}
            sx={{
              display: "flex",
              alignItems: "center",
              px: 2,
              py: 1,
              borderRadius: "50px",
              bgcolor:
                estadoCaja === "abierta"
                  ? theme.palette.mode === "dark"
                    ? "rgba(0, 230, 118, 0.1)"
                    : "#e8f5e9"
                  : theme.palette.mode === "dark"
                  ? "rgba(255, 255, 255, 0.05)"
                  : "#f5f5f5",
              border: `1px solid ${
                estadoCaja === "abierta"
                  ? theme.palette.success.light
                  : theme.palette.divider
              }`,
            }}
          >
            <StatusLight active={estadoCaja === "abierta"} />
            <Typography
              fontWeight={700}
              color={estadoCaja === "abierta" ? "success.main" : "text.secondary"}
              sx={{ textTransform: "uppercase", fontSize: "0.85rem", letterSpacing: "0.5px" }}
            >
              {estadoCaja === "abierta" ? "Caja Abierta" : "Caja Cerrada"}
            </Typography>
          </Paper>
        </Box>

        {/* --- GRID PRINCIPAL --- */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "1fr 1fr",
              md: "repeat(3, 1fr)",
            },
            gap: 3,
            width: "100%",
          }}
        >
          {/* Venta Total Hoy */}
          <Card sx={{ borderRadius: 4, position: "relative", overflow: "visible" }}>
            <CardContent sx={{ p: 3 }}>
              <Box
                sx={{
                  position: "absolute",
                  top: -15,
                  right: 20,
                  width: 60,
                  height: 60,
                  bgcolor: "#6D79FF",
                  borderRadius: "16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 4px 12px rgba(109, 121, 255, 0.4)",
                }}
              >
                <IconCash color="white" size={32} />
              </Box>

              <Typography color="text.secondary" variant="subtitle2" fontWeight={600}>
                VENTAS DE HOY
              </Typography>
              <Typography variant="h4" fontWeight={800} sx={{ mt: 1, color: "text.primary" }}>
                {formatCLP(resumenVentas.total)}
              </Typography>
              <Chip
                label="Ingreso Bruto"
                size="small"
                sx={{
                  mt: 2,
                  bgcolor: "rgba(109, 121, 255, 0.1)",
                  color: "#6D79FF",
                  fontWeight: 700,
                }}
              />
            </CardContent>
          </Card>

          {/* Transacciones */}
          <Card sx={{ borderRadius: 4, position: "relative", overflow: "visible" }}>
            <CardContent sx={{ p: 3 }}>
              <Box
                sx={{
                  position: "absolute",
                  top: -15,
                  right: 20,
                  width: 60,
                  height: 60,
                  bgcolor: "#00e676",
                  borderRadius: "16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 4px 12px rgba(0, 230, 118, 0.4)",
                }}
              >
                <IconShoppingCart color="white" size={32} />
              </Box>

              <Typography color="text.secondary" variant="subtitle2" fontWeight={600}>
                N° TRANSACCIONES
              </Typography>
              <Typography variant="h4" fontWeight={800} sx={{ mt: 1, color: "text.primary" }}>
                {resumenVentas.count}
              </Typography>
              <Chip
                label="Tickets Emitidos"
                size="small"
                sx={{
                  mt: 2,
                  bgcolor: "rgba(0, 230, 118, 0.1)",
                  color: "#00c853",
                  fontWeight: 700,
                }}
              />
            </CardContent>
          </Card>

          {/* Estado de caja */}
          <Card
            sx={{
              borderRadius: 4,
              height: "100%",
              bgcolor:
                estadoCaja === "abierta"
                  ? theme.palette.mode === "dark"
                    ? "rgba(0, 230, 118, 0.1)"
                    : "#e8f5e9"
                  : "background.paper",
              border: "1px dashed",
              borderColor: "divider",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CardContent sx={{ textAlign: "center" }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Estado Actual
              </Typography>

              {estadoCaja === "abierta" ? (
                <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
                  <IconTrendingUp color="#00c853" />
                  <Typography fontWeight={700} color="success.main">
                    Operando
                  </Typography>
                </Box>
              ) : (
                <Typography fontWeight={700} color="text.disabled">
                  Esperando Apertura
                </Typography>
              )}
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
}

