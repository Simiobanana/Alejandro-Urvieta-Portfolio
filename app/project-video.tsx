"use client";

import { useEffect, useRef, useState } from "react";
import { Play, RotateCcw } from "lucide-react";
import type { MediaItem } from "@/lib/content-types";
import "./project-video.css";

/** Mount only the active gallery item so hidden slides never keep playing. */
export default function ProjectVideo({ item, title, lang }: {
  item: MediaItem;
  title: string;
  lang: "en" | "es";
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [ended, setEnded] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    let mounted = true;
    // Set both properties before play(): WebKit checks the live muted state.
    video.defaultMuted = true;
    video.muted = true;
    void video.play().catch(() => {
      // Low Power Mode and browser policy can reject even muted autoplay.
      if (mounted) setPlaying(false);
    });
    return () => {
      mounted = false;
      video.pause();
    };
  }, [item.url]);

  const play = () => {
    const video = ref.current;
    if (!video) return;
    if (video.error) video.load();
    if (video.ended) video.currentTime = 0;
    setFailed(false);
    setEnded(false);
    // This call stays in the tap/click handler so iOS retains user activation.
    void video.play().catch(() => setPlaying(false));
  };
  const label = failed
    ? (lang === "es" ? "Reintentar video" : "Retry video")
    : ended
      ? (lang === "es" ? "Volver a reproducir" : "Play again")
      : (lang === "es" ? "Reproducir video" : "Play video");

  return <div className="project-video" data-playing={playing}>
    <video
      ref={ref}
      src={item.url}
      poster={item.poster}
      aria-label={item.alt || title}
      autoPlay
      muted
      playsInline
      controls
      preload="auto"
      onPlaying={() => { setPlaying(true); setEnded(false); setFailed(false); }}
      onPause={() => setPlaying(false)}
      onEnded={() => { setPlaying(false); setEnded(true); }}
      onError={() => { setPlaying(false); setFailed(true); }}
    />
    {!playing && <button className="project-video-play" onClick={play} aria-label={`${label}: ${title}`}>
      <span className="project-video-play-icon" aria-hidden="true">{ended || failed ? <RotateCcw /> : <Play fill="currentColor" />}</span>
      <span>{label}</span>
    </button>}
    {failed && <p className="project-video-error" role="status">{lang === "es" ? "No se pudo cargar el video. Puedes reintentarlo." : "The video could not load. You can try again."}</p>}
  </div>;
}
