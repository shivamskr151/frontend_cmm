import React from 'react';
import type { Camera } from '../../api';

interface VideoStreamProps {
  camera?: Camera | null;
}

const VideoStream: React.FC<VideoStreamProps> = ({ camera }) => {
  // Get the WebRTC URL from camera data, fallback to sample video
  const videoSrc = camera?.streamUrls?.webrtc || '';
  console.log('Video Stream URL:', videoSrc);
  
  return (
    <div className="bg-white/80 backdrop-blur-sm h-[calc(50vh-80px)] sm:h-[calc(60vh-100px)] lg:h-[calc(92vh-140px)] rounded-xl border border-gray-200/50 shadow-2xl shadow-gray-200/20">
      <div className="aspect-video h-full w-full bg-gray-100 relative overflow-hidden rounded-xl">
        <video
          src={videoSrc}
          controls
          className="w-full h-full object-cover"
          autoPlay
          muted
        />
        {/* Video Overlay Info */}
        <div className="absolute top-2 left-2 sm:top-4 sm:left-4 bg-white/90 backdrop-blur-sm rounded-lg px-2 py-1 sm:px-3 sm:py-2 border border-gray-300 z-10 shadow-lg">
          <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-700">
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span>LIVE</span>
            <span className="text-gray-500">•</span>
            <span className="text-gray-500">1080p</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoStream;
