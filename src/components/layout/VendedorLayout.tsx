import { Outlet } from "react-router-dom";
import { Box } from "@mui/material";

export default function VendedorLayout() {
  return (
    <Box
      sx={{
        width: "100vw",
        minHeight: "100vh",
        padding: 2,
        overflowX: "hidden",
        bgcolor: "#f5f6fa", // si quieres
      }}
    >
      <Outlet />
    </Box>
  );
}
