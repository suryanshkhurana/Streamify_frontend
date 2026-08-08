/**
 * src/hooks/useHlsPlayer.ts
 *
 * Custom hook to manage the HLS.js instance and HTML5 <audio> element.
 * It syncs state between the DOM audio element and the Zustand playerStore.
 */

import { useEffect, useRef } from 'react';
import Hls from 'hls.js';
import api from '@/lib/axios';
import { usePlayerStore } from '@/stores/playerStore';

export function useHlsPlayer(audioRef: React.RefObject<HTMLAudioElement>) {
  const hlsRef = useRef<Hls | null>(null);

  const {
    currentTrack,
    isPlaying,
    volume,
    isMuted,
    setIsLoading,
    setError,
    setCurrentTimeMs,
    setDurationMs,
    skipNext,
    setIsPlaying,
  } = usePlayerStore();

  // 1. Sync volume and mute state
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      audioRef.current.muted = isMuted;
    }
  }, [volume, isMuted, audioRef]);

  // 2. Load track when currentTrack changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    let isSubscribed = true;

    const loadTrack = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch the CloudFront signed URL for this track
        const { data } = await api.get<{ data: { streamUrl: string } }>(
          `/stream/${currentTrack.id}`
        );
        const streamUrl = data.data.streamUrl;

        if (!isSubscribed) return;

        if (Hls.isSupported()) {
          // Clean up old HLS instance
          if (hlsRef.current) {
            hlsRef.current.destroy();
          }

          const urlParams = new URL(streamUrl).search;

          const hls = new Hls({
            // Tweaks for faster startup
            startLevel: -1,
            maxMaxBufferLength: 30,
            xhrSetup: (xhr, url) => {
              // CloudFront signed URLs require the signature on ALL requests.
              // HLS.js by default drops query params for relative URLs in the playlist.
              // We append them back here.
              if (urlParams && !url.includes('Policy=')) {
                xhr.open('GET', url + urlParams, true);
              }
            }
          });
          
          hlsRef.current = hls;
          hls.attachMedia(audio);

          hls.on(Hls.Events.MEDIA_ATTACHED, () => {
            hls.loadSource(streamUrl);
          });
          
          hls.on(Hls.Events.LEVEL_LOADED, (_event, data) => {
            if (data.details && data.details.totalduration) {
              setDurationMs(data.details.totalduration * 1000);
            }
          });

          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            setIsLoading(false);
            if (isPlaying) {
              audio.play().catch((e) => {
                console.error('Playback failed:', e);
                setIsPlaying(false);
              });
            }
          });

          hls.on(Hls.Events.ERROR, (_event, data) => {
            if (data.fatal) {
              setIsLoading(false);
              switch (data.type) {
                case Hls.ErrorTypes.NETWORK_ERROR:
                  console.error('fatal network error encountered, cannot recover');
                  hls.destroy();
                  setError('Network error loading stream. Please check your connection.');
                  setIsPlaying(false);
                  break;
                case Hls.ErrorTypes.MEDIA_ERROR:
                  console.error('fatal media error encountered, try to recover');
                  hls.recoverMediaError();
                  break;
                default:
                  // cannot recover
                  hls.destroy();
                  setError('Playback error occurred: ' + data.details);
                  setIsPlaying(false);
                  break;
              }
            }
          });
        } else if (audio.canPlayType('application/vnd.apple.mpegurl')) {
          // Native Safari support
          audio.src = streamUrl;
          audio.addEventListener('loadedmetadata', () => {
            setIsLoading(false);
            if (isPlaying) {
              audio.play().catch((e) => {
                console.error('Playback failed:', e);
                setIsPlaying(false);
              });
            }
          });
        }
      } catch (err: any) {
        if (!isSubscribed) return;
        console.error('Failed to load stream:', err);
        setError(err.response?.data?.message || 'Failed to load track');
        setIsLoading(false);
        setIsPlaying(false);
      }
    };

    void loadTrack();

    return () => {
      isSubscribed = false;
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [currentTrack?.id]); // Only re-run when track ID changes

  // 3. Play/Pause toggle (responsive to store state)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    if (isPlaying && audio.paused) {
      audio.play().catch((e) => {
        console.error('Play interrupted:', e);
        setIsPlaying(false);
      });
    } else if (!isPlaying && !audio.paused) {
      audio.pause();
    }
  }, [isPlaying, currentTrack]);

  // 4. Attach event listeners to audio element
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => {
      const timeMs = audio.currentTime * 1000;
      setCurrentTimeMs(timeMs);
      
      // Safety catch: if time is advancing, we are definitely not loading
      if (timeMs > 0 && !audio.paused && usePlayerStore.getState().isLoading) {
        setIsLoading(false);
      }
    };

    const onDurationChange = () => {
      const d = audio.duration;
      if (!isNaN(d) && d > 0 && d !== Infinity) {
        setDurationMs(d * 1000);
      }
    };

    const onEnded = () => {
      skipNext();
    };

    const onPlaying = () => {
      setIsPlaying(true);
      setIsLoading(false);
    };
    
    const onCanPlay = () => {
      setIsLoading(false);
    };

    const onPause = () => {
      setIsPlaying(false);
    };

    const onWaiting = () => {
      setIsLoading(true);
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('durationchange', onDurationChange);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('playing', onPlaying);
    audio.addEventListener('canplay', onCanPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('waiting', onWaiting);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('durationchange', onDurationChange);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('playing', onPlaying);
      audio.removeEventListener('canplay', onCanPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('waiting', onWaiting);
    };
  }, [audioRef, setCurrentTimeMs, setDurationMs, skipNext, setIsPlaying, setIsLoading]);
}
