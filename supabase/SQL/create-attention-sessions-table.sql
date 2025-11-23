-- ============================================
-- ATTENTION SESSIONS TABLE
-- Tracks real-time attention metrics during video watching
-- ============================================

-- Create the attention_sessions table
CREATE TABLE attention_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID REFERENCES children(id) ON DELETE CASCADE NOT NULL,
  module_id UUID REFERENCES learning_modules(id) ON DELETE CASCADE NOT NULL,
  video_url TEXT NOT NULL,
  
  -- Session timing
  session_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  session_end TIMESTAMP WITH TIME ZONE,
  
  -- Video metrics
  video_duration_seconds INTEGER NOT NULL,
  total_frames_analyzed INTEGER DEFAULT 0,
  
  -- Attention metrics from computer vision model
  attentive_frames INTEGER DEFAULT 0,
  attention_score FLOAT DEFAULT 0 CHECK (attention_score >= 0 AND attention_score <= 100),
  avg_eye_aspect_ratio FLOAT DEFAULT 0,
  avg_head_tilt_degrees FLOAT DEFAULT 0,
  
  -- Engagement analysis
  engagement_level TEXT CHECK (engagement_level IN ('low', 'medium', 'high')),
  attention_breaks INTEGER DEFAULT 0, -- number of times attention was lost
  longest_attention_span_seconds INTEGER DEFAULT 0,
  average_attention_span_seconds FLOAT DEFAULT 0,
  
  -- Technical quality metrics
  frames_with_face INTEGER DEFAULT 0,
  frames_without_face INTEGER DEFAULT 0,
  camera_quality_score FLOAT DEFAULT 0 CHECK (camera_quality_score >= 0 AND camera_quality_score <= 100),
  
  -- Additional metadata
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES for better query performance
-- ============================================
CREATE INDEX idx_attention_sessions_child_id ON attention_sessions(child_id);
CREATE INDEX idx_attention_sessions_module_id ON attention_sessions(module_id);
CREATE INDEX idx_attention_sessions_session_start ON attention_sessions(session_start DESC);
CREATE INDEX idx_attention_sessions_attention_score ON attention_sessions(attention_score);
CREATE INDEX idx_attention_sessions_engagement_level ON attention_sessions(engagement_level);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================
ALTER TABLE attention_sessions ENABLE ROW LEVEL SECURITY;

-- Parents can view attention sessions for their own children
CREATE POLICY "Parents can view attention sessions for their children" 
  ON attention_sessions FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM children 
      WHERE id = attention_sessions.child_id 
      AND parent_id = auth.uid()
    )
  );

-- Educators can view attention sessions for assigned children
CREATE POLICY "Educators can view attention sessions for assigned children" 
  ON attention_sessions FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM children 
      WHERE id = attention_sessions.child_id 
      AND (
        educator_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM parent_educator_assignments 
          WHERE educator_id = auth.uid() 
          AND child_id = children.id 
          AND is_active = true
        )
      )
    )
  );

-- Parents can insert attention sessions for their own children
CREATE POLICY "Parents can insert attention sessions for their children" 
  ON attention_sessions FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM children 
      WHERE id = attention_sessions.child_id 
      AND parent_id = auth.uid()
    )
  );

-- Parents can update attention sessions for their own children
CREATE POLICY "Parents can update attention sessions for their children" 
  ON attention_sessions FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM children 
      WHERE id = attention_sessions.child_id 
      AND parent_id = auth.uid()
    )
  );

-- Admins can manage all attention sessions
CREATE POLICY "Admins can manage all attention sessions" 
  ON attention_sessions FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_attention_sessions_updated_at 
  BEFORE UPDATE ON attention_sessions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to calculate engagement_level based on attention_score
CREATE OR REPLACE FUNCTION calculate_engagement_level()
RETURNS TRIGGER AS $$
BEGIN
  -- Automatically set engagement level based on attention score
  IF NEW.attention_score >= 80 THEN
    NEW.engagement_level = 'high';
  ELSIF NEW.attention_score >= 50 THEN
    NEW.engagement_level = 'medium';
  ELSE
    NEW.engagement_level = 'low';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_engagement_level_trigger
  BEFORE INSERT OR UPDATE ON attention_sessions
  FOR EACH ROW 
  EXECUTE FUNCTION calculate_engagement_level();

-- ============================================
-- COMMENTS for documentation
-- ============================================
COMMENT ON TABLE attention_sessions IS 'Tracks real-time attention metrics during video watching using computer vision';
COMMENT ON COLUMN attention_sessions.child_id IS 'Reference to the child watching the video';
COMMENT ON COLUMN attention_sessions.module_id IS 'Reference to the learning module being watched';
COMMENT ON COLUMN attention_sessions.video_url IS 'URL of the video that was watched';
COMMENT ON COLUMN attention_sessions.video_duration_seconds IS 'Total duration of the video in seconds';
COMMENT ON COLUMN attention_sessions.total_frames_analyzed IS 'Total number of camera frames analyzed during session';
COMMENT ON COLUMN attention_sessions.attentive_frames IS 'Number of frames where child was detected as attentive';
COMMENT ON COLUMN attention_sessions.attention_score IS 'Overall attention percentage (attentive_frames / total_frames * 100)';
COMMENT ON COLUMN attention_sessions.avg_eye_aspect_ratio IS 'Average Eye Aspect Ratio - measures eye openness';
COMMENT ON COLUMN attention_sessions.avg_head_tilt_degrees IS 'Average head tilt in degrees from horizontal';
COMMENT ON COLUMN attention_sessions.engagement_level IS 'Automatically calculated: high (80%+), medium (50-79%), low (<50%)';
COMMENT ON COLUMN attention_sessions.attention_breaks IS 'Number of times attention was lost and regained';
COMMENT ON COLUMN attention_sessions.longest_attention_span_seconds IS 'Longest continuous period of attention';
COMMENT ON COLUMN attention_sessions.average_attention_span_seconds IS 'Average length of attention spans during session';
COMMENT ON COLUMN attention_sessions.frames_with_face IS 'Number of frames where a face was detected';
COMMENT ON COLUMN attention_sessions.frames_without_face IS 'Number of frames where no face was detected';
COMMENT ON COLUMN attention_sessions.camera_quality_score IS 'Quality score of camera feed (lighting, clarity, etc.)';

-- ============================================
-- VERIFICATION
-- ============================================
-- Verify the table was created successfully
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'attention_sessions'
ORDER BY ordinal_position;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
SELECT 'Attention Sessions table created successfully! 🎯' as status;