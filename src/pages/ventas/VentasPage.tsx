import { Box, Paper, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";

export default function VentasPage() {
  const theme = useTheme();

  return (
    <Box
      sx={{
        width: "100%",
        p: 3,
        color: "text.primary",
      }}
    >
      <Paper
        sx={{
          p: 4,
          borderRadius: "16px",
          bgcolor: "background.paper",
          boxShadow:
            theme.palette.mode === "light"
              ? "0 4px 15px rgba(0,0,0,0.08)"
              : "0 4px 15px rgba(0,0,0,0.30)",
          transition: "all 0.3s ease",
        }}
      >
        <Typography variant="h4" fontWeight={700} mb={1}>
          Ventas
        </Typography>

        <Typography variant="body1" color="text.secondary">
          Aquí podrás revisar el historial de ventas y reportes.
        </Typography>
      </Paper>
    </Box>
  );
}
