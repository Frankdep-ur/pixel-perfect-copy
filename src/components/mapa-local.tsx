import { useEffect, useRef, useState } from "react";
import { Loader2, LocateFixed, MapPin } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

const CSS_LEAFLET = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
const CENTRO_PADRAO: [number, number] = [-27.5954, -48.548];

function garantirCss() {
  if (typeof document === "undefined") return;
  if (document.querySelector(`link[data-leaflet]`)) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = CSS_LEAFLET;
  link.setAttribute("data-leaflet", "true");
  document.head.appendChild(link);
}

/** Busca a coordenada a partir de um endereço em texto (OpenStreetMap, sem chave). */
export async function geocodificar(consulta: string): Promise<[number, number] | null> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=br&q=${encodeURIComponent(
    consulta,
  )}`;
  try {
    const resposta = await fetch(url, { headers: { Accept: "application/json" } });
    if (!resposta.ok) return null;
    const dados = (await resposta.json()) as { lat: string; lon: string }[];
    const primeiro = dados[0];
    if (!primeiro) return null;
    return [Number(primeiro.lat), Number(primeiro.lon)];
  } catch {
    return null;
  }
}

type Props = {
  latitude: number | null;
  longitude: number | null;
  /** Endereço em texto usado para posicionar o pino automaticamente. */
  enderecoTexto?: string;
  onChange: (coord: { latitude: number; longitude: number }) => void;
};

/**
 * Localizador no mapa: o pino começa no endereço digitado e a profissional
 * arrasta (ou toca) até o ponto exato de onde ela sai para os serviços.
 */
export function MapaLocal({ latitude, longitude, enderecoTexto, onChange }: Props) {
  const divRef = useRef<HTMLDivElement>(null);
  const mapaRef = useRef<import("leaflet").Map | null>(null);
  const marcadorRef = useRef<import("leaflet").Marker | null>(null);
  const [pronto, setPronto] = useState(false);
  const [buscando, setBuscando] = useState(false);

  useEffect(() => {
    let cancelado = false;
    garantirCss();

    (async () => {
      const L = await import("leaflet");
      if (cancelado || !divRef.current || mapaRef.current) return;

      const inicio: [number, number] =
        latitude !== null && longitude !== null ? [latitude, longitude] : CENTRO_PADRAO;

      const mapa = L.map(divRef.current).setView(inicio, latitude === null ? 12 : 16);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
        maxZoom: 19,
      }).addTo(mapa);

      const icone = L.divIcon({
        className: "",
        html: `<span style="display:flex;height:34px;width:34px;align-items:center;justify-content:center;border-radius:9999px;background:#C9A227;color:#0B1426;font-weight:700;box-shadow:0 2px 8px rgba(0,0,0,.4)">●</span>`,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      });

      const marcador = L.marker(inicio, { draggable: true, icon: icone }).addTo(mapa);
      marcador.on("dragend", () => {
        const p = marcador.getLatLng();
        onChange({ latitude: Number(p.lat.toFixed(6)), longitude: Number(p.lng.toFixed(6)) });
      });
      mapa.on("click", (e: import("leaflet").LeafletMouseEvent) => {
        marcador.setLatLng(e.latlng);
        onChange({
          latitude: Number(e.latlng.lat.toFixed(6)),
          longitude: Number(e.latlng.lng.toFixed(6)),
        });
      });

      mapaRef.current = mapa;
      marcadorRef.current = marcador;
      setPronto(true);
      setTimeout(() => mapa.invalidateSize(), 200);
    })();

    return () => {
      cancelado = true;
      mapaRef.current?.remove();
      mapaRef.current = null;
      marcadorRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Coordenada mudou por fora (busca de CEP, GPS): move o pino.
  useEffect(() => {
    if (!pronto || latitude === null || longitude === null) return;
    marcadorRef.current?.setLatLng([latitude, longitude]);
    mapaRef.current?.setView([latitude, longitude], 16);
  }, [pronto, latitude, longitude]);

  async function usarEndereco() {
    if (!enderecoTexto?.trim()) {
      toast.error("Preencha o endereço primeiro.");
      return;
    }
    setBuscando(true);
    const coord = await geocodificar(enderecoTexto);
    setBuscando(false);
    if (!coord) {
      toast.error("Não encontramos esse endereço no mapa", {
        description: "Arraste o pino manualmente até o local certo.",
      });
      return;
    }
    onChange({ latitude: coord[0], longitude: coord[1] });
  }

  function usarGps() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      toast.error("Seu aparelho não permite localização automática.");
      return;
    }
    setBuscando(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setBuscando(false);
        onChange({
          latitude: Number(pos.coords.latitude.toFixed(6)),
          longitude: Number(pos.coords.longitude.toFixed(6)),
        });
      },
      () => {
        setBuscando(false);
        toast.error("Não conseguimos pegar sua localização.");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  return (
    <div className="space-y-3">
      <div
        ref={divRef}
        className="h-56 w-full overflow-hidden rounded-2xl border border-border bg-muted"
        role="application"
        aria-label="Mapa para marcar sua localização"
      />
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => void usarEndereco()}>
          {buscando ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <MapPin className="mr-2 size-4" />
          )}
          Usar meu endereço
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={usarGps}>
          <LocateFixed className="mr-2 size-4" />
          Usar minha localização
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        {latitude !== null && longitude !== null
          ? `Localização marcada: ${latitude.toFixed(5)}, ${longitude.toFixed(5)} — arraste o pino para ajustar.`
          : "Toque no mapa ou arraste o pino até o local exato de onde você sai para os serviços."}
      </p>
    </div>
  );
}
