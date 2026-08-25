import React, { useRef, useEffect } from "react";
import { Plyr } from "plyr-react";
import "plyr-react/plyr.css";

export interface AppPlyrPlayerProps {
  sourceUrl: string;
  posterUrl?: string;
  autoPlay?: boolean;
  onEnded?: () => void;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  className?: string;
}

function getPlyrSource(url: string, posterUrl?: string) {
  const isYouTube = url.includes("youtube.com") || url.includes("youtu.be");
  const isVimeo = url.includes("vimeo.com");

  if (isYouTube) {
    let ytId = url;
    if (url.includes("v=")) {
      ytId = url.split("v=")[1]?.split("&")[0] || url;
    } else if (url.includes("youtu.be/")) {
      ytId = url.split("youtu.be/")[1]?.split("?")[0] || url;
    }
    return {
      type: "video" as const,
      sources: [
        {
          src: ytId,
          provider: "youtube" as const,
        },
      ],
      poster: posterUrl,
    };
  }

  if (isVimeo) {
    const vimeoId = url.split("/").pop()?.split("?")[0] || url;
    return {
      type: "video" as const,
      sources: [
        {
          src: vimeoId,
          provider: "vimeo" as const,
        },
      ],
      poster: posterUrl,
    };
  }

  // Standard HTML5 MP4 / WebM video stream
  return {
    type: "video" as const,
    sources: [
      {
        src: url,
        type: "video/mp4",
      },
    ],
    poster: posterUrl,
  };
}

export const AppPlyrPlayer: React.FC<AppPlyrPlayerProps> = ({
  sourceUrl,
  posterUrl,
  autoPlay = false,
  onEnded,
  onTimeUpdate,
  className = "",
}) => {
  const ref = useRef<any>(null);

  const plyrSource = getPlyrSource(sourceUrl, posterUrl);

  const plyrOptions = {
    autoplay: autoPlay,
    controls: [
      "play-large",
      "play",
      "progress",
      "current-time",
      "duration",
      "mute",
      "volume",
      "captions",
      "settings",
      "pip",
      "airplay",
      "fullscreen",
    ],
    settings: ["captions", "quality", "speed"],
    speed: { selected: 1, options: [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2] },
    tooltips: { controls: true, seek: true },
    displayDuration: true,
  };

  useEffect(() => {
    const player = ref.current?.plyr;
    if (!player) return;

    const handleEnded = () => {
      onEnded?.();
    };

    const handleTimeUpdate = () => {
      onTimeUpdate?.(player.currentTime || 0, player.duration || 0);
    };

    player.on("ended", handleEnded);
    player.on("timeupdate", handleTimeUpdate);

    return () => {
      player.off("ended", handleEnded);
      player.off("timeupdate", handleTimeUpdate);
    };
  }, [ref, onEnded, onTimeUpdate]);

  return (
    <div className={`plyr-player-container rounded-2xl overflow-hidden shadow-xl bg-black border border-border/40 ${className}`}>
      <Plyr ref={ref} source={plyrSource} options={plyrOptions} />
    </div>
  );
};

export default AppPlyrPlayer;
