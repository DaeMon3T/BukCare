import React, { useEffect, useRef, useState } from "react";
import { Loader2, X } from "lucide-react";

interface VideoCallProps {
  roomName: string;
  displayName: string;
  onLeave: () => void;
}

// Declare Jitsi on window to avoid TypeScript errors
declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}

const VideoCall: React.FC<VideoCallProps> = ({ roomName, displayName, onLeave }) => {
  const jitsiContainerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const apiRef = useRef<any>(null);

  useEffect(() => {
    // 1. Load the Jitsi Script dynamically
    const loadJitsiScript = () => {
      if (window.JitsiMeetExternalAPI) {
        startConference();
        return;
      }

      const script = document.createElement("script");
      script.src = "https://meet.jit.si/external_api.js";
      script.async = true;
      script.onload = () => startConference();
      document.body.appendChild(script);
    };

    // 2. Initialize the Conference
    const startConference = () => {
      if (!jitsiContainerRef.current) return;

      try {
        setLoading(false);
        apiRef.current = new window.JitsiMeetExternalAPI("meet.jit.si", {
          roomName: roomName,
          width: "100%",
          height: "100%",
          parentNode: jitsiContainerRef.current,
          userInfo: {
            displayName: displayName,
          },
          configOverwrite: {
            startWithAudioMuted: false,
            startWithVideoMuted: false,
            prejoinPageEnabled: false, // Skip the "Click to join" pre-page
          },
          interfaceConfigOverwrite: {
            TOOLBAR_BUTTONS: [
              "microphone", "camera", "closedcaptions", "desktop", "fullscreen",
              "fodeviceselection", "hangup", "profile", "chat", "recording",
              "livestreaming", "etherpad", "sharedvideo", "settings", "raisehand",
              "videoquality", "filmstrip", "invite", "feedback", "stats", "shortcuts",
              "tileview", "videobackgroundblur", "download", "help", "mute-everyone",
              "security"
            ],
          },
        });

        // 3. Add Event Listeners
        apiRef.current.addEventListener("videoConferenceLeft", () => {
          handleLeave();
        });
      } catch (error) {
        console.error("Failed to load Jitsi API", error);
      }
    };

    loadJitsiScript();

    // Cleanup
    return () => {
      if (apiRef.current) {
        apiRef.current.dispose();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLeave = () => {
    if (apiRef.current) {
      apiRef.current.dispose();
    }
    onLeave();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm">
      <div className="relative w-full h-full md:w-[90%] md:h-[90%] bg-slate-900 rounded-xl overflow-hidden shadow-2xl border border-slate-700">
        {/* Header / Close Button */}
        <button
          onClick={handleLeave}
          className="absolute top-4 right-4 z-50 p-2 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Loading Spinner */}
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
            <Loader2 className="w-10 h-10 animate-spin mb-4 text-blue-500" />
            <p className="text-lg font-medium">Connecting to secure line...</p>
          </div>
        )}

        {/* Jitsi Container */}
        <div ref={jitsiContainerRef} className="w-full h-full" />
      </div>
    </div>
  );
};

export default VideoCall;