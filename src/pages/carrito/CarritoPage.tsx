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
} from "@mui/material";
import { IconTrash, IconPlus, IconMinus, IconLogout } from "@tabler/icons-react";
import { productosApi } from "../../api/productosApi";
import { ventasApi } from "../../api/ventasApi";
import { useAuthStore } from "../../store/authStore";



// Formateador CLP
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
}

interface CartItem extends Producto {
  cantidad: number;
}

// Métodos de pago
const METODOS_PAGO = ["EFECTIVO", "GIRO", "DEBITO", "CREDITO", "TRANSFERENCIA"] as const;
type MetodoPago = (typeof METODOS_PAGO)[number];

interface Pago {
  tipo: MetodoPago;
  monto: number;
}

type TipoAlerta = "warning" | "error" | "info";

export default function CarritoPage() {
  // Código escaneado
  const [codigo, setCodigo] = useState("");

  const logout = useAuthStore((state) => state.logout);


  //Obtener usuario actual
  const user = useAuthStore((state) => state.user);

  // Carrito
  const [carrito, setCarrito] = useState<CartItem[]>([]);

  // Modal cantidad
  const [openCantidad, setOpenCantidad] = useState(false);
  const [itemSeleccionado, setItemSeleccionado] = useState<CartItem | null>(null);
  const [cantidadInput, setCantidadInput] = useState("");

  // Modal pago
  const [openPago, setOpenPago] = useState(false);
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [nuevoPagoTipo, setNuevoPagoTipo] = useState<MetodoPago>("EFECTIVO");
  const [nuevoPagoMonto, setNuevoPagoMonto] = useState("");

  // Alerta visual (Snackbar)
  const [alerta, setAlerta] = useState<{
    open: boolean;
    mensaje: string;
    tipo: TipoAlerta;
  }>({
    open: false,
    mensaje: "",
    tipo: "warning",
  });

  const mostrarAlerta = (mensaje: string, tipo: TipoAlerta = "warning") => {
    setAlerta({ open: true, mensaje, tipo });
  };

  // ============================
  // Totales
  // ============================
  const totalExento = useMemo(
    () =>
      carrito.reduce(
        (acc, item) =>
          item.exento_iva === 1
            ? acc + item.precio_producto * item.cantidad
            : acc,
        0
      ),
    [carrito]
  );

  const totalAfecto = useMemo(
    () =>
      carrito.reduce(
        (acc, item) =>
          item.exento_iva === 0
            ? acc + item.precio_producto * item.cantidad
            : acc,
        0
      ),
    [carrito]
  );

  const totalGeneral = totalAfecto + totalExento;

  const totalPagado = useMemo(
    () => pagos.reduce((acc, p) => acc + p.monto, 0),
    [pagos]
  );

  const saldoRestante = totalGeneral - totalPagado;

  const totalNoEfectivo = useMemo(
    () =>
      pagos
        .filter(
          (p) =>
            p.tipo !== "EFECTIVO" &&
            p.tipo !== "GIRO"
        )
        .reduce((acc, p) => acc + p.monto, 0),
    [pagos]
  );

  // ============================
  // Escanear / agregar producto
  // ============================
  const handleAgregarPorCodigo = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = codigo.trim();
    if (!code) return;

    try {
      const producto: Producto = await productosApi.getByCodigo(code);

      if (!producto) {
        mostrarAlerta("Producto no encontrado.", "info");
        return;
      }

      setCarrito((prev) => {
        const idx = prev.findIndex((i) => i.id === producto.id);
        if (idx !== -1) {
          // ya existe → sumar cantidad
          const copia = [...prev];
          copia[idx] = {
            ...copia[idx],
            cantidad: copia[idx].cantidad + 1,
          };
          return copia;
        }

        // agregar nuevo
        return [
          ...prev,
          {
            ...producto,
            cantidad: 1,
          },
        ];
      });

      setCodigo("");
    } catch (error) {
      console.error(error);
      mostrarAlerta("Error al buscar producto.", "error");
    }
  };

  // ============================
  // Modificar cantidad (+/-)
  // ============================
  const handleIncrement = (id: number) => {
    setCarrito((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, cantidad: item.cantidad + 1 }
          : item
      )
    );
  };

  const handleDecrement = (id: number) => {
    setCarrito((prev) =>
      prev
        .map((item) =>
          item.id === id
            ? { ...item, cantidad: Math.max(1, item.cantidad - 1) }
            : item
        )
    );
  };

  const handleEliminar = (id: number) => {
    if (!confirm("¿Eliminar este producto del carrito?")) return;
    setCarrito((prev) => prev.filter((item) => item.id !== id));
  };

  // ============================
  // Editar cantidad con modal
  // ============================
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
    if (valor === "DEL") {
      setCantidadInput((prev) => prev.slice(0, -1));
    } else if (valor === "CLR") {
      setCantidadInput("");
    } else {
      setCantidadInput((prev) => (prev === "0" ? valor : prev + valor));
    }
  };

  const confirmarCantidad = () => {
    const nuevaCant = parseInt(cantidadInput, 10);
    if (isNaN(nuevaCant) || nuevaCant <= 0) {
      mostrarAlerta("Cantidad inválida.", "warning");
      return;
    }

    if (itemSeleccionado) {
      setCarrito((prev) =>
        prev.map((item) =>
          item.id === itemSeleccionado.id
            ? { ...item, cantidad: nuevaCant }
            : item
        )
      );
    }
    cerrarModalCantidad();
  };

  // ============================
  // Finalizar venta / pagos
  // ============================
  const abrirModalPago = () => {
    if (!carrito.length) {
      mostrarAlerta("No hay productos en el carrito.", "info");
    } else {
      setOpenPago(true);
    }
  };

  const cerrarModalPago = () => {
    setOpenPago(false);
    setPagos([]);
    setNuevoPagoMonto("");
    setNuevoPagoTipo("EFECTIVO");
  };

  const agregarPago = () => {
    const monto = parseInt(nuevoPagoMonto, 10);
    if (isNaN(monto) || monto <= 0) {
      mostrarAlerta("Monto inválido.", "warning");
      return;
    }

    // Restricción: pagos NO efectivos (ni giro) solo pueden cubrir afecto
    const esNoEfectivo =
      nuevoPagoTipo === "DEBITO" ||
      nuevoPagoTipo === "CREDITO" ||
      nuevoPagoTipo === "TRANSFERENCIA";

    if (esNoEfectivo) {
      const posibleTotalNoEfectivo = totalNoEfectivo + monto;
      if (posibleTotalNoEfectivo > totalAfecto) {
        mostrarAlerta(
          "El monto con este método de pago excede el total permitido por productos afectos. Los productos exentos solo pueden pagarse en efectivo o giro.",
          "warning"
        );
        return;
      }
    }

    if (monto > saldoRestante) {
      mostrarAlerta("El monto ingresado excede el saldo restante.", "warning");
      return;
    }

    setPagos((prev) => [...prev, { tipo: nuevoPagoTipo, monto }]);
    setNuevoPagoMonto("");
  };

 const confirmarVenta = async () => {
  if (saldoRestante !== 0) {
    mostrarAlerta("Aún queda saldo pendiente, no se puede cerrar la venta.", "warning");
    return;
  }
  
   if (!user) {
    mostrarAlerta("No hay usuario activo.", "error");
    return;
  }

 const payload = {
  id_usuario: user.id_usuario,  
  total_general: totalGeneral,
  total_afecto: totalAfecto,
  total_exento: totalExento,
  pagos: pagos,
  items: carrito.map(i => ({
    id_producto: i.id,
    cantidad: i.cantidad,
    precio_unitario: i.precio_producto,
    exento_iva: i.exento_iva
  }))
};


  try {
    await ventasApi.create(payload);

    mostrarAlerta("Venta registrada correctamente.", "info");

    // limpiar todo
    setCarrito([]);
    cerrarModalPago();
  } catch (error) {
    console.error(error);
    mostrarAlerta("Error al registrar la venta.", "error");
  }
};



  // ============================
  // UI
  // ============================
  return (
  <Box sx={{ width: "100%", mt: 1 }}>
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "0.4fr 1fr" },
        gap: 3,
      }}
    >
      {/* IZQUIERDA: scanner + totales */}
      <Box>
        <Paper
          sx={{
            p: 3,
            mb: 3,
            borderRadius: "16px",
          }}
        >
          <Typography variant="h6" fontWeight={700} mb={2}>
            Escaneo de productos
          </Typography>

          <form onSubmit={handleAgregarPorCodigo}>
            <TextField
              autoFocus
              fullWidth
              label="Código de barras"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              InputProps={{
                sx: { borderRadius: "12px" },
              }}
            />
            <Button
              type="submit"
              variant="contained"
              fullWidth
              sx={{
                mt: 2,
                py: 1.2,
                borderRadius: "12px",
                bgcolor: "#695cfe",
                fontWeight: 600,
                textTransform: "none",
                "&:hover": { bgcolor: "#5a4ee3" },
              }}
            >
              Agregar
            </Button>
          </form>

          <Typography variant="body2" sx={{ mt: 1.5, color: "#777" }}>
            Puede escanear con la pistola o ingresar el código manualmente.
          </Typography>
        </Paper>

        {/* Totales */}
        <Paper
          sx={{
            p: 3,
            borderRadius: "16px",
          }}
        >
          <Typography variant="subtitle1" fontWeight={700} mb={1}>
            Resumen
          </Typography>

          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
            <Typography color="text.secondary">Total afecto</Typography>
            <Typography>{formatCLP(totalAfecto)}</Typography>
          </Box>

          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
            <Typography color="text.secondary">Total exento</Typography>
            <Typography>{formatCLP(totalExento)}</Typography>
          </Box>

          <Box
            sx={{
              mt: 2,
              pt: 1.5,
              borderTop: "1px solid #eee",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <Typography fontWeight={700}>Total venta</Typography>
            <Typography fontWeight={700} color="primary">
              {formatCLP(totalGeneral)}
            </Typography>
          </Box>

          <Button
            variant="contained"
            fullWidth
            sx={{
              mt: 3,
              py: 1.3,
              borderRadius: "12px",
              fontWeight: 700,
              textTransform: "none",
            }}
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
  sx={{
    mt: 2,
    py: 1.2,
    borderRadius: "12px",
    textTransform: "none",
    fontWeight: 600,
    color: "#d32f2f",
    borderColor: "#d32f2f",
    "&:hover": { borderColor: "#b71c1c", color: "#b71c1c" },
  }}
>
  Salir
</Button>
      </Box>

      {/* DERECHA: tabla carrito */}
      <Box sx={{  }}>
        <Paper sx={{ p: 2.5, borderRadius: "16px" }}>
          <Typography variant="h6" fontWeight={700} mb={2}>
            Carrito de compra
          </Typography>

          <Table size="small">
            <TableHead sx={{ bgcolor: "#f3f1ff" }}>
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
              {carrito.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Typography fontWeight={500}>
                      {item.nombre_producto}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {item.codigo_producto}
                    </Typography>
                  </TableCell>

                  <TableCell align="center">
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 1,
                      }}
                    >
                      <IconButton size="small" onClick={() => handleDecrement(item.id)}>
                        <IconMinus size={16} />
                      </IconButton>

                      <Button
                        size="small"
                        variant="outlined"
                        sx={{
                          minWidth: 40,
                          borderRadius: "10px",
                          px: 1,
                          textTransform: "none",
                        }}
                        onClick={() => abrirModalCantidad(item)}
                      >
                        {item.cantidad}
                      </Button>

                      <IconButton size="small" onClick={() => handleIncrement(item.id)}>
                        <IconPlus size={16} />
                      </IconButton>
                    </Box>
                  </TableCell>

                  <TableCell align="right">
                    {formatCLP(item.precio_producto)}
                  </TableCell>
                  <TableCell align="right">
                    {formatCLP(item.precio_producto * item.cantidad)}
                  </TableCell>

                  <TableCell align="center">
                    {item.exento_iva === 1 ? "Sí" : "No"}
                  </TableCell>

                  <TableCell align="center">
                    <IconButton color="error" size="small" onClick={() => handleEliminar(item.id)}>
                      <IconTrash size={18} />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}

              {!carrito.length && (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography color="text.secondary">
                      No hay productos en el carrito.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Paper>
      </Box>
    </Box>

    {/* MODAL CANTIDAD */}
    <Dialog open={openCantidad} onClose={cerrarModalCantidad} maxWidth="xs" fullWidth>
      <DialogTitle>Modificar cantidad</DialogTitle>
      <DialogContent>
        <Typography mb={2}>{itemSeleccionado?.nombre_producto}</Typography>

        <TextField
          fullWidth
          value={cantidadInput}
          sx={{ mb: 2 }}
          InputProps={{
            sx: { fontSize: "24px", textAlign: "center", borderRadius: "12px" },
          }}
        />

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 1,
          }}
        >
          {["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"].map((num) => (
            <Button
              key={num}
              variant="outlined"
              onClick={() => handleTeclaCantidad(num)}
              sx={{ py: 1.5, fontSize: "18px" }}
            >
              {num}
            </Button>
          ))}
          <Button variant="outlined" onClick={() => handleTeclaCantidad("DEL")}>
            Borrar
          </Button>
          <Button variant="outlined" onClick={() => handleTeclaCantidad("CLR")}>
            Limpiar
          </Button>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={cerrarModalCantidad}>Cancelar</Button>
        <Button variant="contained" onClick={confirmarCantidad}>
          Aceptar
        </Button>
      </DialogActions>
    </Dialog>

    {/* MODAL PAGO */}
    <Dialog open={openPago} onClose={cerrarModalPago} maxWidth="md" fullWidth>
      <DialogTitle>Finalizar venta</DialogTitle>
      <DialogContent>
        <Typography fontWeight={600} mb={1}>
          Resumen de productos
        </Typography>

        <Box sx={{ maxHeight: 200, overflowY: "auto", mb: 2 }}>
          {carrito.map((item) => (
            <Box
              key={item.id}
              sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}
            >
              <Typography variant="body2">
                {item.cantidad} x {item.nombre_producto}
                {item.exento_iva === 1 && " (Exento)"}
              </Typography>
              <Typography variant="body2">
                {formatCLP(item.precio_producto * item.cantidad)}
              </Typography>
            </Box>
          ))}
        </Box>

        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <Typography color="text.secondary">Total afecto</Typography>
            <Typography>{formatCLP(totalAfecto)}</Typography>
          </Box>

          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <Typography color="text.secondary">Total exento</Typography>
            <Typography>{formatCLP(totalExento)}</Typography>
          </Box>

          <Box
            sx={{
              mt: 1,
              pt: 1,
              borderTop: "1px solid #eee",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <Typography fontWeight={700}>Total venta</Typography>
            <Typography fontWeight={700}>
              {formatCLP(totalGeneral)}
            </Typography>
          </Box>
        </Box>

        {/* Pagos */}
        <Typography fontWeight={600} mb={1}>
          Pagos
        </Typography>

        <Box
          sx={{
            display: "flex",
            gap: 2,
            mb: 2,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <Select
            value={nuevoPagoTipo}
            onChange={(e) => setNuevoPagoTipo(e.target.value as MetodoPago)}
            size="small"
            sx={{ minWidth: 140 }}
          >
            {METODOS_PAGO.map((metodo) => (
              <MenuItem key={metodo} value={metodo}>
                {metodo}
              </MenuItem>
            ))}
          </Select>

          <TextField
            label="Monto"
            size="small"
            value={nuevoPagoMonto}
            onChange={(e) => setNuevoPagoMonto(e.target.value.replace(/\D/g, ""))}
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
            }}
          />

          {/* BOTÓN INTELIGENTE: usar total permitido */}
          <Button
            variant="outlined"
            onClick={() => {
              if (nuevoPagoTipo === "EFECTIVO" || nuevoPagoTipo === "GIRO") {
                setNuevoPagoMonto(String(totalGeneral - totalPagado));
              } else {
                setNuevoPagoMonto(String(totalAfecto - totalNoEfectivo));
              }
            }}
          >
            Usar total
          </Button>

          <Button variant="outlined" onClick={agregarPago}>
            Agregar pago
          </Button>
        </Box>

        {/* Lista de pagos */}
        {pagos.map((p, idx) => (
          <Box key={idx} sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
            <Typography variant="body2">{p.tipo}</Typography>
            <Typography variant="body2">{formatCLP(p.monto)}</Typography>
          </Box>
        ))}

        <Box
          sx={{
            mt: 2,
            pt: 1,
            borderTop: "1px solid #eee",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <Typography>Pagado</Typography>
          <Typography>{formatCLP(totalPagado)}</Typography>
        </Box>

        <Box sx={{ mt: 1, display: "flex", justifyContent: "space-between" }}>
          <Typography fontWeight={700}>Saldo restante</Typography>
          <Typography
            fontWeight={700}
            color={saldoRestante === 0 ? "green" : "error"}
          >
            {formatCLP(saldoRestante)}
          </Typography>
        </Box>

        <Typography variant="caption" color="text.secondary">
          Recuerda: productos exentos solo pueden pagarse con efectivo o giro.
        </Typography>
      </DialogContent>

      <DialogActions>
        <Button onClick={cerrarModalPago}>Cancelar</Button>
        <Button
          variant="contained"
          onClick={confirmarVenta}
          disabled={saldoRestante !== 0}
        >
          Confirmar venta
        </Button>
      </DialogActions>
       </Dialog>

    {/* SNACKBAR DE ALERTAS */}
    <Snackbar
      open={alerta.open}
      autoHideDuration={3000}
      onClose={() => setAlerta({ ...alerta, open: false })}
      anchorOrigin={{ vertical: "top", horizontal: "center" }}
    >
      <Alert
        onClose={() => setAlerta({ ...alerta, open: false })}
        severity={alerta.tipo}
        sx={{ width: "100%" }}
      >
        {alerta.mensaje}
      </Alert>
    </Snackbar>

  </Box>
  );
}
