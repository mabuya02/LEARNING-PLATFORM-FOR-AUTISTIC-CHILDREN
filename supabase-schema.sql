-- ============================================
-- LEARNING PLATFORM FOR AUTISTIC CHILDREN
-- Complete Database Schema
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLE 1: PROFILES
-- Stores all user accounts (admin, educator, parent, child)
-- ============================================
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'educator', 'parent', 'child')),
  child_id UUID,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABLE 2: CHILDREN
-- Stores child-specific profiles and settings
-- ============================================
CREATE TABLE children (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  age INTEGER,
  parent_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  educator_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  profile_settings JSONB DEFAULT '{}',
  unlocked_difficulties TEXT[] DEFAULT ARRAY['easy'],
  total_stars INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABLE 3: LEARNING_MODULES
-- Stores all learning activities/lessons
-- ============================================
CREATE TABLE learning_modules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('visual', 'audio', 'interactive', 'game')),
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  duration INTEGER DEFAULT 10,
  age_group TEXT,
  icon TEXT,
  content JSONB DEFAULT '{}',
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABLE 4: PROGRESS
-- Tracks child performance on each module attempt
-- ============================================
CREATE TABLE progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID REFERENCES children(id) ON DELETE CASCADE NOT NULL,
  module_id UUID REFERENCES learning_modules(id) ON DELETE CASCADE NOT NULL,
  module_name TEXT NOT NULL,
  score INTEGER DEFAULT 0 CHECK (score >= 0 AND score <= 100),
  correct_answers INTEGER DEFAULT 0,
  total_questions INTEGER DEFAULT 0,
  time_spent INTEGER DEFAULT 0,
  attention_span INTEGER DEFAULT 0,
  engagement_level TEXT CHECK (engagement_level IN ('low', 'medium', 'high')),
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABLE 5: SESSIONS
-- Tracks individual learning sessions
-- ============================================
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID REFERENCES children(id) ON DELETE CASCADE NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  total_attention_time INTEGER DEFAULT 0,
  modules_completed INTEGER DEFAULT 0,
  total_score INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABLE 6: MODULE_COMPLETIONS
-- Tracks completed modules for unlocking system
-- ============================================
CREATE TABLE module_completions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID REFERENCES children(id) ON DELETE CASCADE NOT NULL,
  module_id UUID REFERENCES learning_modules(id) ON DELETE CASCADE NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  stars_earned INTEGER DEFAULT 0 CHECK (stars_earned >= 0 AND stars_earned <= 3),
  first_completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  best_score INTEGER DEFAULT 0,
  times_completed INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(child_id, module_id, difficulty)
);

-- ============================================
-- TABLE 7: PARENT_EDUCATOR_ASSIGNMENTS
-- Links educators to children they monitor
-- ============================================
CREATE TABLE parent_educator_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  educator_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  child_id UUID REFERENCES children(id) ON DELETE CASCADE NOT NULL,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  UNIQUE(educator_id, child_id)
);

-- ============================================
-- TABLE 8: MODULE_ANALYTICS (Optional)
-- Stores aggregated statistics for modules
-- ============================================
CREATE TABLE module_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  module_id UUID REFERENCES learning_modules(id) ON DELETE CASCADE NOT NULL UNIQUE,
  total_attempts INTEGER DEFAULT 0,
  total_completions INTEGER DEFAULT 0,
  average_score FLOAT DEFAULT 0,
  average_time_spent INTEGER DEFAULT 0,
  average_engagement FLOAT DEFAULT 0,
  popularity_rank INTEGER,
  last_calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES for better query performance
-- ============================================
CREATE INDEX idx_children_parent_id ON children(parent_id);
CREATE INDEX idx_children_educator_id ON children(educator_id);
CREATE INDEX idx_progress_child_id ON progress(child_id);
CREATE INDEX idx_progress_module_id ON progress(module_id);
CREATE INDEX idx_progress_completed_at ON progress(completed_at DESC);
CREATE INDEX idx_sessions_child_id ON sessions(child_id);
CREATE INDEX idx_sessions_start_time ON sessions(start_time DESC);
CREATE INDEX idx_module_completions_child_id ON module_completions(child_id);
CREATE INDEX idx_learning_modules_created_by ON learning_modules(created_by);
CREATE INDEX idx_learning_modules_type ON learning_modules(type);
CREATE INDEX idx_learning_modules_difficulty ON learning_modules(difficulty);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE children ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_educator_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_analytics ENABLE ROW LEVEL SECURITY;

-- PROFILES policies
CREATE POLICY "Users can view own profile" 
  ON profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" 
  ON profiles FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- CHILDREN policies
