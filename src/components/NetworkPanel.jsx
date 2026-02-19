import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import QRCode from 'qrcode';
import { getApiUrl } from '../services/api';

const NetworkPanel = ({ backendConnected }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [qrCodeLocal, setQrCodeLocal] = useState('');
  const [qrCodeNetwork, setQrCodeNetwork] = useState('');
  const [copied, setCopied] = useState('');
  const [qrCodesLoading, setQrCodesLoading] = useState(true);
  const [qrError, setQrError] = useState(null);
  // ========================================
  // FIX 8: State for QR popup/lightbox
  // ========================================
  const [qrPopup, setQrPopup] = useState(null); // null | { src, label }
  const [networkInfo, setNetworkInfo] = useState({
    localUrl: '',
    networkUrl: '',
    apiUrl: '',
    mode: 'local'
  });

  useEffect(() => {
    const initializeNetwork = async () => {
      try {
        setQrCodesLoading(true);
        setQrError(null);

        const hostname = window.location.hostname;
        const port = window.location.port || '5173';
        const protocol = window.location.protocol;
        
        const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
        
        const localUrl = `http://localhost:${port}`;
        const networkUrl = !isLocalhost 
          ? `${protocol}//${hostname}:${port}` 
          : '';
        const mode = !isLocalhost ? 'network' : 'local';
        
        setNetworkInfo({
          localUrl,
          networkUrl,
          apiUrl: getApiUrl(),
          mode
        });

        try {
          // ========================================
          // FIX 9: Generate QR as PNG data URL with explicit
          // black modules on white background. Using higher width
          // for crispness and errorCorrectionLevel for reliability.
          // Removed any transparency — pure #ffffff background.
          // ========================================
          const qrOptions = { 
            width: 400,
            margin: 2,
            color: {
              dark: '#000000ff',   // FIX 9: Fully opaque black pixels
              light: '#ffffffff'   // FIX 9: Fully opaque white background
            },
            errorCorrectionLevel: 'M'
          };

          const localQRData = await QRCode.toDataURL(localUrl, qrOptions);
          setQrCodeLocal(localQRData);

          if (networkUrl) {
            const networkQRData = await QRCode.toDataURL(networkUrl, qrOptions);
            setQrCodeNetwork(networkQRData);
          }
        } catch (qrErr) {
          console.error('Failed to generate QR codes:', qrErr);
          setQrError('Failed to generate QR codes. Please refresh the page.');
        }
      } catch (error) {
        console.error('Network initialization error:', error);
        setQrError('Failed to initialize network settings.');
      } finally {
        setQrCodesLoading(false);
      }
    };

    initializeNetwork();
  }, []);

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(''), 2000);
  };

  return (
    <>
      {/* Floating Network Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 p-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 rounded-2xl shadow-2xl shadow-cyan-500/20 transition-all duration-300 group"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
            </svg>
            {backendConnected && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white animate-pulse"></span>
            )}
          </div>
          <span className="text-sm font-bold text-white uppercase tracking-wider hidden sm:block">
            Network
          </span>
        </div>
      </motion.button>

      {/* ========================================
          FIX 8: QR Code Popup/Lightbox
          Clicking a QR opens it large & centered.
          Click anywhere or the X to close.
          ======================================== */}
      <AnimatePresence>
        {qrPopup && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setQrPopup(null)}
              className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100]"
            />
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="relative pointer-events-auto"
              >
                <button
                  onClick={() => setQrPopup(null)}
                  className="absolute -top-4 -right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10"
                  aria-label="Close QR code popup"
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <div className="bg-white rounded-3xl p-6 shadow-2xl shadow-black/50">
                  <img 
                    src={qrPopup.src} 
                    alt={`QR Code - ${qrPopup.label}`} 
                    className="w-64 h-64 sm:w-80 sm:h-80"
                  />
                </div>
                <div className="text-center mt-4 text-white/70 text-sm font-mono">
                  {qrPopup.label}
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
      {/* END FIX 8 */}

      {/* Network Panel Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            />

            {/* FIX 7: Flexbox centering wrapper */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-gray-900 via-black to-gray-900 border border-white/10 rounded-3xl shadow-2xl scrollbar-hide pointer-events-auto"
              >
                {/* Header */}
                <div className="sticky top-0 px-8 py-6 border-b border-white/10 bg-black/60 backdrop-blur-xl rounded-t-3xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                        <svg className="w-7 h-7 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                        </svg>
                        Network Access
                      </h2>
                      <p className="text-white/50 text-sm mt-1">Connect from any device on your network</p>
                    </div>
                    <button
                      onClick={() => setIsOpen(false)}
                      className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                      aria-label="Close network panel"
                    >
                      <svg className="w-6 h-6 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-8 space-y-8">
                  {/* Status */}
                  <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10">
                    <div className={`w-3 h-3 rounded-full ${networkInfo.mode === 'network' ? 'bg-emerald-400 animate-pulse' : 'bg-yellow-400'}`}></div>
                    <div className="flex-1">
                      <div className="text-sm font-bold text-white">
                        {networkInfo.mode === 'network' ? '🌐 Network Mode Active' : '🏠 Local Mode'}
                      </div>
                      <div className="text-xs text-white/50 mt-1">
                        {networkInfo.mode === 'network' 
                          ? 'Accessible from devices on your network' 
                          : 'Only accessible from this computer'}
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-lg ${backendConnected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'} text-xs font-mono font-bold`}>
                      {backendConnected ? 'BACKEND ONLINE' : 'BACKEND OFFLINE'}
                    </div>
                  </div>

                  {/* URLs Grid */}
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Local Access */}
                    <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                      <div className="flex items-center gap-2 mb-4">
                        <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <h3 className="font-bold text-white">Local Access</h3>
                      </div>
                      
                      <div className="space-y-3">
                        <div>
                          <div className="text-xs text-white/40 mb-1 font-mono uppercase tracking-wider">Frontend</div>
                          <div className="flex items-center gap-2">
                            <code className="flex-1 px-3 py-2 bg-black/60 rounded-lg text-cyan-400 text-sm font-mono">
                              {networkInfo.localUrl}
                            </code>
                            <button
                              onClick={() => copyToClipboard(networkInfo.localUrl, 'local')}
                              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                              title="Copy local URL"
                              aria-label="Copy local URL to clipboard"
                            >
                              {copied === 'local' ? (
                                <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              ) : (
                                <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                              )}
                            </button>
                          </div>
                        </div>

                        {/* ========================================
                            FIX 9: QR Code display — uses <img> with
                            explicit dimensions, block display, and
                            object-contain to guarantee visibility.
                            FIX 8: Added onClick to open QR popup.
                            ======================================== */}
                        <div className="flex justify-center py-4">
                          {qrCodesLoading ? (
                            <div className="flex items-center gap-2 text-white/50">
                              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                              <span className="text-xs font-mono ml-2">Generating QR...</span>
                            </div>
                          ) : qrError ? (
                            <div className="text-red-400 text-sm font-mono text-center">
                              ⚠️ {qrError}
                            </div>
                          ) : qrCodeLocal ? (
                            <button
                              onClick={() => setQrPopup({ src: qrCodeLocal, label: networkInfo.localUrl })}
                              className="p-3 bg-white rounded-2xl cursor-pointer hover:shadow-lg hover:shadow-cyan-500/20 transition-shadow duration-200 group/qr"
                              title="Click to enlarge QR code"
                            >
                              <img 
                                src={qrCodeLocal} 
                                alt="QR Code - Local" 
                                width={160}
                                height={160}
                                className="block"
                                style={{ imageRendering: 'pixelated' }}
                              />
                              <div className="text-xs text-gray-400 text-center mt-2 group-hover/qr:text-cyan-500 transition-colors">
                                Click to enlarge
                              </div>
                            </button>
                          ) : null}
                        </div>
                        {/* END FIX 8 & 9 */}

                        <div className="text-xs text-white/40 text-center">
                          Scan to open on mobile (same network)
                        </div>
                      </div>
                    </div>

                    {/* Network Access */}
                    <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                      <div className="flex items-center gap-2 mb-4">
                        <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                        </svg>
                        <h3 className="font-bold text-white">Network Access</h3>
                      </div>

                      {networkInfo.networkUrl ? (
                        <div className="space-y-3">
                          <div>
                            <div className="text-xs text-white/40 mb-1 font-mono uppercase tracking-wider">Frontend</div>
                            <div className="flex items-center gap-2">
                              <code className="flex-1 px-3 py-2 bg-black/60 rounded-lg text-emerald-400 text-sm font-mono break-all">
                                {networkInfo.networkUrl}
                              </code>
                              <button
                                onClick={() => copyToClipboard(networkInfo.networkUrl, 'network')}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                title="Copy network URL"
                                aria-label="Copy network URL to clipboard"
                              >
                                {copied === 'network' ? (
                                  <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                ) : (
                                  <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                  </svg>
                                )}
                              </button>
                            </div>
                          </div>

                          {/* ========================================
                              FIX 8 & 9: Network QR with popup click
                              ======================================== */}
                          <div className="flex justify-center py-4">
                            {qrCodesLoading ? (
                              <div className="flex items-center gap-2 text-white/50">
                                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                <span className="text-xs font-mono ml-2">Generating QR...</span>
                              </div>
                            ) : qrError ? (
                              <div className="text-red-400 text-sm font-mono text-center">
                                ⚠️ {qrError}
                              </div>
                            ) : qrCodeNetwork ? (
                              <button
                                onClick={() => setQrPopup({ src: qrCodeNetwork, label: networkInfo.networkUrl })}
                                className="p-3 bg-white rounded-2xl cursor-pointer hover:shadow-lg hover:shadow-emerald-500/20 transition-shadow duration-200 group/qr"
                                title="Click to enlarge QR code"
                              >
                                <img 
                                  src={qrCodeNetwork} 
                                  alt="QR Code - Network" 
                                  width={160}
                                  height={160}
                                  className="block"
                                  style={{ imageRendering: 'pixelated' }}
                                />
                                <div className="text-xs text-gray-400 text-center mt-2 group-hover/qr:text-emerald-500 transition-colors">
                                  Click to enlarge
                                </div>
                              </button>
                            ) : null}
                          </div>
                          {/* END FIX 8 & 9 */}

                          <div className="text-xs text-white/40 text-center">
                            Scan from any device on your network
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <svg className="w-16 h-16 text-white/20 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
                          </svg>
                          <div className="text-white/60 font-bold mb-2">Not on Network</div>
                          <div className="text-sm text-white/40">
                            Access via localhost to see network URL
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* API Info */}
                  <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                    <div className="flex items-center gap-2 mb-4">
                      <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                      </svg>
                      <h3 className="font-bold text-white">Backend API</h3>
                    </div>

                    <div className="flex items-center gap-2">
                      <code className="flex-1 px-3 py-2 bg-black/60 rounded-lg text-purple-400 text-sm font-mono">
                        {networkInfo.apiUrl}
                      </code>
                      <button
                        onClick={() => copyToClipboard(networkInfo.apiUrl, 'api')}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        title="Copy API URL"
                        aria-label="Copy API URL to clipboard"
                      >
                        {copied === 'api' ? (
                          <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Connection Guide */}
                  <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-2xl p-6 border border-cyan-500/20">
                    <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Connection Guide
                    </h3>
                    <div className="space-y-3 text-sm text-white/70">
                      <div className="flex gap-3">
                        <div className="text-cyan-400 font-bold">1.</div>
                        <div>Make sure both devices are on the <span className="text-white font-semibold">same WiFi network</span></div>
                      </div>
                      <div className="flex gap-3">
                        <div className="text-cyan-400 font-bold">2.</div>
                        <div>Scan the QR code or type the network URL on your mobile device</div>
                      </div>
                      <div className="flex gap-3">
                        <div className="text-cyan-400 font-bold">3.</div>
                        <div>If connection fails, check your <span className="text-white font-semibold">firewall settings</span> (ports 5173 & 8000)</div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default NetworkPanel;
