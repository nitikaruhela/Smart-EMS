import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { NotFoundException } from "@zxing/library";

export default function QrScanner({ onResult }) {
  const videoRef = useRef(null);
  const readerRef = useRef(null);
  const handledTextRef = useRef("");
  const [error, setError] = useState("");

  useEffect(() => {
    const codeReader = new BrowserMultiFormatReader();
    readerRef.current = codeReader;
    let isActive = true;

    const startScanner = async () => {
      try {
        await codeReader.decodeFromVideoDevice(
          undefined,
          videoRef.current,
          (result, scanError) => {
            if (!isActive) {
              return;
            }

            if (result) {
              const text = result.getText();

              if (text && handledTextRef.current !== text) {
                handledTextRef.current = text;
                onResult({ text });
              }

              return;
            }

            if (scanError && !(scanError instanceof NotFoundException)) {
              setError(scanError.message || "Unable to read the QR code stream.");
            }
          }
        );
      } catch (cameraError) {
        setError(
          cameraError.message ||
            "Unable to access the camera. Check browser permissions and device access."
        );
      }
    };

    startScanner();

    return () => {
      isActive = false;
      readerRef.current?.reset();
      readerRef.current = null;
      handledTextRef.current = "";
    };
  }, [onResult]);

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-3xl bg-slate-950">
        <video ref={videoRef} className="w-full" muted playsInline />
      </div>
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
    </div>
  );
}
