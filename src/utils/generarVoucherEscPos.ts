// ===============================
// CONFIG PRINCIPAL 57mm
// ===============================

const MAX_LINE = 32; // ancho típico rollo 57mm

const padRight = (text: string, length: number) =>
  text.length >= length ? text.substring(0, length) : text + " ".repeat(length - text.length);

const padLeft = (text: string, length: number) =>
  text.length >= length ? text.substring(0, length) : " ".repeat(length - text.length) + text;

const line = (char = "-") => char.repeat(MAX_LINE);

const fmt = (n: number) => new Intl.NumberFormat("es-CL").format(n);

// ===============================
// FUNCIÓN PRINCIPAL
// ===============================

export function generarTextoVoucherESC_POS(datos: any) {
  const { id_venta, fecha, vendedor, items, total, pagos } = datos;

  let texto = "";

  texto += "  BOTILLERIA EL PARAISO\n";
  texto += "  Santo Domingo 2557\n";
  texto += line() + "\n";

  texto += `  Folio: #${id_venta}\n`;
  texto += `  Fecha: ${fecha}\n`;
  texto += `  Vendedor: ${vendedor}\n`;
  texto += line() + "\n";

  texto += " CANT PRODUCTO          TOTAL\n";

  items.forEach((item: any) => {
    const cant = padRight(String(item.cantidad), 4);

    const nombre = padRight(
      (item.nombre_producto + (item.es_promo ? " (P)" : "")).substring(0, 16),
      16
    );

    const totalItem = fmt((item.precio_final ?? item.precio_producto) * item.cantidad);
    const totalTxt = padLeft("$" + totalItem, 10);

    texto += `${cant}${nombre}${totalTxt}\n`;
  });

  texto += line() + "\n";

  const totalTxt = padLeft("$" + fmt(total), MAX_LINE - "TOTAL: ".length);
  texto += ` TOTAL:${totalTxt}\n`;

  texto += "\n FORMAS DE PAGO:\n";
  pagos.forEach((p: any) => {
    const pagoTxt = padLeft("$" + fmt(p.monto), MAX_LINE - (p.tipo.length + 3));
    texto += ` - ${p.tipo}${pagoTxt}\n`;
  });

  texto += line() + "\n";
  texto += " ¡GRACIAS POR SU PREFERENCIA!\n";
  texto += " Conserve este comprobante.\n\n\n";

  texto += "\x1D\x56\x00"; // cortar papel

  return texto;
}
