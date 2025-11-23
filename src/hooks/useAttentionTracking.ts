import { useRef, useCallback, useState, useEffect } from 'react';
import { attentionService, AttentionSession } from '../services/attentionService';

interface AttentionData {
  attention_score: number;
  engagement_level: 'high' | 'medium' | 'low';
  eye_aspect_ratio: number;
  head_tilt: number;
  face_detected: boolean;
  timestamp: string;
  is_attentive?: boolean;
  camera_quality?: number;
}

interface UseAttentionTrackingProps {
  childId: string; // Changed to string for Supabase UUID
  moduleId: string; // Changed to string for Supabase UUID
  videoUrl?: string;
  videoDuration?: number;
  onAttentionUpdate?: (data: AttentionData) => void;
}

const API_BASE_URL = 'http://localhost:8000';

export function useAttentionTracking({
  childId,
  moduleId,
  videoUrl,
  videoDuration,
  onAttentionUpdate
}: UseAttentionTrackingProps) {
  const [isTracking, setIsTracking] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentAttention, setCurrentAttention] = useState<AttentionData | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const attentionSessionRef = useRef<AttentionSession | null>(null);
  
  // Session statistics
  const sessionStatsRef = useRef({
    totalFrames: 0,
    attentiveFrames: 0,
    totalEyeAspectRatio: 0,
    totalHeadTilt: 0,
    framesWithFace: 0,
    framesWithoutFace: 0,
    attentionBreaks: 0,
    currentAttentionStreak: 0,
    longestAttentionStreak: 0,
    wasAttentiveLast: false
  });

  // Request camera permission
  const requestCameraPermission = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 10 }
        }
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      
      setHasPermission(true);
      setError(null);
      return true;
    } catch (err) {
      console.error('Camera permission denied:', err);
      setHasPermission(false);
      setError('Camera access is required for attention tracking. Please allow camera access and try again.');
      return false;
    }
  }, []);

  // Capture frame from video and convert to base64
  const captureFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return null;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return null;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    // Draw current video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to base64
    return canvas.toDataURL('image/jpeg', 0.8);
  }, []);

  // Start attention tracking session
  const startTracking = useCallback(async () => {
    if (isTracking || !hasPermission) return;

    try {
      console.log('🚀 Starting attention tracking session...');
      
      // Reset session statistics
      sessionStatsRef.current = {
        totalFrames: 0,
        attentiveFrames: 0,
        totalEyeAspectRatio: 0,
        totalHeadTilt: 0,
        framesWithFace: 0,
        framesWithoutFace: 0,
        attentionBreaks: 0,
        currentAttentionStreak: 0,
        longestAttentionStreak: 0,
        wasAttentiveLast: false
      };
      
      // Step 1: Create session in Supabase
      const session = await attentionService.createSession({
        child_id: childId,
        module_id: moduleId,
        video_url: videoUrl || 'unknown',
        video_duration_seconds: videoDuration ? Math.round(videoDuration) : 300
      });
      
      attentionSessionRef.current = session;
      sessionIdRef.current = session.id!;
      
      console.log('✅ Session started:', sessionIdRef.current);
      
      // Step 2: Connect to WebSocket for real-time CV analysis
      const ws = new WebSocket(`ws://localhost:8000/ws/attention/${sessionIdRef.current}`);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('📡 WebSocket connected to attention tracking service');
        setIsTracking(true);
        setError(null);

        // Step 3: Start sending frames every 500ms (2 FPS)
        intervalRef.current = setInterval(() => {
          const frameData = captureFrame();
          if (frameData && ws.readyState === WebSocket.OPEN) {
            // Send ONLY the base64 frame data (not wrapped in JSON)
            ws.send(frameData);
          }
        }, 500);
      };

      ws.onmessage = (event) => {
        try {
          const response = JSON.parse(event.data);
          
          // Handle different message types from backend
          if (response.type === 'attention_metrics') {
            const backendData = response.data;
            
            // Map backend response to frontend AttentionData format
            const mappedData: AttentionData = {
              attention_score: backendData.is_attentive ? 100 : 0,
              engagement_level: backendData.is_attentive ? 'high' : 'low',
              eye_aspect_ratio: backendData.eye_aspect_ratio,
              head_tilt: backendData.head_tilt_degrees,
              face_detected: backendData.face_detected,
              timestamp: backendData.timestamp,
              is_attentive: backendData.is_attentive,
              camera_quality: backendData.camera_quality
            };
            
            setCurrentAttention(mappedData);
            onAttentionUpdate?.(mappedData);
            
            // Update session statistics
            const stats = sessionStatsRef.current;
            stats.totalFrames++;
            
            if (backendData.face_detected) {
              stats.framesWithFace++;
              stats.totalEyeAspectRatio += backendData.eye_aspect_ratio;
              stats.totalHeadTilt += Math.abs(backendData.head_tilt_degrees);
            } else {
              stats.framesWithoutFace++;
            }
            
            if (backendData.is_attentive) {
              stats.attentiveFrames++;
              stats.currentAttentionStreak++;
              if (stats.currentAttentionStreak > stats.longestAttentionStreak) {
                stats.longestAttentionStreak = stats.currentAttentionStreak;
              }
            } else {
              if (stats.wasAttentiveLast) {
                stats.attentionBreaks++;
              }
              stats.currentAttentionStreak = 0;
            }
            
            stats.wasAttentiveLast = backendData.is_attentive;
            
            console.log('📊 Attention update:', {
              attentive: mappedData.is_attentive,
              score: mappedData.attention_score,
              face: mappedData.face_detected
            });
            
            // Update Supabase session every 10 frames (every 5 seconds at 2 FPS)
            if (stats.totalFrames % 10 === 0 && sessionIdRef.current) {
              const avgEyeRatio = stats.framesWithFace > 0 ? stats.totalEyeAspectRatio / stats.framesWithFace : 0;
              const avgHeadTilt = stats.framesWithFace > 0 ? stats.totalHeadTilt / stats.framesWithFace : 0;
              const attentionScore = stats.totalFrames > 0 ? (stats.attentiveFrames / stats.totalFrames) * 100 : 0;
              const cameraQuality = stats.totalFrames > 0 ? (stats.framesWithFace / stats.totalFrames) * 100 : 0;
              
              let engagementLevel: 'low' | 'medium' | 'high' = 'low';
              if (attentionScore >= 70) engagementLevel = 'high';
              else if (attentionScore >= 40) engagementLevel = 'medium';
              
              attentionService.updateSession(sessionIdRef.current, {
                total_frames_analyzed: stats.totalFrames,
                attentive_frames: stats.attentiveFrames,
                attention_score: Math.round(attentionScore),
                avg_eye_aspect_ratio: avgEyeRatio,
                avg_head_tilt_degrees: avgHeadTilt,
                engagement_level: engagementLevel,
                frames_with_face: stats.framesWithFace,
                frames_without_face: stats.framesWithoutFace,
                camera_quality_score: Math.round(cameraQuality),
                attention_breaks: stats.attentionBreaks,
                longest_attention_span_seconds: Math.round(stats.longestAttentionStreak * 0.5), // 0.5 seconds per frame
                average_attention_span_seconds: stats.attentionBreaks > 0 ? (stats.attentiveFrames * 0.5) / (stats.attentionBreaks + 1) : stats.attentiveFrames * 0.5
              }).catch(console.error);
            }
          } else if (response.type === 'session_stats') {
            // Handle session statistics updates
            console.log('📈 Session stats:', response.data);
          }
        } catch (err) {
          console.error('Error parsing attention data:', err);
        }
      };

      ws.onerror = (err) => {
        console.error('WebSocket error:', err);
        setError('Connection to attention service failed. Please try again.');
      };

      ws.onclose = () => {
        console.log('📡 WebSocket disconnected from attention tracking service');
        setIsTracking(false);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };

    } catch (err) {
      console.error('Failed to start attention tracking:', err);
      setError('Failed to start attention tracking service.');
    }
  }, [isTracking, hasPermission, childId, moduleId, videoUrl, videoDuration, captureFrame, onAttentionUpdate]);

  // Stop attention tracking
  const stopTracking = useCallback(async () => {
    if (!isTracking || !sessionIdRef.current) return;

    try {
      console.log('🛑 Stopping attention tracking...');
      
      // Step 1: Calculate final statistics
      const stats = sessionStatsRef.current;
      const avgEyeRatio = stats.framesWithFace > 0 ? stats.totalEyeAspectRatio / stats.framesWithFace : 0;
      const avgHeadTilt = stats.framesWithFace > 0 ? stats.totalHeadTilt / stats.framesWithFace : 0;
      const finalAttentionScore = stats.totalFrames > 0 ? (stats.attentiveFrames / stats.totalFrames) * 100 : 0;
      const cameraQuality = stats.totalFrames > 0 ? (stats.framesWithFace / stats.totalFrames) * 100 : 0;
      
      let finalEngagementLevel: 'low' | 'medium' | 'high' = 'low';
      if (finalAttentionScore >= 70) finalEngagementLevel = 'high';
      else if (finalAttentionScore >= 40) finalEngagementLevel = 'medium';
      
      // Step 2: Save final session data to Supabase
      await attentionService.endSession(sessionIdRef.current, {
        attention_score: Math.round(finalAttentionScore),
        engagement_level: finalEngagementLevel,
        total_frames_analyzed: stats.totalFrames,
        attentive_frames: stats.attentiveFrames,
        avg_eye_aspect_ratio: avgEyeRatio,
        avg_head_tilt_degrees: avgHeadTilt,
        frames_with_face: stats.framesWithFace,
        frames_without_face: stats.framesWithoutFace,
        camera_quality_score: Math.round(cameraQuality),
        attention_breaks: stats.attentionBreaks,
        longest_attention_span_seconds: Math.round(stats.longestAttentionStreak * 0.5),
        average_attention_span_seconds: stats.attentionBreaks > 0 ? (stats.attentiveFrames * 0.5) / (stats.attentionBreaks + 1) : stats.attentiveFrames * 0.5,
        notes: `Session completed. Total frames: ${stats.totalFrames}, Attentive: ${stats.attentiveFrames}`
      });
      
      console.log('✅ Session ended successfully with final stats:', {
        totalFrames: stats.totalFrames,
        attentiveFrames: stats.attentiveFrames,
        attentionScore: finalAttentionScore,
        engagementLevel: finalEngagementLevel
      });
    } catch (err) {
      console.error('Error ending session:', err);
    }

    // Step 3: Clean up WebSocket
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    // Step 4: Clear frame capture interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Step 5: Stop camera stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    setIsTracking(false);
    sessionIdRef.current = null;
    attentionSessionRef.current = null;
  }, [isTracking]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, [stopTracking]);

  return {
    // State
    isTracking,
    hasPermission,
    error,
    currentAttention,
    
    // Actions
    requestCameraPermission,
    startTracking,
    stopTracking,
    
    // Refs for components
    videoRef,
    canvasRef
  };
}