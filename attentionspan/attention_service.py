#!/usr/bin/env python3
"""
Attention Span Analysis Web Service
Converts the existing attention tracking model into a FastAPI web service
with WebSocket support for real-time frame processing.
"""

import os
import sys
import math
import base64
import json
import asyncio
from datetime import datetime, timezone
from typing import Dict, List, Optional, Tuple
import uuid

import cv2
import numpy as np

# Add additional imports for database and environment
import psycopg2
from pathlib import Path
from urllib.parse import urlparse
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
project_root = Path(__file__).parent.parent
if (project_root / '.env').exists():
    load_dotenv(project_root / '.env')

# Try to import dlib, make it optional for initial testing
try:
    import dlib
    DLIB_AVAILABLE = True
except ImportError:
    print("⚠️  dlib not available - some facial detection features will be limited")
    DLIB_AVAILABLE = False
    dlib = None
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import uvicorn
import psycopg2
from psycopg2.extras import RealDictCursor
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- Configuration ---
DLIB_MODEL = "shape_predictor_68_face_landmarks.dat"
DLIB_URL = "http://dlib.net/files/shape_predictor_68_face_landmarks.dat.bz2"

# Attention analysis parameters
EAR_THRESH = 0.23     # Eye Aspect Ratio threshold
ANGLE_MAX = 20        # Max head tilt (degrees)
CLAHE_CLIP = 3.0

# Database Configuration
SUPABASE_URL = os.getenv('VITE_SUPABASE_URL')
SUPABASE_ANON_KEY = os.getenv('VITE_SUPABASE_ANON_KEY')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_KEY')
SUPABASE_DB_PASSWORD = os.getenv('SUPABASE_DB_PASSWORD', '')

def get_db_config():
    """Extract database connection details from Supabase URL"""
    if not SUPABASE_URL:
        logger.warning("SUPABASE_URL not found - database features will be disabled")
        return None
    
    try:
        # Parse Supabase URL to get database connection details
        parsed = urlparse(SUPABASE_URL)
        
        # Convert API URL to database URL
        if parsed.hostname and 'supabase.co' in parsed.hostname:
            project_ref = parsed.hostname.split('.')[0]
            db_host = f'db.{project_ref}.supabase.co'
        else:
            db_host = parsed.hostname or 'localhost'
        
        return {
            'host': db_host,
            'database': 'postgres',
            'user': 'postgres',
            'password': SUPABASE_DB_PASSWORD,
            'port': 5432
        }
    except Exception as e:
        logger.error(f"Error parsing database config: {e}")
        return None

DB_CONFIG = get_db_config()
TILE_GRID = (8, 8)

# --- Pydantic Models ---
class AttentionSessionStart(BaseModel):
    child_id: str = Field(..., description="UUID of the child")
    module_id: str = Field(..., description="UUID of the learning module")
    video_url: str = Field(..., description="URL of the video being watched")
    video_duration_seconds: int = Field(..., description="Duration of video in seconds")

class AttentionSessionEnd(BaseModel):
    session_id: str = Field(..., description="UUID of the attention session")
    notes: Optional[str] = Field(None, description="Optional notes about the session")

class AttentionMetrics(BaseModel):
    session_id: str
    timestamp: datetime
    is_attentive: bool
    eye_aspect_ratio: float
    head_tilt_degrees: float
    face_detected: bool
    camera_quality: float

class SessionSummary(BaseModel):
    session_id: str
    child_id: str
    module_id: str
    attention_score: float
    engagement_level: str
    total_frames: int
    attentive_frames: int
    attention_breaks: int
    longest_attention_span: int
    avg_attention_span: float

# --- Utils ---
def ensure_dlib_shape_predictor():
    """Download dlib model if not present"""
    if os.path.exists(DLIB_MODEL):
        return
    logger.info("Downloading dlib 68-point predictor (~100MB) ...")
    import urllib.request
    import bz2
    bz2_path = DLIB_MODEL + ".bz2"
    urllib.request.urlretrieve(DLIB_URL, bz2_path)
    with bz2.open(bz2_path, "rb") as f_in, open(DLIB_MODEL, "wb") as f_out:
        f_out.write(f_in.read())
    os.remove(bz2_path)
    logger.info(f"Model ready: {DLIB_MODEL}")

def shape_to_np(shape, dtype="int"):
    """Convert dlib shape to numpy array"""
    coords = np.zeros((68, 2), dtype=dtype)
    for i in range(68):
        coords[i] = (shape.part(i).x, shape.part(i).y)
    return coords

