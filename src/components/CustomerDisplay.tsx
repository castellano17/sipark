import { useState, useEffect } from "react";

export function CustomerDisplay() {
  const [mediaPlaylist, setMediaPlaylist] = useState<any[]>([]);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);

  useEffect(() => {
    // Cargar los archivos desde la carpeta Documentos/SIPARK_Publicidad
    const loadAds = async () => {
      try {
        const ads = await (window as any).api.getAdFiles();
        if (ads && ads.length > 0) {
          setMediaPlaylist(ads);
        } else {
          // Fallback placeholders
          setMediaPlaylist([
            { type: 'image', src: 'https://images.unsplash.com/photo-1511882150382-421056c89033?q=80&w=2000&auto=format&fit=crop', duration: 10000 },
          ]);
        }
      } catch (err) {
        setMediaPlaylist([
          { type: 'image', src: 'https://images.unsplash.com/photo-1511882150382-421056c89033?q=80&w=2000&auto=format&fit=crop', duration: 10000 },
        ]);
      }
    };
    loadAds();
    // Actualizar la carpeta cada 2 minutos para detectar nuevos archivos
    const interval = setInterval(loadAds, 120000);
    return () => clearInterval(interval);
  }, []);
  const [nfcAlert, setNfcAlert] = useState<{
    visible: boolean;
    type: 'success' | 'error' | 'info';
    title: string;
    clientName?: string;
    chargedAmount?: number;
    newBalance?: number;
    message?: string;
  }>({
    visible: false,
    type: 'info',
    title: '',
  });

  // Ciclo del carrusel de publicidad
  useEffect(() => {
    let timer: any;
    
    // Si la alerta NFC está visible, pausamos el carrusel
    if (!nfcAlert.visible && mediaPlaylist.length > 0) {
      const currentMedia = mediaPlaylist[currentMediaIndex];
      // Si es imagen, pasamos al siguiente después de 'duration'
      if (currentMedia.type === 'image') {
        timer = setTimeout(() => {
          setCurrentMediaIndex((prev) => (prev + 1) % mediaPlaylist.length);
        }, currentMedia.duration || 5000);
      }
    }

    return () => clearTimeout(timer);
  }, [currentMediaIndex, nfcAlert.visible]);

  const [adsHidden, setAdsHidden] = useState(false);

  // Manejo de eventos IPC desde la Ventana Principal
  useEffect(() => {
    let timeoutId: any;

    const cleanup = (window as any).api?.onCustomerEvent?.((payload: any) => {
      console.log("Customer Event Received:", payload);
      
      if (payload.action === "TOGGLE_ADS") {
        setAdsHidden(payload.hidden);
        return;
      }

      if (payload.action === "SHOW_NFC_ALERT") {
        setNfcAlert({
          visible: true,
          type: payload.type || 'info',
          title: payload.title || 'Atención',
          clientName: payload.clientName,
          chargedAmount: payload.chargedAmount,
          newBalance: payload.newBalance,
          message: payload.message || '',
        });

        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          setNfcAlert((prev) => ({ ...prev, visible: false }));
        }, 5000);
      }
    });

    return () => {
      if (cleanup) cleanup();
      clearTimeout(timeoutId);
    };
  }, []);

  const currentMedia = mediaPlaylist[currentMediaIndex];

  return (
    <div className={`relative w-screen h-screen overflow-hidden flex items-center justify-center ${adsHidden ? 'bg-transparent' : 'bg-black'}`}>
      
      {/* ── Reproductor de Publicidad (Fondo) ── */}
      {!adsHidden && currentMedia && currentMedia.type === 'image' && (
        <img 
          key={currentMedia.src}
          src={currentMedia.src} 
          className={`w-full h-full object-cover transition-opacity duration-1000 ${nfcAlert.visible ? 'opacity-30 blur-sm' : 'opacity-100'}`}
          alt="Publicidad" 
        />
      )}
      {!adsHidden && currentMedia && currentMedia.type === 'video' && (
        <video 
          key={currentMedia.src}
          src={currentMedia.src} 
          className={`w-full h-full object-cover transition-all duration-1000 ${nfcAlert.visible ? 'opacity-30 blur-sm' : 'opacity-100'}`}
          autoPlay 
          muted 
          loop={mediaPlaylist.length === 1}
          onEnded={() => {
            if (!nfcAlert.visible) {
              setCurrentMediaIndex((prev) => (prev + 1) % mediaPlaylist.length);
            }
          }}
        />
      )}
      {!adsHidden && mediaPlaylist.length === 0 && (
        <div className="absolute text-slate-500 text-3xl font-light">
          Agrega tus imágenes o videos a la lista
        </div>
      )}

      {/* ── Capa Superior: Alerta Premium NFC (Superpuesta) ── */}
      <div className={`absolute inset-0 flex items-center justify-center transition-all duration-700 transform ${nfcAlert.visible ? 'scale-100 opacity-100 backdrop-blur-md bg-black/60' : 'scale-95 opacity-0 pointer-events-none'}`}>
        {nfcAlert.visible && (
          <div className="relative overflow-hidden shadow-[0_0_60px_rgba(59,130,246,0.5)] rounded-[2.5rem] p-16 max-w-4xl w-full text-center bg-slate-900/80 backdrop-blur-3xl border border-white/20">
            {/* Destellos y luces de fondo animadas */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent opacity-70 animate-pulse"></div>
            <div className="absolute -top-32 -left-32 w-80 h-80 bg-blue-500 rounded-full mix-blend-screen filter blur-[100px] opacity-40 animate-pulse"></div>
            <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-indigo-500 rounded-full mix-blend-screen filter blur-[100px] opacity-40 animate-pulse" style={{ animationDelay: '2s' }}></div>
            
            <div className="relative z-10">
              {nfcAlert.type === 'success' && (
                <div className="mx-auto mb-8 w-28 h-28 bg-gradient-to-tr from-green-400 to-emerald-600 shadow-[0_0_40px_rgba(52,211,153,0.6)] text-white rounded-full flex items-center justify-center text-7xl font-bold">✓</div>
              )}
              {nfcAlert.type === 'error' && (
                <div className="mx-auto mb-8 w-28 h-28 bg-gradient-to-tr from-rose-500 to-red-600 shadow-[0_0_40px_rgba(244,63,94,0.6)] text-white rounded-full flex items-center justify-center text-7xl font-bold">✗</div>
              )}

              <h1 className="text-6xl font-black mb-6 text-transparent bg-clip-text bg-gradient-to-r from-white to-blue-100 drop-shadow-xl tracking-tight leading-tight">{nfcAlert.title}</h1>
              
              {nfcAlert.clientName && (
                <p className="text-5xl font-bold text-blue-300 mb-12 drop-shadow-lg">{nfcAlert.clientName}</p>
              )}

              {nfcAlert.chargedAmount !== undefined && nfcAlert.newBalance !== undefined ? (
                <div className="grid grid-cols-2 gap-8 mt-12">
                  <div className="bg-black/50 rounded-3xl p-8 border border-white/10 flex flex-col items-center justify-center transform transition-transform hover:scale-105 duration-300">
                    <span className="text-slate-400 text-lg font-bold uppercase tracking-[0.25em] mb-3">Monto Cobrado</span>
                    <span className="text-5xl font-black text-rose-400 drop-shadow-md">C$ {nfcAlert.chargedAmount.toFixed(2)}</span>
                  </div>
                  <div className="bg-gradient-to-b from-blue-900/60 to-blue-950/80 rounded-3xl p-8 border border-blue-400/40 flex flex-col items-center justify-center transform transition-transform hover:scale-105 duration-300 shadow-[0_0_50px_rgba(59,130,246,0.3)]">
                    <span className="text-blue-200 text-lg font-bold uppercase tracking-[0.25em] mb-3">Saldo Restante</span>
                    <span className="text-7xl font-black text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.6)]">C$ {nfcAlert.newBalance.toFixed(2)}</span>
                  </div>
                </div>
              ) : (
                nfcAlert.message && (
                  <p className="text-4xl text-white mt-8 font-medium">{nfcAlert.message}</p>
                )
              )}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
