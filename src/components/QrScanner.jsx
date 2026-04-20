import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { NotFoundException } from "@zxing/library";

export default function QrScanner({ onResult, paused = false }) {
  const videoRef = useRef(null);
  const readerRef = useRef(null);
  const scannerRef = useRef(null);
  const handledTextRef = useRef("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (paused) {
      return undefined;
    }

    if (!videoRef.current) {
      setError("Camera preview is unavailable.");
      return undefined;
    }

    const codeReader = new BrowserMultiFormatReader();
    readerRef.current = codeReader;
    let isActive = true;

    const stopScanner = async () => {
      const scanner = scannerRef.current;

      try {
        scanner?.stop?.();
      } catch (stopError) {
        console.error("Failed to stop QR scanner.", stopError);
      }

      try {
        await scanner?.clear?.();
      } catch (clearError) {
        console.error("Failed to clear QR scanner.", clearError);
      }

      scannerRef.current = null;
      readerRef.current = null;
    };

    const startScanner = async () => {
      try {
        setError("");

        const scanner = await codeReader.decodeFromVideoDevice(
          undefined,
          videoRef.current,
          async (result, scanError) => {
            if (!isActive) {
              return;
            }

            if (result) {
              const text = result.getText();

              if (text && handledTextRef.current !== text) {
                handledTextRef.current = text;

                try {
                  await onResult?.({ text });
                } catch (resultError) {
                  if (isActive) {
                    setError(
                      resultError?.message || "QR code scanned, but processing failed."
                    );
                  }
                }
              }

              return;
            }

            if (scanError && !(scanError instanceof NotFoundException)) {
              setError(scanError.message || "Unable to read the QR code stream.");
            }
          }
        );

        if (!isActive) {
          scannerRef.current = scanner;
          await stopScanner();
          return;
        }

        scannerRef.current = scanner;
      } catch (cameraError) {
        if (isActive) {
          setError(
            cameraError.message ||
              "Unable to access the camera. Check browser permissions and device access."
          );
        }
      }
    };

    startScanner();

    return () => {
      isActive = false;
      handledTextRef.current = "";
      stopScanner().catch((cleanupError) => {
        console.error("QR scanner cleanup failed.", cleanupError);
      });
    };
  }, [onResult, paused]);

  return (
    <div className="qr-scanner">
      <div className="qr-scanner__frame">
        <video ref={videoRef} className="qr-scanner__video" muted playsInline />
      </div>
      {paused ? (
        <p className="helper-text">
          Scanner is paused until you choose to scan again.
        </p>
      ) : null}
      {error ? <p className="alert alert--danger">{error}</p> : null}
    </div>
  );
}
