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
    message: string;
    subMessage?: string;
  }>({
    visible: false,
    type: 'info',
    title: '',
    message: ''
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
          type: payload.type || 'info', // success, error
          title: payload.title || 'Atención',
          message: payload.message || '',
          subMessage: payload.subMessage || ''
        });

        // Ocultar alerta automáticamente después de 6 segundos
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          setNfcAlert((prev) => ({ ...prev, visible: false }));
        }, 6000);
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

      {/* ── Capa Superior: Alerta NFC (Superpuesta) ── */}
      <div className={`absolute inset-0 flex items-center justify-center transition-all duration-500 transform ${nfcAlert.visible ? 'scale-100 opacity-100' : 'scale-90 opacity-0 pointer-events-none'}`}>
        {nfcAlert.visible && (
          <div className={`shadow-2xl rounded-3xl p-12 max-w-2xl w-full text-center border-4 ${
            nfcAlert.type === 'success' ? 'bg-green-50 border-green-400' :
            nfcAlert.type === 'error' ? 'bg-red-50 border-red-400' : 'bg-white border-blue-400'
          }`}>
            
            <div className="mb-6 flex justify-center">
              {nfcAlert.type === 'success' && <div className="w-32 h-32 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-7xl font-bold">✓</div>}
              {nfcAlert.type === 'error' && <div className="w-32 h-32 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-7xl font-bold">✗</div>}
              {nfcAlert.type === 'info' && <div className="w-32 h-32 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-7xl font-bold">!</div>}
            </div>

            <h1 className="text-5xl font-black mb-4 text-slate-800 tracking-tight">{nfcAlert.title}</h1>
            <p className="text-3xl font-medium text-slate-600 mb-2 leading-snug">{nfcAlert.message}</p>
            {nfcAlert.subMessage && (
              <p className="text-2xl font-bold text-slate-800 mt-6 bg-slate-100 py-4 px-6 rounded-2xl inline-block">
                {nfcAlert.subMessage}
              </p>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
