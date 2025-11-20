import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Paper,
  IconButton
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { IconBottle, IconGlassFull, IconCheck, IconBarcode } from "@tabler/icons-react";
import { productosApi } from "../../api/productosApi";

// =========================================================
// TIPOS LOCALES
// =========================================================
interface ProductoBase {
  id: number;
  codigo_producto: string;
  nombre_producto: string;
  precio_producto: number;
  exento_iva: 0 | 1;
  capacidad?: number;
  id_categoria?: number;
}

export interface CartItem extends ProductoBase {
  cantidad: number;
  es_promo?: boolean;
  precio_final?: number;
}

// =========================================================
// CONFIGURACIÓN
// =========================================================
const FORMATOS_BEBIDA = [1500, 1750, 2000, 2250, 2500, 3000]; 
const CAT_LICORES = [3, 4, 5]; 
const CAT_BEBIDAS = [2];       

interface PromoScannerModalProps {
  open: boolean;
  onClose: () => void;
  onPromoAdd: (items: CartItem[]) => void;
}

export const PromoScannerModal = ({ open, onClose, onPromoAdd }: PromoScannerModalProps) => {
  const [paso, setPaso] = useState<0 | 1 | 2>(0);
  const [licor, setLicor] = useState<any>(null);
  const [scanBuffer, setScanBuffer] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && paso !== 2) {
      const timer = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    }
  }, [open, paso, scanBuffer, error]);

  useEffect(() => {
    if (open) {
      setPaso(0);
      setLicor(null);
      setScanBuffer("");
      setError("");
    }
  }, [open]);

  const procesarCodigo = async (codigo: string) => {
    setLoading(true);
    setError("");
    
    try {
      const producto = await productosApi.getByCodigo(codigo);
      if (!producto) throw new Error("Producto no encontrado");

      // PASO 1: LICOR
      if (paso === 0) {
        if (!CAT_LICORES.includes(producto.id_categoria)) {
          throw new Error(`"${producto.nombre_producto}" no es un Licor válido.`);
        }
        setLicor(producto);
        setPaso(1);
        setScanBuffer("");
        return;
      }

      // PASO 2: BEBIDA
      if (paso === 1) {
        if (!CAT_BEBIDAS.includes(producto.id_categoria)) {
          throw new Error(`"${producto.nombre_producto}" no es una Bebida.`);
        }
        if (!FORMATOS_BEBIDA.includes(producto.capacidad)) {
          throw new Error(`Formato inválido (${producto.capacidad}cc). Solo familiar (1.5L - 3L).`);
        }
        armarCombo(licor, producto);
      }

    } catch (err: any) {
      if (err.message?.includes("404") || err.response?.status === 404) {
         setError("Error: Producto no encontrado");
      } else {
         setError(err.message || "Error al procesar código");
      }
      setScanBuffer("");
    } finally {
      setLoading(false);
    }
  };

  const armarCombo = (prodLicor: any, prodBebida: any) => {
    const precioBebidaPromo = Math.floor(prodBebida.precio_producto / 1000) * 1000;
    const itemsParaAgregar: CartItem[] = [];

    itemsParaAgregar.push({ ...prodLicor, cantidad: 1, es_promo: true });
    itemsParaAgregar.push({ 
      ...prodBebida, 
      cantidad: 1, 
      precio_final: precioBebidaPromo, 
      es_promo: true 
    });
    itemsParaAgregar.push({
      id: 11,
      codigo_producto: "HIELO01",
      nombre_producto: "Hielo 1KG (Regalo)",
      precio_producto: 0,
      exento_iva: 0,
      cantidad: 1,
      es_promo: true
    });

    onPromoAdd(itemsParaAgregar);
    setPaso(2);
    setTimeout(() => { onClose(); }, 1500);
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setScanBuffer(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (scanBuffer.trim()) procesarCodigo(scanBuffer.trim());
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: { borderRadius: 4, overflow: 'hidden' }
      }}
    >
      {/* CABECERA */}
      <Box sx={{ 
        bgcolor: paso === 2 ? 'success.main' : 'secondary.main', 
        color: 'white', 
        p: 2.5, // Un poco más de padding
        textAlign: 'center',
        transition: '0.3s',
        position: 'relative'
      }}>
        <Typography variant="h6" fontWeight="bold" sx={{ letterSpacing: 1, fontFamily: '"Poppins", sans-serif' }}>
          {paso === 0 && "PASO 1: ESCANEE LICOR 🥃"}
          {paso === 1 && "PASO 2: ESCANEE BEBIDA 🥤"}
          {paso === 2 && "¡COMBO AGREGADO! 🎉"}
        </Typography>
        
        {/* BOTÓN CERRAR (Z-Index alto arreglado) */}
        <IconButton 
          onClick={onClose} 
          sx={{ 
            position: 'absolute', 
            right: 10, 
            top: 10, 
            color: 'white',
            zIndex: 1301 // Mayor que el diálogo por si acaso
          }}
        >
          <CloseIcon />
        </IconButton>
      </Box>

      {/* CONTENIDO */}
      <DialogContent sx={{ 
        p: 4, 
        textAlign: 'center', 
        minHeight: 300, 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        position: 'relative' 
      }}>
        
        {/* ICONO */}
        <Box sx={{ mb: 3 }}>
          <Paper 
            elevation={4} 
            sx={{ 
              width: 140, 
              height: 140, 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              bgcolor: paso === 2 ? '#e8f5e9' : '#f3e5f5',
              transition: 'all 0.3s ease'
            }}
          >
            {loading ? (
              <CircularProgress color="secondary" />
            ) : (
              <>
                {paso === 0 && <IconBottle size={80} stroke={1.5} color="#7b1fa2" />}
                {paso === 1 && <IconGlassFull size={80} stroke={1.5} color="#d81b60" />}
                {paso === 2 && <IconCheck size={80} stroke={2} color="#2e7d32" />}
              </>
            )}
          </Paper>
        </Box>

        {/* INFO LICOR */}
        {paso === 1 && licor && (
          <Box sx={{ mb: 2, p: 1, bgcolor: 'background.default', borderRadius: 2, width: '100%' }}>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ fontFamily: '"Poppins", sans-serif' }}>
              LICOR SELECCIONADO:
            </Typography>
            <Typography variant="h6" color="primary.main" fontWeight="bold" sx={{ fontFamily: '"Poppins", sans-serif' }}>
              {licor.nombre_producto}
            </Typography>
          </Box>
        )}

        {/* INPUT INVISIBLE */}
        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
          <input
            ref={inputRef}
            value={scanBuffer}
            onChange={handleInput}
            onBlur={() => { if(open && paso !== 2) inputRef.current?.focus(); }}
            style={{ 
              opacity: 0, 
              position: 'absolute', 
              top: 0, 
              left: 0,
              height: '100%',
              width: '100%',
              cursor: 'default',
              zIndex: 1 
            }} 
            autoFocus
            autoComplete="off"
          />
        </form>

        {/* FEEDBACK VISUAL (Texto inferior) */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, opacity: 0.6, mt: 'auto' }}>
          <IconBarcode size={24} />
          <Typography variant="body2" sx={{ fontFamily: '"Poppins", sans-serif' }}>
            Esperando lectura de código de barras...
          </Typography>
        </Box>

        {/* ERRORES */}
        {error && (
          <Alert severity="error" variant="filled" sx={{ mt: 3, width: '100%', borderRadius: 2, fontFamily: '"Poppins", sans-serif' }}>
            {error}
          </Alert>
        )}

      </DialogContent>
    </Dialog>
  );
};