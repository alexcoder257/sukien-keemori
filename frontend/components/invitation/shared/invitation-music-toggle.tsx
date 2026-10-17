"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Play } from "lucide-react";
import type { Dictionary } from "@/i18n/dictionaries";
import { MUSIC_TRACKS } from "@/constants/invitation";
import styles from "./invitation-music-toggle.module.css";

const AUTO_PLAY_BY_DEFAULT =
  process.env.NEXT_PUBLIC_INVITATION_MUSIC_AUTOPLAY !== "false";

/**
 * Trình phát nhạc nền nổi của thiệp. Trạng thái giao diện luôn bám theo sự kiện
 * thật của thẻ audio để không báo "đang phát" khi trình duyệt chặn autoplay.
 */
export function InvitationMusicToggle({
  dict,
  trackId,
  autoPlay = AUTO_PLAY_BY_DEFAULT,
  placement = "viewport",
}: {
  dict: Dictionary["invitation"];
  trackId: string;
  autoPlay?: boolean;
  placement?: "viewport" | "mobile-preview";
}) {
  const track = MUSIC_TRACKS.find((item) => item.id === trackId);
  const audioRef = useRef<HTMLAudioElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const manuallyPausedRef = useRef(false);
  const [playing, setPlaying] = useState(false);

  const play = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || manuallyPausedRef.current) return;

    try {
      await audio.play();
    } catch {
      // Autoplay có âm thanh có thể bị trình duyệt chặn. Giao diện giữ ở trạng
      // thái dừng và sẽ thử lại ở tương tác đầu tiên của khách với tấm thiệp.
    }
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onPause);

    return () => {
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onPause);
      audio.pause();
    };
  }, [track?.src]);

  useEffect(() => {
    if (!autoPlay || !track) return;

    void play();

    const retryAfterInteraction = (event: PointerEvent | KeyboardEvent) => {
      if (
        manuallyPausedRef.current ||
        !audioRef.current?.paused ||
        (event.target instanceof Node &&
          buttonRef.current?.contains(event.target))
      ) {
        return;
      }
      void play();
    };

    document.addEventListener("pointerdown", retryAfterInteraction);
    document.addEventListener("keydown", retryAfterInteraction);
    return () => {
      document.removeEventListener("pointerdown", retryAfterInteraction);
      document.removeEventListener("keydown", retryAfterInteraction);
    };
  }, [autoPlay, play, track]);

  if (!track) return null;

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      manuallyPausedRef.current = false;
      void play();
    } else {
      manuallyPausedRef.current = true;
      audio.pause();
    }
  };

  return (
    <div
      className={styles.player}
      data-playing={playing}
      data-placement={placement}
    >
      <audio ref={audioRef} src={track.src} loop preload="auto" playsInline />
      <button
        ref={buttonRef}
        type="button"
        aria-label={playing ? dict.musicOff : dict.musicOn}
        aria-pressed={playing}
        title={playing ? dict.musicOff : dict.musicOn}
        onClick={toggle}
        className={styles.button}
      >
        {playing ? (
          <span className={styles.equalizer} aria-hidden>
            <span />
            <span />
            <span />
            <span />
            <span />
          </span>
        ) : (
          <Play className={styles.playIcon} aria-hidden />
        )}
      </button>
    </div>
  );
}
