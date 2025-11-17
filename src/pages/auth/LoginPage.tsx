import { useState } from "react";
import { authApi } from "../../api/authApi";
import { useAuthStore } from "../../store/authStore";
import { useNavigate } from "react-router-dom";

import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  InputAdornment,
  Snackbar,
  Alert,
  CircularProgress,
  useTheme,
} from "@mui/material";

import PersonIcon from "@mui/icons-material/Person";

export default function LoginPage() {
  const theme = useTheme();

  const [rut, setRut] = useState("");
  const [loading, setLoading] = useState(false);

  const [errorMsg, setErrorMsg] = useState("");
  const [openError, setOpenError] = useState(false);

  const navigate = useNavigate();
  const loginStore = useAuthStore();

  // Chilean RUT formatter
  const formatRut = (value: string) => {
    let clean = value.replace(/[^\dkK]/g, "").toUpperCase();
    if (clean.length > 1) {
      const body = clean.slice(0, -1);
      const dv = clean.slice(-1);
      return `${body}-${dv}`;
    }
    return clean;
  };

  // LOGIN
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!rut.trim()) {
      setErrorMsg("Debe ingresar su RUT.");
      setOpenError(true);
      return;
    }

    try {
      setLoading(true);
      const data = await authApi.login(rut);

      if (!data.user || !data.token) {
        setErrorMsg(data.message || "RUT no autorizado.");
        setOpenError(true);
        setLoading(false);
        return;
      }

      loginStore.login(data.user, data.token);

      if (data.user.tipo_usuario === "admin") navigate("/");
      else if (data.user.tipo_usuario === "vendedor") navigate("/carrito");
      else {
        setErrorMsg("Este usuario no tiene acceso.");
        setOpenError(true);
        loginStore.logout();
      }
    } catch (error: any) {
      setErrorMsg(error.response?.data?.message || "Error de conexión.");
      setOpenError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* FONDO DINÁMICO */}
      <Box
        sx={{
          position: "fixed",
          inset: 0,
          zIndex: 1300,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          px: 2,
          animation: "fadeIn 0.6s ease",

          // 🎨 GRADIENTE CONTROLADO POR EL THEME:
          background:
            theme.palette.mode === "light"
              ? "linear-gradient(135deg, #e9e7ff 0%, #f4f3ff 100%)"
              : "linear-gradient(135deg, #0d0d0d 0%, #1a1a1a 100%)",
        }}
      >
        {/* CARD DEL LOGIN */}
        <Paper
          elevation={10}
          sx={{
            width: "100%",
            maxWidth: 420,
            p: 5,
            borderRadius: 4,
            textAlign: "center",
            animation: "growIn 0.45s ease",
            bgcolor: "background.paper",
            color: "text.primary",
          }}
        >
          {/* TÍTULO */}
          <Typography
            variant="h4"
            fontWeight={700}
            mb={3}
            sx={{ 
              letterSpacing: "1px",
              color: theme.palette.primary.main
            }}
          >
            CRM Botillería
          </Typography>

          <Typography
            variant="body1"
            mb={4}
            sx={{ color: "text.secondary" }}
          >
            Ingrese su RUT para continuar
          </Typography>

          {/* FORM */}
          <form onSubmit={handleSubmit}>
            <TextField
              label="RUT"
              fullWidth
              margin="normal"
              value={rut}
              onChange={(e) => setRut(formatRut(e.target.value))}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon color="primary" />
                  </InputAdornment>
                ),
                sx: { borderRadius: "12px" },
              }}
            />

            {/* BOTÓN LOGIN */}
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading}
              sx={{
                mt: 4,
                py: 1.5,
                borderRadius: "12px",
                fontWeight: 700,
                fontSize: "16px",
                textTransform: "none",
                // El color AHORA viene del theme
              }}
            >
              {loading ? (
                <CircularProgress size={24} sx={{ color: "white" }} />
              ) : (
                "INGRESAR"
              )}
            </Button>
          </form>
        </Paper>
      </Box>

      {/* SNACKBAR */}
      <Snackbar
        open={openError}
        autoHideDuration={4000}
        onClose={() => setOpenError(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          severity="error"
          variant="filled"
          onClose={() => setOpenError(false)}
          sx={{
            width: "100%",
            bgcolor: theme.palette.error.main,
            color: "white",
            fontWeight: 600,
          }}
        >
          {errorMsg}
        </Alert>
      </Snackbar>

      {/* ANIMACIONES */}
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }

          @keyframes growIn {
            from { transform: scale(0.85); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }
        `}
      </style>
    </>
  );
}
