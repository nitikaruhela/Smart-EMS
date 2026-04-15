import QRCode from "qrcode";

export async function generateRegistrationQrCode(payload) {
  const encodedPayload = JSON.stringify(payload);

  return QRCode.toDataURL(encodedPayload, {
    errorCorrectionLevel: "H",
    margin: 2,
    width: 320,
    color: {
      dark: "#0f172a",
      light: "#ffffff",
    },
  });
}
