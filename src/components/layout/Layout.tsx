import { Outlet, Link, useLocation } from "react-router-dom";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

import {
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  AppBar,
  Toolbar,
  Typography,
  Avatar,
  Menu,
  MenuItem,
  Paper
} from "@mui/material";

import {
  IconLayoutDashboard,
  IconPackage,
  IconShoppingCart,
  IconLogout
} from "@tabler/icons-react";

import { useState } from "react";
import { useAuthStore } from "../../store/authStore";

const drawerWidth = 230;

const menuItems = [
  { label: "Dashboard", path: "/", icon: <IconLayoutDashboard size={22} stroke={1.6} /> },
  { label: "Productos", path: "/productos", icon: <IconPackage size={22} stroke={1.6} /> },
  { label: "Ventas", path: "/ventas", icon: <IconShoppingCart size={22} stroke={1.6} /> }
];

export default function Layout() {
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const openMenu = Boolean(anchorEl);

  const handleOpenMenu = (e: any) => setAnchorEl(e.currentTarget);
  const handleCloseMenu = () => setAnchorEl(null);

  const handleLogout = () => {
    logout();
    localStorage.removeItem("crm-session");
    window.location.href = "/login";
  };

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#f5f5f9" }}>

      {/* SIDEBAR PREMIUM */}
      <Paper
        elevation={4}
        sx={{
          width: drawerWidth,
          height: "100vh",
          position: "fixed",
          top: 0,
          left: 0,
          borderTopRightRadius: "26px",
          borderBottomRightRadius: "26px",
          bgcolor: "white",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          p: 3,
          boxShadow: "4px 0 20px rgba(0,0,0,0.05)",
        }}
      >
        {/* Logo */}
        <Box
          sx={{
            width: 70,
            height: 70,
            bgcolor: "#6D79FF",
            borderRadius: "16px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            mb: 2,
            boxShadow: "0 4px 10px rgba(109,93,252,0.3)",
          }}
        >
          <Typography
            variant="h4"
            sx={{
              color: "white",
              fontWeight: 600,
              fontSize: "34px",
              lineHeight: "34px",
            }}
          >
            P
          </Typography>
        </Box>

        {/* Título */}
        <Typography
          sx={{
            fontSize: "20px",
            fontWeight: 600,
            color: "#333",
            textAlign: "center",
          }}
        >
          Botillería El Paraíso
        </Typography>

        {/* Subtítulo */}
        <Typography
          sx={{
            fontSize: "13px",
            fontWeight: 400,
            color: "#888",
            mb: 5,
            textAlign: "center",
          }}
        >
          Administración
        </Typography>

        {/* MENÚ */}
        <List sx={{ width: "100%", mt: 2 }}>
          {menuItems.map((item) => {
            const selected = location.pathname === item.path;

            return (
              <ListItemButton
                key={item.path}
                component={Link}
                to={item.path}
                selected={selected}
                sx={{
                  borderRadius: "14px",
                  py: 1.3,
                  px: 2,
                  mb: 1.3,
                  transition: "0.2s ease",
                  bgcolor: selected ? "rgba(105,92,254,0.12)" : "transparent",
                  "&:hover": { bgcolor: "rgba(105,92,254,0.08)" },
                }}
              >
                <ListItemIcon
                  sx={{
                    color: "#6D79FF",
                    minWidth: 36,
                    "& svg": { fontSize: "1.4rem" },
                  }}
                >
                  {item.icon}
                </ListItemIcon>

                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontWeight: selected ? 600 : 500,
                    fontSize: "15px",
                  }}
                />
              </ListItemButton>
            );
          })}
        </List>

        {/* Botón Salir */}
        <Box sx={{ mt: "auto", width: "100%" }}>
          <ListItemButton
            onClick={handleLogout}
            sx={{
              mt: 3,
              bgcolor: "#695cfe",
              color: "white",
              borderRadius: "999px",
              py: 1.4,
              textAlign: "center",
              justifyContent: "center",
              "&:hover": { bgcolor: "#5a4ee3" },
              fontWeight: 600,
            }}
          >
            <IconLogout size={20} stroke={1.7} style={{ marginRight: "8px" }} />
            Salir
          </ListItemButton>
        </Box>
      </Paper>

      {/* CONTENIDO PRINCIPAL */}
      <Box
        sx={{
          flexGrow: 1,
          ml: `${drawerWidth}px`,
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
        }}
      >
        {/* TOPBAR MINIMALISTA */}
        <AppBar
          elevation={1}
          position="fixed"
          sx={{
            ml: `${drawerWidth + 20}px`,  
            width: `calc(100% - ${drawerWidth + 20}px)`,
            bgcolor: "#ffffffcc",
            backdropFilter: "blur(10px)",
            color: "#333",
            borderRadius: "0 0 20px 20px",
            boxShadow: "0px 4px 12px rgba(0,0,0,0.05)",
          }}
        >
          <Toolbar sx={{  display: "flex", justifyContent: "space-between" }}>
            <Typography variant="h6" fontWeight={600} sx={{ color: "#695cfe" }}>
              CRM Botillería
            </Typography>

            {/* Avatar + Menu */}
           <Box
  sx={{ display: "flex", alignItems: "center", cursor: "pointer" }}
  onClick={handleOpenMenu}
>
  <Avatar sx={{ bgcolor: "#695cfe", mr: 1 }}>
    {(user?.nombre_usuario?.charAt(0) ?? "A").toUpperCase()}
  </Avatar>

  <Typography>{user?.nombre_usuario}</Typography>

  <ExpandMoreIcon sx={{ ml: 1 }} />
</Box>


            <Menu anchorEl={anchorEl} open={openMenu} onClose={handleCloseMenu}>
              <MenuItem onClick={handleLogout}>Cerrar sesión</MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>

        <Toolbar />

        {/* CONTENIDO */}
        <Box sx={{ p: 4, pt: 6, flexGrow: 1, width: "100%"}}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