CREATE POLICY "Parents can view their own children" 
  ON children FOR SELECT 
  USING (parent_id = auth.uid());

CREATE POLICY "Educators can view assigned children" 
  ON children FOR SELECT 
  USING (
    educator_id = auth.uid() 
    OR EXISTS (
      SELECT 1 FROM parent_educator_assignments 
      WHERE educator_id = auth.uid() AND child_id = children.id AND is_active = true
    )
  );

CREATE POLICY "Parents can insert their own children" 
  ON children FOR INSERT 
  WITH CHECK (parent_id = auth.uid());

CREATE POLICY "Parents can update their own children" 
  ON children FOR UPDATE 
  USING (parent_id = auth.uid());

CREATE POLICY "Admins can manage all children" 
  ON children FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- LEARNING_MODULES policies
CREATE POLICY "Anyone authenticated can view active modules" 
  ON learning_modules FOR SELECT 
  USING (is_active = true AND auth.uid() IS NOT NULL);

CREATE POLICY "Educators can create modules" 
  ON learning_modules FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('educator', 'admin')
    )
  );

CREATE POLICY "Educators can update own modules" 
  ON learning_modules FOR UPDATE 
  USING (created_by = auth.uid());

CREATE POLICY "Admins can manage all modules" 
  ON learning_modules FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- PROGRESS policies
CREATE POLICY "View progress for accessible children" 
  ON progress FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM children 
      WHERE id = progress.child_id 
      AND (
        parent_id = auth.uid() 
        OR educator_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM parent_educator_assignments 
          WHERE educator_id = auth.uid() AND child_id = children.id AND is_active = true
        )
      )
    )
  );

CREATE POLICY "Insert progress for accessible children" 
  ON progress FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM children 
      WHERE id = progress.child_id 
      AND parent_id = auth.uid()
    )
  );

-- SESSIONS policies
CREATE POLICY "View sessions for accessible children" 
  ON sessions FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM children 
      WHERE id = sessions.child_id 
      AND (
        parent_id = auth.uid() 
        OR educator_id = auth.uid()
      )
    )
  );

CREATE POLICY "Insert sessions for own children" 
  ON sessions FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM children 
      WHERE id = sessions.child_id 
      AND parent_id = auth.uid()
    )
  );

-- MODULE_COMPLETIONS policies
CREATE POLICY "View completions for accessible children" 
  ON module_completions FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM children 
      WHERE id = module_completions.child_id 
      AND (parent_id = auth.uid() OR educator_id = auth.uid())
    )
  );

CREATE POLICY "Insert completions for own children" 
  ON module_completions FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM children 
      WHERE id = module_completions.child_id 
      AND parent_id = auth.uid()
    )
  );

-- PARENT_EDUCATOR_ASSIGNMENTS policies
CREATE POLICY "Educators can view their assignments" 
  ON parent_educator_assignments FOR SELECT 
  USING (educator_id = auth.uid());

CREATE POLICY "Parents can view assignments for their children" 
  ON parent_educator_assignments FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM children 
      WHERE id = parent_educator_assignments.child_id 
      AND parent_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all assignments" 
  ON parent_educator_assignments FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- MODULE_ANALYTICS policies
CREATE POLICY "Educators and admins can view analytics" 
  ON module_analytics FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('educator', 'admin')
    )
  );

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_children_updated_at 
  BEFORE UPDATE ON children 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_learning_modules_updated_at 
  BEFORE UPDATE ON learning_modules 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_module_completions_updated_at 
  BEFORE UPDATE ON module_completions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- INSERT DEFAULT DATA
-- ============================================

-- Insert default learning modules (will be created by system)
-- Note: These will be created after first admin user is set up
-- For now, we'll insert them with NULL created_by

INSERT INTO learning_modules (title, description, type, difficulty, icon, age_group) VALUES
  ('Color Learning', 'Learn about different colors with fun activities', 'visual', 'easy', '🎨', '3-6'),
  ('Number Counting', 'Practice counting numbers from 1 to 10', 'interactive', 'easy', '🔢', '4-7'),
  ('Animal Sounds', 'Match animals with their sounds', 'audio', 'easy', '🐾', '3-5'),
  ('Shape Sorting', 'Identify and sort different shapes', 'interactive', 'easy', '⬛', '4-6'),
  ('Big and Small', 'Learn about sizes and comparisons', 'visual', 'easy', '📏', '3-6');

-- ============================================
-- COMPLETE! 🎉
-- ============================================
-- All 8 tables created with proper relationships,
-- indexes, RLS policies, and triggers!
-- ============================================
