import QRCode from "qrcode";

export async function generateRegistrationQrCode(payload) {
  return QRCode.toDataURL(payload.registrationId, {
    errorCorrectionLevel: "M",
    margin: 4,
    width: 640,
    color: {
      dark: "#000000",
      light: "#ffffff",
    },
  });
}
