#!/usr/bin/env python3
"""
Script to verify and create attention_sessions table in Supabase
"""
import os
import psycopg2
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables
project_root = Path(__file__).parent.parent
load_dotenv(project_root / '.env')

# Get database configuration
SUPABASE_URL = os.getenv('VITE_SUPABASE_URL')
SUPABASE_DB_PASSWORD = os.getenv('SUPABASE_DB_PASSWORD')

if not SUPABASE_URL or not SUPABASE_DB_PASSWORD:
    print("❌ Error: SUPABASE_URL or SUPABASE_DB_PASSWORD not found in .env")
    exit(1)

# Parse project reference from URL
project_ref = SUPABASE_URL.split('//')[1].split('.')[0]
db_host = f'db.{project_ref}.supabase.co'

# Database configuration
DB_CONFIG = {
    'host': db_host,
    'database': 'postgres',
    'user': 'postgres',
    'password': SUPABASE_DB_PASSWORD,
    'port': 6543,
    'sslmode': 'require'
}

print("🔌 Connecting to Supabase...")
print(f"   Host: {db_host}:6543")

try:
    conn = psycopg2.connect(**DB_CONFIG)
    cursor = conn.cursor()
    
    # Check if table exists
    cursor.execute("""
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'attention_sessions'
        );
    """)
    
    table_exists = cursor.fetchone()[0]
    
    if table_exists:
        print("✅ Table 'attention_sessions' already exists!")
        
        # Show table structure
        cursor.execute("""
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'attention_sessions'
            ORDER BY ordinal_position;
        """)
        
        columns = cursor.fetchall()
        print(f"\n📋 Found {len(columns)} columns:")
        for col_name, col_type, nullable in columns:
            null_str = "NULL" if nullable == 'YES' else "NOT NULL"
            print(f"   - {col_name}: {col_type} ({null_str})")
        
    else:
        print("⚠️  Table 'attention_sessions' does not exist")
        print("📝 Creating table...")
        
        create_table_sql = """
        CREATE TABLE IF NOT EXISTS attention_sessions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            child_id TEXT NOT NULL,
            module_id TEXT NOT NULL,
            video_url TEXT,
            session_start TIMESTAMPTZ NOT NULL,
            session_end TIMESTAMPTZ NOT NULL,
            video_duration_seconds INTEGER,
            total_frames_analyzed INTEGER DEFAULT 0,
            attentive_frames INTEGER DEFAULT 0,
            attention_score DECIMAL(5, 2),
            avg_eye_aspect_ratio DECIMAL(5, 4),
            avg_head_tilt_degrees DECIMAL(6, 2),
            engagement_level TEXT CHECK (engagement_level IN ('high', 'medium', 'low')),
            attention_breaks INTEGER DEFAULT 0,
            longest_attention_span_seconds INTEGER DEFAULT 0,
            average_attention_span_seconds DECIMAL(10, 2),
            frames_with_face INTEGER DEFAULT 0,
            frames_without_face INTEGER DEFAULT 0,
            notes TEXT,
            created_at TIMESTAMPTZ DEFAULT now()
        );
        
        -- Create indexes
        CREATE INDEX IF NOT EXISTS idx_attention_child ON attention_sessions(child_id);
        CREATE INDEX IF NOT EXISTS idx_attention_module ON attention_sessions(module_id);
        CREATE INDEX IF NOT EXISTS idx_attention_start ON attention_sessions(session_start);
        """
        
        cursor.execute(create_table_sql)
        conn.commit()
        
        print("✅ Table created successfully!")
    
    print("\n🎉 Database setup complete!")
    print("\n💡 Your attention tracking data will now be saved to:")
    print(f"   Database: {db_host}")
    print(f"   Table: attention_sessions")
    
    cursor.close()
    conn.close()
    
except Exception as e:
    print(f"❌ Error: {str(e)}")
    exit(1)
