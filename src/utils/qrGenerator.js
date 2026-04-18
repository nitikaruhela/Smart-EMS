import QRCode from "qrcode";

export async function generateRegistrationQrCode(payload) {
  // Keep the payload compact so camera scanners get larger, clearer QR modules.
  const encodedPayload = JSON.stringify({
    r: payload.registrationId,
    a: payload.attendeeId,
    e: payload.eventId,
  });

  return QRCode.toDataURL(encodedPayload, {
    errorCorrectionLevel: "M",
    margin: 4,
    width: 640,
    color: {
      dark: "#000000",
      light: "#ffffff",
    },
  });
}
