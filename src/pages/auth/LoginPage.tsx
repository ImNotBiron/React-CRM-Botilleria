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
} from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";

export default function LoginPage() {
  const [rut, setRut] = useState("");
  const [loading, setLoading] = useState(false);

  const [errorMsg, setErrorMsg] = useState("");
  const [openError, setOpenError] = useState(false);

  const navigate = useNavigate();
  const loginStore = useAuthStore();

  const formatRut = (value: string) => {
    let clean = value.replace(/[^\dkK]/g, "").toUpperCase();
    if (clean.length > 1) {
      const body = clean.slice(0, -1);
      const dv = clean.slice(-1);
      return `${body}-${dv}`;
    }
    return clean;
  };

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  console.log("Submit ejecutado con RUT:", rut);

  if (!rut.trim()) {
    setErrorMsg("Debe ingresar su RUT.");
    setOpenError(true);
    return;
  }

  try {
    setLoading(true);

    console.log("Llamando API login...");
    const data = await authApi.login(rut);

    console.log("DATA COMPLETA:", data);
console.log("TOKEN RECIBIDO:", data.token);
console.log("USUARIO RECIBIDO:", data.user);


    console.log("Respuesta del backend:", data);

    if (!data.user || !data.token) {
      setErrorMsg(data.message || "RUT no autorizado.");
      setOpenError(true);
      setLoading(false);
      return;
    }

    // GUARDAR SESIÓN
    console.log("Guardando sesión en Zustand...");
    loginStore.login(data.user, data.token);

    // REDIRECCIÓN SEGÚN TIPO
    if (data.user.tipo_usuario === "admin") {
      console.log("tipo_usuario: "+data.user.tipo_usuario+"| Redirigiendo a /");
      navigate("/");
    } else if (data.user.tipo_usuario === "vendedor") {
      console.log("Redirigiendo a /carrito");
      navigate("/carrito");
    } else {
      setErrorMsg("Este usuario no tiene acceso a esta aplicación.");
      setOpenError(true);
      loginStore.logout();
    }

  } catch (error: any) {
    const msg =
      error.response?.data?.message || "Error de conexión con el servidor.";
    setErrorMsg(msg);
    setOpenError(true);
  } finally {
    setLoading(false);
  }
};



  return (
    <>
      {/* Fondo principal */}
      <Box
        sx={{
          position: "fixed",
          inset: 0,
          zIndex: 1300,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background: "linear-gradient(135deg, #dcd9ff 0%, #f4f3ff 100%)",
          px: 2,
          animation: "fadeIn 0.6s ease",
        }}
      >
        {/* Tarjeta */}
        <Paper
          elevation={10}
          sx={{
            width: "100%",
            maxWidth: 420,
            p: 5,
            borderRadius: 4,
            textAlign: "center",
            animation: "growIn 0.45s ease",
          }}
        >
          <Typography
            variant="h4"
            fontWeight={700}
            mb={3}
            sx={{ color: "#695cfe", letterSpacing: "1px" }}
          >
            CRM Botillería
          </Typography>

          <Typography variant="body1" mb={4} sx={{ color: "#555" }}>
            Ingrese su RUT para continuar
          </Typography>

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
              }}
              sx={{
                "& .MuiOutlinedInput-root": { borderRadius: "12px" },
              }}
            />

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
                backgroundColor: "#695cfe",
                "&:hover": { backgroundColor: "#5a4ee3" },
                boxShadow: "0 4px 15px rgba(105, 92, 254, 0.35)",
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

      {/* Snackbar de error */}
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
            bgcolor: "#ff4d4d",
            color: "white",
            fontWeight: 600,
          }}
        >
          {errorMsg}
        </Alert>
      </Snackbar>

      {/* Animaciones CSS */}
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
