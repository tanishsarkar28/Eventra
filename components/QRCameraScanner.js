'use client';

import { useState, useEffect, useRef } from 'react';

/**
 * QRCameraScanner Component
 * Enables live mobile phone camera scanning and photo snapshot QR decoding
 * for ticket check-in at campus venues.
 */
export default function QRCameraScanner({ onScan, isProcessing = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scannerError, setScannerError] = useState('');
  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState('');
  const [lastScanned, setLastScanned] = useState('');
  const [scanCooldown, setScanCooldown] = useState(false);

  const scannerInstanceRef = useRef(null);
  const fileInputRef = useRef(null);
  const containerId = 'eventra-qr-reader';

  // Play audio beep feedback on successful scan
  function playBeep() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // 880 Hz (A5)
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch (e) {
      // Audio context may be restricted without direct user action
    }
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(100);
      } catch (e) {}
    }
  }

  // Sanitize decoded text to extract clean ticket code
  function extractTicketCode(raw) {
    if (!raw) return '';
    let text = raw.trim();
    if (text.startsWith('{') && text.endsWith('}')) {
      try {
        const obj = JSON.parse(text);
        if (obj.ticketCode) return obj.ticketCode;
        if (obj.code) return obj.code;
      } catch (e) {}
    }
    if (text.includes('code=')) {
      try {
        const url = new URL(text);
        const code = url.searchParams.get('code') || url.searchParams.get('ticketCode');
        if (code) return code;
      } catch (e) {
        const m = text.match(/[?&](?:code|ticketCode)=([^&]+)/);
        if (m) return decodeURIComponent(m[1]);
      }
    }
    return text;
  }

  // Handle successful scan detection
  function handleDetectedCode(rawText) {
    if (scanCooldown || isProcessing) return;
    const ticketCode = extractTicketCode(rawText);
    if (!ticketCode) return;

    setScanCooldown(true);
    setLastScanned(ticketCode);
    playBeep();

    if (onScan) {
      onScan(ticketCode);
    }

    // Cooldown for 2.5 seconds before allowing the next ticket to be scanned
    setTimeout(() => {
      setScanCooldown(false);
    }, 2500);
  }

  // Start live camera stream
  async function startLiveStream(cameraId = null) {
    setScannerError('');
    setIsScanning(true);

    try {
      const { Html5Qrcode } = await import('html5-qrcode');

      // Stop any existing instance
      if (scannerInstanceRef.current) {
        try {
          if (scannerInstanceRef.current.isScanning) {
            await scannerInstanceRef.current.stop();
          }
          scannerInstanceRef.current.clear();
        } catch (e) {}
        scannerInstanceRef.current = null;
      }

      const html5QrCode = new Html5Qrcode(containerId);
      scannerInstanceRef.current = html5QrCode;

      // Detect available cameras (front/rear)
      try {
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length > 0) {
          setCameras(devices);
          if (!selectedCameraId) {
            // Prefer rear camera on mobile phones
            const rearCamera = devices.find(d =>
              d.label.toLowerCase().includes('back') ||
              d.label.toLowerCase().includes('rear') ||
              d.label.toLowerCase().includes('environment')
            );
            if (rearCamera) {
              setSelectedCameraId(rearCamera.id);
            } else {
              setSelectedCameraId(devices[0].id);
            }
          }
        }
      } catch (camErr) {
        // Can fail if permissions not granted yet
      }

      const cameraSelection = cameraId || selectedCameraId || { facingMode: 'environment' };

      const qrConfig = {
        fps: 12,
        qrbox: (viewfinderWidth, viewfinderHeight) => {
          const edge = Math.min(viewfinderWidth, viewfinderHeight) * 0.7;
          return { width: Math.max(200, Math.floor(edge)), height: Math.max(200, Math.floor(edge)) };
        },
        aspectRatio: 1.0,
      };

      await html5QrCode.start(
        cameraSelection,
        qrConfig,
        (decodedText) => {
          handleDetectedCode(decodedText);
        },
        () => {
          // ignore scan failure per frame
        }
      );
    } catch (err) {
      console.error('QR Scanner Start Error:', err);
      setIsScanning(false);
      if (err?.name === 'NotAllowedError') {
        setScannerError('Camera access denied. Please grant camera permission in your browser or address bar settings.');
      } else if (err?.name === 'NotFoundError') {
        setScannerError('No camera found on this device. You can use "Take Photo / Upload Pass" below.');
      } else {
        setScannerError(
          'Live camera stream could not be started. Note: Mobile browsers restrict live video to HTTPS or localhost. If you are connected via local network IP, use "📸 Take Photo of Pass" below which works on all mobile devices!'
        );
      }
    }
  }

  // Stop live camera stream
  async function stopLiveStream() {
    if (scannerInstanceRef.current) {
      try {
        if (scannerInstanceRef.current.isScanning) {
          await scannerInstanceRef.current.stop();
        }
        scannerInstanceRef.current.clear();
      } catch (e) {}
      scannerInstanceRef.current = null;
    }
    setIsScanning(false);
  }

  // Handle file / photo upload scan
  async function handleFileScan(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setScannerError('');
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const tempScanner = new Html5Qrcode(containerId);
      const decoded = await tempScanner.scanFile(file, true);
      tempScanner.clear();
      if (decoded) {
        handleDetectedCode(decoded);
      }
    } catch (err) {
      setScannerError('Could not detect a QR code in the selected photo. Please ensure the QR code is centered and well-lit.');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  // Switch camera (front / back)
  async function handleSwitchCamera(newCameraId) {
    setSelectedCameraId(newCameraId);
    if (isScanning) {
      await stopLiveStream();
      await startLiveStream(newCameraId);
    }
  }

  // Clean up scanner on unmount
  useEffect(() => {
    return () => {
      if (scannerInstanceRef.current) {
        try {
          if (scannerInstanceRef.current.isScanning) {
            scannerInstanceRef.current.stop().catch(() => {});
          }
          scannerInstanceRef.current.clear();
        } catch (e) {}
      }
    };
  }, []);

  return (
    <div style={{ marginTop: '16px' }}>
      {!isOpen ? (
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => {
              setIsOpen(true);
              setTimeout(() => {
                startLiveStream();
              }, 150);
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              background: '#ea580c',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 700,
              fontSize: '14.5px',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(234, 88, 12, 0.25)',
            }}
          >
            <span>📷</span> Open Phone / Webcam QR Scanner
          </button>

          <label
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              background: '#f8fafc',
              color: '#334155',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              fontWeight: 600,
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            <span>📸</span> Take Photo / Scan Ticket Image
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileScan}
              style={{ display: 'none' }}
            />
          </label>
        </div>
      ) : (
        <div
          style={{
            border: '2px solid #ea580c',
            borderRadius: '12px',
            padding: '16px',
            background: '#ffffff',
            boxShadow: '0 4px 14px rgba(0,0,0,0.08)',
            maxWidth: '460px',
            margin: '0 auto',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '18px' }}>📷</span>
              <strong style={{ fontSize: '15px', color: '#1e293b' }}>Live Camera Ticket Scanner</strong>
            </div>
            <button
              type="button"
              onClick={async () => {
                await stopLiveStream();
                setIsOpen(false);
              }}
              style={{
                background: '#fee2e2',
                color: '#dc2626',
                border: '1px solid #fca5a5',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              ✕ Close Scanner
            </button>
          </div>

          {/* Camera Selector (if multiple cameras available) */}
          {cameras.length > 1 && (
            <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Camera:</label>
              <select
                value={selectedCameraId}
                onChange={(e) => handleSwitchCamera(e.target.value)}
                style={{
                  fontSize: '12px',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  border: '1px solid #cbd5e1',
                  flex: 1,
                }}
              >
                {cameras.map((cam, idx) => (
                  <option key={cam.id} value={cam.id}>
                    {cam.label || `Camera ${idx + 1}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Scanner Viewfinder Area */}
          <div
            style={{
              position: 'relative',
              borderRadius: '8px',
              overflow: 'hidden',
              background: '#0f172a',
              minHeight: '260px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div id={containerId} style={{ width: '100%' }}></div>

            {/* Visual Viewfinder Reticle */}
            {isScanning && !scanCooldown && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  pointerEvents: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <div
                  style={{
                    width: '200px',
                    height: '200px',
                    border: '2px solid rgba(234, 88, 12, 0.8)',
                    borderRadius: '12px',
                    boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.35)',
                    position: 'relative',
                  }}
                >
                  {/* Laser Scanning Animation */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '5%',
                      width: '90%',
                      height: '2px',
                      background: '#ea580c',
                      boxShadow: '0 0 8px #ea580c',
                      borderRadius: '1px',
                    }}
                  />
                </div>
              </div>
            )}

            {/* Scan Cooldown Overlay */}
            {scanCooldown && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(22, 163, 74, 0.85)',
                  color: '#ffffff',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 20,
                  padding: '16px',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '36px' }}>✓</div>
                <div style={{ fontWeight: 700, fontSize: '16px', marginTop: '4px' }}>Ticket Scanned!</div>
                <code style={{ background: 'rgba(0,0,0,0.2)', padding: '4px 8px', borderRadius: '4px', fontSize: '13px', marginTop: '6px' }}>
                  {lastScanned}
                </code>
                <div style={{ fontSize: '12px', marginTop: '8px', opacity: 0.9 }}>Verifying check-in... Ready for next in 2s</div>
              </div>
            )}
          </div>

          {/* Scanner Error Display */}
          {scannerError && (
            <div
              style={{
                marginTop: '12px',
                padding: '10px 12px',
                borderRadius: '6px',
                background: '#fef2f2',
                border: '1px solid #fca5a5',
                color: '#991b1b',
                fontSize: '12.5px',
                lineHeight: 1.4,
              }}
            >
              ⚠️ {scannerError}
            </div>
          )}

          {/* Controls Bar */}
          <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            {isScanning ? (
              <button
                type="button"
                onClick={stopLiveStream}
                style={{
                  padding: '6px 12px',
                  background: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  color: '#334155',
                }}
              >
                ⏸ Pause Camera
              </button>
            ) : (
              <button
                type="button"
                onClick={() => startLiveStream(selectedCameraId)}
                style={{
                  padding: '6px 12px',
                  background: '#ea580c',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                ▶ Restart Camera
              </button>
            )}

            <label
              style={{
                padding: '6px 12px',
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                fontSize: '12.5px',
                fontWeight: 600,
                color: '#334155',
                cursor: 'pointer',
              }}
            >
              📸 Snap Photo / Upload File
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileScan}
                style={{ display: 'none' }}
              />
            </label>
          </div>

          <div style={{ marginTop: '8px', fontSize: '11.5px', color: '#64748b', textAlign: 'center' }}>
            Tip: Point camera steadily at the student&apos;s ticket QR code. Auto-detects in under 1 second.
          </div>
        </div>
      )}
    </div>
  );
}
