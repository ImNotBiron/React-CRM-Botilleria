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

  const fmt = (n: number) => new Intl.NumberFormat("es-CL").format(n);

  // ===========================================================
  // 1. GENERADOR DE TEXTO PLANO PARA IMPRESORA TÉRMICA (57mm)
  // ===========================================================
  const generarTextoVoucher57mm = (venta: any) => {
    const ANCHO_PAPEL = 32; // Caracteres por línea (ajustar a 32 o 48 según impresora)
    
    // Funciones de formato de texto
    const centrar = (str: string) => {
      const espacios = Math.max(0, Math.floor((ANCHO_PAPEL - str.length) / 2));
      return " ".repeat(espacios) + str + "\n";
    };
    
    const lineaPar = (izq: string, der: string) => {
      const espacios = Math.max(0, ANCHO_PAPEL - izq.length - der.length);
      return izq + " ".repeat(espacios) + der + "\n";
    };

    const separador = "-".repeat(ANCHO_PAPEL) + "\n";

    let ticket = "";

    // CABECERA
    ticket += centrar("BOTILLERIA EL PARAISO");
    ticket += centrar("Santo Domingo 2557");
    ticket += separador;
    ticket += `Folio: #${venta.id_venta}\n`;
    ticket += `Fecha: ${venta.fecha}\n`;
    ticket += `Vend:  ${venta.vendedor}\n`;
    ticket += separador;

    // DETALLE
    ticket += "CANT DESCRIPCION          TOTAL\n";
    ticket += separador;

    venta.items.forEach((item: any) => {
      const precioUnit = item.precio_final ?? item.precio_producto;
      const totalItem = precioUnit * item.cantidad;
      
      // Nombre producto recortado si es muy largo
      const nombre = (item.nombre_producto + (item.es_promo ? "(P)" : "")).substring(0, 18);
      
      // Formato: "2  x Coca Cola...      $2.000"
      const izq = `${item.cantidad} x ${nombre}`;
      const der = `$${fmt(totalItem)}`;
      
      ticket += lineaPar(izq, der);
    });

    ticket += separador;

    // TOTALES
    ticket += lineaPar("TOTAL A PAGAR:", `$${fmt(venta.total)}`);
    ticket += separador;

    // FORMAS DE PAGO
    ticket += "Pagado con:\n";
    venta.pagos.forEach((p: any) => {
      ticket += lineaPar(`- ${p.tipo}`, `$${fmt(p.monto)}`);
    });

    // PIE DE PÁGINA
    ticket += "\n";
    ticket += centrar("¡GRACIAS POR SU COMPRA!");
    ticket += centrar("Copia Cliente");
    ticket += "\n\n"; // Espacio para corte

    return ticket;
  };

  // ===========================================================
  // 2. IMPRESIÓN TÉRMICA (Usando App RawBT)
  // ===========================================================
  const handlePrintRawBT = () => {
    const textoTicket = generarTextoVoucher57mm(datosVenta);
    
    // Codificamos en Base64 para evitar problemas con tildes o caracteres especiales en la URL
    const base64Data = btoa(unescape(encodeURIComponent(textoTicket)));
    
    // Esquema URL oficial de RawBT
    const url = `rawbt:base64,${base64Data}`;

    // Abrimos la app externa
    window.location.href = url;
  };

  // ===========================================================
  // 3. IMPRESIÓN ESTÁNDAR (Navegador / PDF)
  // ===========================================================
  const handlePrintWeb = () => {
    window.print();
  };

  return (
    <>
      {/* ESTILOS PARA WINDOW.PRINT (Solo PDF Web) */}
      <style>
        {`
          @media print {
            body * { visibility: hidden; }
            #area-impresion, #area-impresion * { visibility: visible; }
            #area-impresion {
              position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0;
            }
            .no-print { display: none !important; }
          }
        `}
      </style>

      <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth scroll="body">
        <DialogContent sx={{ p: 0, bgcolor: "white" }}>
          
          {/* VISTA PREVIA EN PANTALLA (HTML) */}
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
              <Typography variant="caption" display="block"><strong>Folio:</strong> #{datosVenta.id_venta}</Typography>
              <Typography variant="caption" display="block"><strong>Fecha:</strong> {datosVenta.fecha}</Typography>
              <Typography variant="caption" display="block"><strong>Vendedor:</strong> {datosVenta.vendedor}</Typography>
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
                      <td style={{ verticalAlign: 'top' }}>{item.cantidad}</td>
                      <td style={{ paddingRight: 5 }}>
                        {item.nombre_producto} {item.es_promo ? "(P)" : ""}
                      </td>
                      <td style={{ textAlign: "right", verticalAlign: 'top' }}>
                        ${fmt((item.precio_final ?? item.precio_producto) * item.cantidad)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Box>

            <Divider sx={{ my: 1, borderStyle: "dashed" }} />

            <Box sx={{ display: "flex", justifyContent: "space-between", mt: 1 }}>
              <Typography variant="body2" fontWeight="bold">TOTAL:</Typography>
              <Typography variant="h6" fontWeight="bold">${fmt(datosVenta.total)}</Typography>
            </Box>

            <Box textAlign="left" mt={1}>
              <Typography variant="caption" fontWeight="bold">FORMAS DE PAGO:</Typography>
              {datosVenta.pagos.map((p: any, idx: number) => (
                <Typography key={idx} variant="caption" display="block">
                  - {p.tipo}: ${fmt(p.monto)}
                </Typography>
              ))}
            </Box>

            <Divider sx={{ my: 2, borderStyle: "dashed" }} />
            <Typography variant="caption" display="block">¡GRACIAS POR SU PREFERENCIA!</Typography>
          </Box>
        </DialogContent>

        {/* BOTONES DE ACCIÓN */}
        <DialogActions sx={{ p: 2, bgcolor: "#f5f5f5", display: 'flex', gap: 1 }} className="no-print">
          <Button onClick={onClose} color="inherit">
            Cerrar
          </Button>

          {/* BOTÓN PRINCIPAL (TABLET / RAWBT) */}
          <Button
            onClick={handlePrintRawBT}
            variant="contained"
            startIcon={<PrintOutlinedIcon />}
            color="success"
            sx={{ flexGrow: 1, fontWeight: 'bold' }}
          >
            IMPRIMIR TÉRMICA
          </Button>

          {/* BOTÓN SECUNDARIO (PC / PDF) */}
          <Button
            onClick={handlePrintWeb}
            variant="outlined"
            startIcon={<PrintIcon />}
            sx={{ color: 'text.secondary', borderColor: 'divider' }}
          >
            PDF
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};