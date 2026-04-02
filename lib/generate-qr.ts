import qrcode from "qrcode-generator";

/**
 * Returns an inline SVG string encoding the given URL.
 * Returns "" if url is empty.
 */
export function generateQR(url: string): string {
  if (!url) return "";
  const qr = qrcode(0, "M");
  qr.addData(url);
  qr.make();
  return qr.createSvgTag({ scalable: true });
}
