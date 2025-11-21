import { Dialog, DialogContent, DialogActions, Button, Box, Typography, Divider } from "@mui/material";
import PrintIcon from "@mui/icons-material/Print";
import PrintOutlinedIcon from "@mui/icons-material/PrintOutlined";
import { useRef } from "react";

interface VoucherProps {
  open: boolean;
  onClose: () => void;
  datosVenta: {
    id_venta: number;
    fecha: string;
    vendedor: string;
    items: any[];
    total: number;
    pagos: any[];
  } | null;
}

export const VoucherModal = ({ open, onClose, datosVenta }: VoucherProps) => {
  const voucherRef = useRef<HTMLDivElement>(null);

  if (!datosVenta) return null;

  // =============================
  // GENERADOR TEXTO 57mm + DOBLE COPIA
  // =============================
  const generarTextoVoucher57mm = (venta: any) => {
    const fmt = (n: number) => new Intl.NumberFormat("es-CL").format(n);

    const line = (txt = "") => txt.padEnd(32, " ") + "\n";
    const sep = "-".repeat(32) + "\n";

    let out = "";
    out += line("BOTILLERÍA EL PARAISO");
    out += line("Santo Domingo 2557");
    out += sep;
    out += line(`Folio: #${venta.id_venta}`);
    out += line(`Fecha: ${venta.fecha}`);
    out += line(`Vendedor: ${venta.vendedor}`);
    out += sep;

    venta.items.forEach((item: any) => {
      const nombre = item.nombre_producto + (item.es_promo ? " (P)" : "");
      const total = (item.precio_final ?? item.precio_producto) * item.cantidad;

      out += `${item.cantidad} x ${nombre}\n`;
      out += line(`$${fmt(total)}`);
    });

    out += sep;
    out += line(`TOTAL: $${fmt(venta.total)}`);
    out += sep;

    out += "Formas de pago:\n";
    venta.pagos.forEach((p: any) => {
      out += line(`- ${p.tipo}: $${fmt(p.monto)}`);
    });

    out += sep;
    out += line("¡Gracias por su compra!");
    out += "\n\n\n";

    // 👉 Doble copia
    return out + out;
  };

  // =============================
  // IMPRESIÓN RAWBT (Silent Mode)
  // =============================
  const handlePrintRawBT = () => {
    const text = generarTextoVoucher57mm(datosVenta);

    const intent =
      `intent://print/#Intent;` +
      `scheme=rawbt;` +
      `package=ru.a402d.rawbtprinter;` +
      `S.text=${encodeURIComponent(text)};` +
      `end`;

    window.location.href = intent;
  };

  // =============================
  // IMPRESIÓN NAVEGADOR (Admin)
  // =============================
  const handlePrint = () => {
    window.print();
  };

  const fmt = (n: number) => new Intl.NumberFormat("es-CL").format(n);

  return (
    <>
      <style>
        {`
          @media print {
            body * {
              visibility: hidden;
            }
            #area-impresion, #area-impresion * {
              visibility: visible;
            }
            #area-impresion {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              margin: 0;
              padding: 0;
            }
            .no-print {
              display: none !important;
            }
          }
        `}
      </style>

      <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth scroll="body">
        <DialogContent sx={{ p: 0, bgcolor: "white" }}>
          <Box
            id="area-impresion"
            ref={voucherRef}
            sx={{
              p: 3,
              fontFamily: '"Courier New", Courier, monospace',
              color: "black",
              textAlign: "center",
            }}
          >
            <Typography variant="h6" fontWeight="bold" textTransform="uppercase">
              BOTILLERÍA EL PARAISO
            </Typography>
            <Typography variant="caption" display="block">Santo Domingo 2557</Typography>

            <Divider sx={{ my: 1, borderStyle: "dashed" }} />

            <Box textAlign="left">
              <Typography variant="caption" display="block">
                <strong>Folio:</strong> #{datosVenta.id_venta}
              </Typography>
              <Typography variant="caption" display="block">
                <strong>Fecha:</strong> {datosVenta.fecha}
              </Typography>
              <Typography variant="caption" display="block">
                <strong>Atendido por:</strong> {datosVenta.vendedor}
              </Typography>
            </Box>

            <Divider sx={{ my: 1, borderStyle: "dashed" }} />

            <Box textAlign="left">
              <table style={{ width: "100%", fontSize: "12px" }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: "left" }}>Cant.</th>
                    <th style={{ textAlign: "left" }}>Prod.</th>
                    <th style={{ textAlign: "right" }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {datosVenta.items.map((item: any, i: number) => (
                    <tr key={i}>
                      <td>{item.cantidad}</td>
                      <td style={{ paddingRight: 5 }}>
                        {item.nombre_producto} {item.es_promo ? "(P)" : ""}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        ${fmt((item.precio_final ?? item.precio_producto) * item.cantidad)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Box>

            <Divider sx={{ my: 1, borderStyle: "dashed" }} />

            <Box sx={{ display: "flex", justifyContent: "space-between", mt: 1 }}>
              <Typography variant="body2" fontWeight="bold">
                TOTAL A PAGAR:
              </Typography>
              <Typography variant="h6" fontWeight="bold">
                ${fmt(datosVenta.total)}
              </Typography>
            </Box>

            <Box textAlign="left" mt={1}>
              <Typography variant="caption" fontWeight="bold">
                FORMAS DE PAGO:
              </Typography>
              {datosVenta.pagos.map((p: any, idx: number) => (
                <Typography key={idx} variant="caption" display="block">
                  - {p.tipo}: ${fmt(p.monto)}
                </Typography>
              ))}
            </Box>

            <Divider sx={{ my: 2, borderStyle: "dashed" }} />

            <Typography variant="caption" display="block">
              ¡GRACIAS POR SU PREFERENCIA!
            </Typography>
            <Typography variant="caption" display="block">
              Conserve este comprobante.
            </Typography>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2, bgcolor: "#f5f5f5" }} className="no-print">
          <Button onClick={onClose} color="inherit">
            Cerrar
          </Button>

          {/* Impresión RAWBT Térmica (Silent Mode) */}
          <Button
            onClick={handlePrintRawBT}
            variant="contained"
            startIcon={<PrintOutlinedIcon />}
            sx={{ bgcolor: "green", "&:hover": { bgcolor: "darkgreen" } }}
          >
            Imprimir Térmica
          </Button>

          {/* Impresión Navegador */}
          <Button
            onClick={handlePrint}
            variant="contained"
            startIcon={<PrintIcon />}
            sx={{ bgcolor: "black", "&:hover": { bgcolor: "#333" } }}
          >
            Imprimir Navegador
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