def eye_aspect_ratio(eye_pts):
    """Calculate Eye Aspect Ratio"""
    A = np.linalg.norm(eye_pts[1] - eye_pts[5])  # p2-p6
    B = np.linalg.norm(eye_pts[2] - eye_pts[4])  # p3-p5
    C = np.linalg.norm(eye_pts[0] - eye_pts[3])  # p1-p4
    if C == 0:
        return 0.0
    return (A + B) / (2.0 * C)

def angle_between_eyes(left_center, right_center):
    """Calculate head tilt angle"""
    dx = right_center[0] - left_center[0]
    dy = right_center[1] - left_center[1]
    if dx == 0:
        return 90.0
    return abs(math.degrees(math.atan2(dy, dx)))

def calculate_camera_quality(gray_frame):
    """Calculate camera quality score based on contrast and sharpness"""
    # Calculate contrast (standard deviation of pixel intensities)
    contrast = np.std(gray_frame)
    
    # Calculate sharpness using Laplacian variance
    laplacian = cv2.Laplacian(gray_frame, cv2.CV_64F)
    sharpness = laplacian.var()
    
    # Normalize to 0-100 scale
    quality_score = min(100, (contrast / 64) * 50 + (sharpness / 1000) * 50)
    return max(0, quality_score)

# --- Attention Analyzer Class ---
class AttentionAnalyzer:
    def __init__(self):
        if DLIB_AVAILABLE:
            ensure_dlib_shape_predictor()
            self.detector = dlib.get_frontal_face_detector()
            self.predictor = dlib.shape_predictor(DLIB_MODEL)
        else:
            self.detector = None
            self.predictor = None
            print("⚠️  Running without dlib - using basic OpenCV face detection")
        self.sessions: Dict[str, Dict] = {}
        
    async def analyze_frame(self, frame_data: str, session_id: str) -> AttentionMetrics:
        """Analyze a single frame for attention metrics"""
        try:
            logger.info(f"📊 Analyzing frame for session: {session_id}")
            
            # Decode base64 frame
            # Extract base64 data (remove data URL prefix if present)
            base64_data = frame_data.split(',')[1] if ',' in frame_data else frame_data
            
            # Fix base64 padding if needed
            missing_padding = len(base64_data) % 4
            if missing_padding:
                base64_data += '=' * (4 - missing_padding)
            
            frame_bytes = base64.b64decode(base64_data)
            nparr = np.frombuffer(frame_bytes, np.uint8)
            frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            if frame is None:
                raise ValueError("Could not decode frame")
                
            logger.info(f"🎥 Frame decoded successfully: {frame.shape}")
            
            # Convert to grayscale and enhance
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            clahe = cv2.createCLAHE(clipLimit=CLAHE_CLIP, tileGridSize=TILE_GRID)
            gray = clahe.apply(gray)
            
            # Calculate camera quality
            camera_quality = calculate_camera_quality(gray)
            logger.info(f"📷 Camera quality: {camera_quality:.2f}")
            
            # Detect faces
            if DLIB_AVAILABLE and self.detector is not None:
                logger.info("🤖 Using dlib face detection model...")
                # Use dlib for better accuracy
                faces = self.detector(gray, 1)
                face_detected = len(faces) > 0
                logger.info(f"👤 Dlib detected {len(faces)} face(s)")
                
                if face_detected:
                    # Use largest face
                    def rect_area(r): return (r.right() - r.left()) * (r.bottom() - r.top())
                    faces = sorted(faces, key=rect_area, reverse=True)
                    face = faces[0]
                    
                    # Get facial landmarks
                    shape = self.predictor(gray, face)
                    landmarks = shape_to_np(shape)
                    logger.info(f"🎯 Extracted {len(landmarks)} facial landmarks using dlib")
                    
                    # Extract eye regions
                    left_eye_pts = landmarks[36:42]   # Left eye landmarks
                    right_eye_pts = landmarks[42:48]  # Right eye landmarks
                    
                    left_center = np.mean(left_eye_pts, axis=0)
                    right_center = np.mean(right_eye_pts, axis=0)
                    
                    # Calculate detailed metrics using dlib landmarks
                    ear_left = eye_aspect_ratio(left_eye_pts)
                    ear_right = eye_aspect_ratio(right_eye_pts) 
                    eye_aspect_ratio_value = (ear_left + ear_right) / 2
                    head_tilt_degrees = angle_between_eyes(left_center, right_center)
                    
                    logger.info(f"👁️  Dlib Analysis - Eye ratio: {eye_aspect_ratio_value:.3f}, Head tilt: {head_tilt_degrees:.1f}°")
                else:
                    eye_aspect_ratio_value = 0.0
                    head_tilt_degrees = 0.0
            else:
                logger.info("🔧 Using OpenCV Haar Cascade fallback (dlib not available)")
                # Fallback to OpenCV Haar Cascade
                face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
                faces = face_cascade.detectMultiScale(gray, 1.3, 5)
                face_detected = len(faces) > 0
                logger.info(f"👤 OpenCV detected {len(faces)} face(s)")
                
                if face_detected:
                    # Use basic metrics without detailed landmarks
                    eye_aspect_ratio_value = 0.3  # Default reasonable value
                    head_tilt_degrees = 0.0  # Cannot calculate without landmarks
                    logger.info("👁️  OpenCV Analysis - Using default values (no landmark detection)")
                else:
                    eye_aspect_ratio_value = 0.0
                    head_tilt_degrees = 0.0
            if not face_detected:
                # No face detected
                metrics = AttentionMetrics(
                    session_id=session_id,
                    timestamp=datetime.now(timezone.utc),
                    is_attentive=False,
                    eye_aspect_ratio=0.0,
                    head_tilt_degrees=0.0,
                    face_detected=False,
                    camera_quality=camera_quality
                )
                await self._update_session_metrics(session_id, metrics)
                return metrics
            
            # Determine attention state based on available metrics
            if DLIB_AVAILABLE and self.detector is not None:
                # Use precise thresholds for dlib-based analysis
                eyes_open = eye_aspect_ratio_value >= EAR_THRESH
                head_forward = head_tilt_degrees <= ANGLE_MAX
                logger.info(f"🎯 Dlib-based attention analysis:")
                logger.info(f"   Eyes open: {eyes_open} (EAR: {eye_aspect_ratio_value:.3f} >= {EAR_THRESH})")
                logger.info(f"   Head forward: {head_forward} (Tilt: {head_tilt_degrees:.1f}° <= {ANGLE_MAX}°)")
            else:
                # Use fallback logic for OpenCV-based analysis
                eyes_open = eye_aspect_ratio_value >= EAR_THRESH
                head_forward = head_tilt_degrees <= ANGLE_MAX
                logger.info(f"🔧 OpenCV-based attention analysis:")
                logger.info(f"   Eyes open: {eyes_open} (EAR: {eye_aspect_ratio_value:.3f} >= {EAR_THRESH})")
                logger.info(f"   Head forward: {head_forward} (Tilt: {head_tilt_degrees:.1f}° <= {ANGLE_MAX}°)")
            
            is_attentive = eyes_open and head_forward
            attention_percentage = 100 if is_attentive else 0
            
            logger.info(f"📈 Final Attention Result: {attention_percentage}% ({'ATTENTIVE' if is_attentive else 'DISTRACTED'})")
            
            metrics = AttentionMetrics(
                session_id=session_id,
                timestamp=datetime.now(timezone.utc),
                is_attentive=is_attentive,
                eye_aspect_ratio=eye_aspect_ratio_value,
                head_tilt_degrees=head_tilt_degrees,
                face_detected=True,
                camera_quality=camera_quality
            )
            
            await self._update_session_metrics(session_id, metrics)
            return metrics
            
        except Exception as e:
            logger.error(f"Error analyzing frame: {str(e)}")
            # Return default metrics on error
            return AttentionMetrics(
                session_id=session_id,
                timestamp=datetime.now(timezone.utc),
                is_attentive=False,
                eye_aspect_ratio=0.0,
                head_tilt_degrees=0.0,
                face_detected=False,
                camera_quality=0.0
            )
    
    async def _update_session_metrics(self, session_id: str, metrics: AttentionMetrics):
        """Update running session statistics"""
        if session_id not in self.sessions:
            return
            
        session = self.sessions[session_id]
        session['frames'].append({
            'timestamp': metrics.timestamp,
            'is_attentive': metrics.is_attentive,
            'ear': metrics.eye_aspect_ratio,
            'tilt': metrics.head_tilt_degrees,
            'face_detected': metrics.face_detected,
            'camera_quality': metrics.camera_quality
        })
        
        # Update running statistics
        total_frames = len(session['frames'])
        attentive_frames = sum(1 for f in session['frames'] if f['is_attentive'])
        
        session['stats'] = {
            'total_frames': total_frames,
            'attentive_frames': attentive_frames,
            'attention_score': (attentive_frames / total_frames * 100) if total_frames > 0 else 0,
            'avg_ear': np.mean([f['ear'] for f in session['frames'] if f['face_detected']]) if any(f['face_detected'] for f in session['frames']) else 0,
            'avg_tilt': np.mean([f['tilt'] for f in session['frames'] if f['face_detected']]) if any(f['face_detected'] for f in session['frames']) else 0,
            'frames_with_face': sum(1 for f in session['frames'] if f['face_detected']),
            'frames_without_face': sum(1 for f in session['frames'] if not f['face_detected']),
            'avg_camera_quality': np.mean([f['camera_quality'] for f in session['frames']])
        }
    
    def start_session(self, session_data: AttentionSessionStart) -> str:
        """Start a new attention tracking session"""
        session_id = str(uuid.uuid4())
        self.sessions[session_id] = {
            'child_id': session_data.child_id,
            'module_id': session_data.module_id,
            'video_url': session_data.video_url,
            'video_duration': session_data.video_duration_seconds,
            'start_time': datetime.now(timezone.utc),
            'frames': [],
            'stats': {}
        }
        logger.info(f"Started attention session {session_id} for child {session_data.child_id}")
        return session_id
    
    async def end_session(self, session_id: str, notes: Optional[str] = None) -> SessionSummary:
        """End session and calculate final statistics"""
        if session_id not in self.sessions:
            raise ValueError(f"Session {session_id} not found")
        
        session = self.sessions[session_id]
        session['end_time'] = datetime.now(timezone.utc)
        
        # Calculate final statistics
        frames = session['frames']
        if not frames:
            raise ValueError("No frames analyzed in session")
        
        # Calculate attention breaks and spans
        attention_spans = []
        current_span = 0
        breaks = 0
        
        for frame in frames:
            if frame['is_attentive']:
                current_span += 1
            else:
                if current_span > 0:
                    attention_spans.append(current_span)
                    current_span = 0
                    breaks += 1
        
        if current_span > 0:
            attention_spans.append(current_span)
        
        stats = session['stats']
        
        summary = SessionSummary(
            session_id=session_id,
            child_id=session['child_id'],
            module_id=session['module_id'],
            attention_score=stats.get('attention_score', 0),
            engagement_level='high' if stats.get('attention_score', 0) >= 80 else 'medium' if stats.get('attention_score', 0) >= 50 else 'low',
            total_frames=stats.get('total_frames', 0),
            attentive_frames=stats.get('attentive_frames', 0),
            attention_breaks=breaks,
            longest_attention_span=max(attention_spans) if attention_spans else 0,
            avg_attention_span=np.mean(attention_spans) if attention_spans else 0
        )
        
        # Save to database
        await self._save_session_to_db(session_id, summary, session, notes)
        
        # Clean up session data
        del self.sessions[session_id]
        
        return summary
    
    async def _save_session_to_db(self, session_id: str, summary: SessionSummary, session: dict, notes: Optional[str]):
        """Save session results to database"""
        try:
            # Get session metadata
            child_id = session.get('child_id')
            module_id = session.get('module_id')
            start_time = session.get('start_time')
            end_time = datetime.now(timezone.utc)
            
            # Calculate additional metrics
            duration_minutes = (end_time - start_time).total_seconds() / 60 if start_time else 0
            
            # Connect to Supabase PostgreSQL
            conn = psycopg2.connect(**DB_CONFIG)
            cursor = conn.cursor()
            
            # Insert into attention_sessions table
            insert_query = """
                INSERT INTO attention_sessions (
                    session_id, child_id, learning_module_id, start_time, end_time,
                    duration_minutes, total_frames_analyzed, frames_with_face_detected,
                    avg_attention_score, min_attention_score, max_attention_score,
                    avg_eye_aspect_ratio, avg_head_tilt, attention_breaks_count,
                    longest_attention_span_seconds, avg_attention_span_seconds,
                    engagement_level, notes, raw_session_data
                ) VALUES (
                    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                )
            """
            
            # Prepare data
            session_data = {
                'frames_analyzed': summary.total_frames,
                'attention_scores': [frame.get('attention_score', 0) for frame in session.get('frames', [])],
                'eye_ratios': [frame.get('eye_aspect_ratio', 0) for frame in session.get('frames', [])],
                'head_tilts': [frame.get('head_tilt', 0) for frame in session.get('frames', [])],
                'timestamps': [frame.get('timestamp') for frame in session.get('frames', [])]
            }
            
            cursor.execute(insert_query, (
                session_id,
                child_id,
                module_id,
                start_time,
                end_time,
                duration_minutes,
                summary.total_frames,
                summary.face_detected_frames,
                summary.attention_score,
                summary.min_attention_score,
                summary.max_attention_score,
                summary.avg_eye_aspect_ratio,
                summary.avg_head_tilt,
                summary.attention_breaks,
                summary.longest_attention_span,
                summary.avg_attention_span,
                summary.engagement_level,
                notes,
                json.dumps(session_data)
            ))
            
            conn.commit()
            cursor.close()
            conn.close()
            
            logger.info(f"✅ Session {session_id} saved to database successfully")
            logger.info(f"   Child ID: {child_id}, Module ID: {module_id}")
            logger.info(f"   Attention Score: {summary.attention_score:.1f}%")
            logger.info(f"   Duration: {duration_minutes:.1f} minutes")
            
        except Exception as e:
            logger.error(f"❌ Error saving session to database: {str(e)}")
            # Don't raise the exception to avoid breaking the session end

