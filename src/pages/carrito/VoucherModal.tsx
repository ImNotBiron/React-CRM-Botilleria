import { Dialog, DialogContent, DialogActions, Button, Box, Typography, Divider } from "@mui/material";
import PrintIcon from "@mui/icons-material/Print";
import CloseIcon from "@mui/icons-material/Close";
import { useRef } from "react";

// Tipos de datos que necesitamos para pintar el voucher
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

  // Función mágica para imprimir
  const handlePrint = () => {
    // 1. Crear un iframe oculto o ventana nueva es lo ideal, 
    // pero para tablet simple, el window.print() con CSS @media print funciona bien.
    window.print();
  };

  // Formateador de moneda simple
  const fmt = (n: number) => new Intl.NumberFormat("es-CL").format(n);

  return (
    <>
      {/* ESTILOS DE IMPRESIÓN (Solo se activan al imprimir) */}
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
              width: 100%; /* O 80mm si es impresora térmica directa */
              margin: 0;
              padding: 0;
            }
            /* Ocultar botones del modal al imprimir */
            .no-print {
              display: none !important;
            }
          }
        `}
      </style>

      <Dialog 
        open={open} 
        onClose={onClose} 
        maxWidth="xs" 
        fullWidth
        scroll="body"
      >
        <DialogContent sx={{ p: 0, bgcolor: 'white' }}>
          
          {/* === ÁREA DEL VOUCHER (Lo que sale en el papel) === */}
          <Box 
            id="area-impresion" 
            ref={voucherRef}
            sx={{ 
              p: 3, 
              fontFamily: '"Courier New", Courier, monospace', // Fuente tipo ticket
              color: 'black',
              textAlign: 'center'
            }}
          >
            {/* CABECERA */}
            <Typography variant="h6" fontWeight="bold" textTransform="uppercase">
              BOTILLERÍA EL PARAISO
            </Typography>
            <Typography variant="caption" display="block">Santo Domingo 2557</Typography>
            
            <Divider sx={{ my: 1, borderStyle: 'dashed' }} />
            
            {/* DATOS VENTA */}
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

            <Divider sx={{ my: 1, borderStyle: 'dashed' }} />

            {/* DETALLE ITEMS */}
            <Box textAlign="left">
              <table style={{ width: '100%', fontSize: '12px' }}>
                <thead>
                  <tr>
                    <th style={{textAlign:'left'}}>Cant.</th>
                    <th style={{textAlign:'left'}}>Prod.</th>
                    <th style={{textAlign:'right'}}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {datosVenta.items.map((item: any, i: number) => (
                    <tr key={i}>
                      <td style={{verticalAlign:'top'}}>{item.cantidad}</td>
                      <td style={{verticalAlign:'top', paddingRight:5}}>
                        {item.nombre_producto} {item.es_promo ? '(P)' : ''}
                      </td>
                      <td style={{textAlign:'right', verticalAlign:'top'}}>
                        ${fmt((item.precio_final ?? item.precio_producto) * item.cantidad)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Box>

            <Divider sx={{ my: 1, borderStyle: 'dashed' }} />

            {/* TOTALES */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
              <Typography variant="body2" fontWeight="bold">TOTAL A PAGAR:</Typography>
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

            <Divider sx={{ my: 2, borderStyle: 'dashed' }} />
            
            <Typography variant="caption" display="block">
              ¡GRACIAS POR SU PREFERENCIA!
            </Typography>
            <Typography variant="caption" display="block">
              Conserve este comprobante.
            </Typography>

          </Box>
        </DialogContent>

        {/* BOTONES DE ACCIÓN (Se ocultan al imprimir) */}
        <DialogActions sx={{ p: 2, bgcolor: '#f5f5f5' }} className="no-print">
          <Button onClick={onClose} color="inherit">
            Cerrar
          </Button>
          <Button 
            onClick={handlePrint} 
            variant="contained" 
            startIcon={<PrintIcon />}
            sx={{ bgcolor: 'black', '&:hover': { bgcolor: '#333' } }}
          >
            IMPRIMIR
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};