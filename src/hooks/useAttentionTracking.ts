import { useRef, useCallback, useState, useEffect } from 'react';

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
  childId: number;
  moduleId: number;
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
      
      // Step 1: Initialize session via REST API
      const sessionResponse = await fetch(`${API_BASE_URL}/sessions/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          child_id: childId.toString(),
          module_id: moduleId.toString(),
          video_url: videoUrl || 'unknown',
          video_duration_seconds: videoDuration ? videoDuration * 60 : 300
        })
      });

      if (!sessionResponse.ok) {
        throw new Error('Failed to start session');
      }

      const sessionData = await sessionResponse.json();
      sessionIdRef.current = sessionData.session_id;
      
      console.log('✅ Session started:', sessionIdRef.current);
      
      // Step 2: Connect to WebSocket
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
            
            console.log('📊 Attention update:', {
              attentive: mappedData.is_attentive,
              score: mappedData.attention_score,
              face: mappedData.face_detected
            });
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
      
      // Step 1: End session via REST API
      await fetch(`${API_BASE_URL}/sessions/end`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionIdRef.current,
          notes: 'Session ended by user'
        })
      });
      
      console.log('✅ Session ended successfully');
    } catch (err) {
      console.error('Error ending session:', err);
    }

    // Step 2: Clean up WebSocket
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    // Step 3: Clear frame capture interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Step 4: Stop camera stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    setIsTracking(false);
    sessionIdRef.current = null;
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