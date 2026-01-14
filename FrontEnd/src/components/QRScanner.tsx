import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { AlertCircle, Camera, Image as ImageIcon, X } from 'lucide-react';

interface QRScannerProps {
    onScanSuccess: (decodedText: string) => void;
    onScanFailure?: (error: any) => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ onScanSuccess, onScanFailure }) => {
    const [isScanning, setIsScanning] = useState(false);
    const scannerRef = useRef<Html5Qrcode | null>(null);

    // Cleanup on unmount
    useEffect(() => {
        // Clear the scanner instance when component unmounts
        return () => {
            if (scannerRef.current) {
                // We assume checking isScanning isn't enough, just try to stop/clear if it exists
                scannerRef.current.stop().catch(() => {
                    // Ignore stop errors on unmount
                }).finally(() => {
                   scannerRef.current?.clear();
                });
            }
        };
    }, []);

    const startCamera = async () => {
        try {
            // Create instance only if it doesn't exist to avoid duplicates
            if (!scannerRef.current) {
                scannerRef.current = new Html5Qrcode("reader");
            }
            
            const scanner = scannerRef.current;

            await scanner.start(
                { facingMode: "environment" },
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                },
                (decodedText) => {
                    // Success
                    stopCamera();
                    onScanSuccess(decodedText);
                },
                (errorMessage) => {
                    // Ignore frame failures
                }
            );
            
            setIsScanning(true);
        } catch (err) {
            console.error("Camera failed to start", err);
            alert("Camera failed to start. Ensure you are on HTTPS or Localhost.");
        }
    };

    const stopCamera = async () => {
        if (scannerRef.current && isScanning) {
            try {
                await scannerRef.current.stop();
                // Optionally clear the canvas to remove the frozen video frame
                scannerRef.current.clear(); 
                setIsScanning(false);
            } catch (err) {
                console.error("Failed to stop", err);
            }
        }
    };

    const onFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
             const imageFile = e.target.files[0];
             if (!imageFile) return;

             // Use a temporary scanner for file upload so we don't mess with the camera element
             const fileScanner = new Html5Qrcode("reader"); 
             fileScanner.scanFile(imageFile, true)
                .then(decodedText => {
                    onScanSuccess(decodedText);
                })
                .catch(err => {
                    console.error("File scan error", err);
                    alert("Could not read QR code from this image.");
                });
        }
    };

    return (
        <div className="w-full max-w-md mx-auto space-y-4">
            
            {/* CONTAINER */}
            <div className="relative overflow-hidden rounded-xl shadow-lg border-2 border-slate-200 bg-black min-h-[300px]">
                
                {/* 1. THE LIBRARY DOM (React leaves this EMPTY) */}
                <div id="reader" className="w-full h-full"></div>

                {/* 2. THE OVERLAY (React manages this separately) */}
                {!isScanning && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 bg-slate-100 z-10">
                        <Camera className="w-12 h-12 mb-2 opacity-50" />
                        <p className="text-sm font-medium">Camera is off</p>
                    </div>
                )}
            </div>
            
            {/* Controls */}
            <div className="grid grid-cols-2 gap-3">
                {!isScanning ? (
                    <button 
                        onClick={startCamera}
                        className="flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition"
                    >
                        <Camera className="w-5 h-5" />
                        Start Camera
                    </button>
                ) : (
                    <button 
                        onClick={stopCamera}
                        className="flex items-center justify-center gap-2 bg-red-100 text-red-600 py-3 rounded-xl font-bold hover:bg-red-200 transition"
                    >
                        <X className="w-5 h-5" />
                        Stop Camera
                    </button>
                )}

                <label className="flex items-center justify-center gap-2 bg-white border border-slate-300 text-slate-700 py-3 rounded-xl font-bold hover:bg-slate-50 transition cursor-pointer shadow-sm">
                    <ImageIcon className="w-5 h-5" />
                    Upload Image
                    <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={onFileUpload}
                    />
                </label>
            </div>

            <div className="text-center text-xs text-slate-400 flex items-center justify-center gap-1">
                <AlertCircle className="w-3 h-3" />
                <span>Ensure permissions are allowed</span>
            </div>
        </div>
    );
};

export default QRScanner;