# --- FastAPI App ---
app = FastAPI(
    title="Attention Span Analysis Service",
    description="Real-time attention tracking for autistic children during video learning",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development (includes localhost:3000, 5173, and file://)
    allow_credentials=False,  # Must be False when allow_origins is "*"
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global analyzer instance
analyzer = AttentionAnalyzer()

# Active WebSocket connections
active_connections: Dict[str, WebSocket] = {}

# --- API Endpoints ---
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy", 
        "service": "attention-analysis",
        "dlib_available": DLIB_AVAILABLE,
        "model_loaded": os.path.exists(DLIB_MODEL) if DLIB_AVAILABLE else False
    }

@app.post("/sessions/start")
async def start_attention_session(session_data: AttentionSessionStart) -> dict:
    """Start a new attention tracking session"""
    try:
        session_id = analyzer.start_session(session_data)
        return {"session_id": session_id, "status": "started"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/sessions/end")
async def end_attention_session(session_end: AttentionSessionEnd) -> SessionSummary:
    """End an attention tracking session and get results"""
    try:
        summary = await analyzer.end_session(session_end.session_id, session_end.notes)
        return summary
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/sessions/{session_id}/stats")
async def get_session_stats(session_id: str) -> dict:
    """Get current session statistics"""
    if session_id not in analyzer.sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = analyzer.sessions[session_id]
    return {
        "session_id": session_id,
        "child_id": session['child_id'],
        "stats": session.get('stats', {}),
        "duration_seconds": (datetime.now(timezone.utc) - session['start_time']).total_seconds()
    }

# --- WebSocket Endpoint ---
@app.websocket("/ws/attention/{session_id}")
async def websocket_attention_analysis(websocket: WebSocket, session_id: str):
    """WebSocket endpoint for real-time attention analysis"""
    await websocket.accept()
    active_connections[session_id] = websocket
    
    try:
        logger.info(f"WebSocket connected for session {session_id}")
        
        while True:
            # Receive frame data
            frame_data = await websocket.receive_text()
            
            # Analyze frame
            metrics = await analyzer.analyze_frame(frame_data, session_id)
            
            # Send results back
            await websocket.send_json({
                "type": "attention_metrics",
                "data": {
                    "session_id": metrics.session_id,
                    "timestamp": metrics.timestamp.isoformat(),
                    "is_attentive": metrics.is_attentive,
                    "eye_aspect_ratio": metrics.eye_aspect_ratio,
                    "head_tilt_degrees": metrics.head_tilt_degrees,
                    "face_detected": metrics.face_detected,
                    "camera_quality": metrics.camera_quality
                }
            })
            
            # Send session stats periodically
            if session_id in analyzer.sessions:
                stats = analyzer.sessions[session_id].get('stats', {})
                await websocket.send_json({
                    "type": "session_stats",
                    "data": stats
                })
    
    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected for session {session_id}")
    except Exception as e:
        logger.error(f"WebSocket error for session {session_id}: {str(e)}")
    finally:
        if session_id in active_connections:
            del active_connections[session_id]

if __name__ == "__main__":
    logger.info("Starting Attention Analysis Service...")
    uvicorn.run(
        "attention_service:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )