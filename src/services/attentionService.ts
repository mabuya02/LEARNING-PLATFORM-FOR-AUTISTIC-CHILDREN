import { supabase } from '../lib/supabase';

// Define the attention session interface
export interface AttentionSession {
  id?: string;
  child_id: string;
  module_id: string;
  video_url: string;
  session_start?: string;
  session_end?: string;
  video_duration_seconds: number;
  total_frames_analyzed: number;
  attentive_frames: number;
  attention_score: number;
  avg_eye_aspect_ratio: number;
  avg_head_tilt_degrees: number;
  engagement_level: 'low' | 'medium' | 'high';
  attention_breaks: number;
  longest_attention_span_seconds: number;
  average_attention_span_seconds: number;
  frames_with_face: number;
  frames_without_face: number;
  camera_quality_score: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export const attentionService = {
  // Create a new attention session
  async createSession(sessionData: {
    child_id: string;
    module_id: string;
    video_url: string;
    video_duration_seconds: number;
  }): Promise<AttentionSession> {
    console.log('🎯 Creating attention session in Supabase:', sessionData);
    
    const { data, error } = await supabase
      .from('attention_sessions')
      .insert({
        ...sessionData,
        session_start: new Date().toISOString(),
        total_frames_analyzed: 0,
        attentive_frames: 0,
        attention_score: 0,
        avg_eye_aspect_ratio: 0,
        avg_head_tilt_degrees: 0,
        engagement_level: 'low',
        attention_breaks: 0,
        longest_attention_span_seconds: 0,
        average_attention_span_seconds: 0,
        frames_with_face: 0,
        frames_without_face: 0,
        camera_quality_score: 0
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating attention session:', error);
      throw error;
    }

    console.log('✅ Attention session created successfully:', data);
    return data;
  },

  // Update session with real-time data
  async updateSession(sessionId: string, updateData: {
    total_frames_analyzed?: number;
    attentive_frames?: number;
    attention_score?: number;
    avg_eye_aspect_ratio?: number;
    avg_head_tilt_degrees?: number;
    engagement_level?: 'low' | 'medium' | 'high';
    frames_with_face?: number;
    frames_without_face?: number;
    camera_quality_score?: number;
    attention_breaks?: number;
    longest_attention_span_seconds?: number;
    average_attention_span_seconds?: number;
  }): Promise<AttentionSession> {
    console.log('📊 Updating attention session:', sessionId, updateData);

    const { data, error } = await supabase
      .from('attention_sessions')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId)
      .select()
      .single();

    if (error) {
      console.error('❌ Error updating attention session:', error);
      throw error;
    }

    console.log('✅ Attention session updated successfully');
    return data;
  },

  // End session with final statistics
  async endSession(sessionId: string, finalData: {
    attention_score: number;
    engagement_level: 'low' | 'medium' | 'high';
    total_frames_analyzed: number;
    attentive_frames: number;
    avg_eye_aspect_ratio: number;
    avg_head_tilt_degrees: number;
    frames_with_face: number;
    frames_without_face: number;
    camera_quality_score: number;
    attention_breaks: number;
    longest_attention_span_seconds: number;
    average_attention_span_seconds: number;
    notes?: string;
  }): Promise<AttentionSession> {
    console.log('🏁 Ending attention session:', sessionId, finalData);

    const { data, error } = await supabase
      .from('attention_sessions')
      .update({
        ...finalData,
        session_end: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId)
      .select()
      .single();

    if (error) {
      console.error('❌ Error ending attention session:', error);
      throw error;
    }

    console.log('✅ Attention session ended successfully:', data);
    return data;
  },

  // Get sessions for a child
  async getSessionsByChild(childId: string): Promise<AttentionSession[]> {
    const { data, error } = await supabase
      .from('attention_sessions')
      .select('*')
      .eq('child_id', childId)
      .order('session_start', { ascending: false });

    if (error) {
      console.error('❌ Error fetching attention sessions:', error);
      throw error;
    }

    return data || [];
  },

  // Get sessions for a module
  async getSessionsByModule(moduleId: string): Promise<AttentionSession[]> {
    const { data, error } = await supabase
      .from('attention_sessions')
      .select('*')
      .eq('module_id', moduleId)
      .order('session_start', { ascending: false });

    if (error) {
      console.error('❌ Error fetching module attention sessions:', error);
      throw error;
    }

    return data || [];
  },

  // Get session analytics for a child
  async getChildAttentionAnalytics(childId: string) {
    const sessions = await this.getSessionsByChild(childId);
    
    if (sessions.length === 0) {
      return {
        totalSessions: 0,
        averageAttentionScore: 0,
        averageEngagement: 'low',
        totalVideoTimeWatched: 0,
        bestAttentionScore: 0,
        improvementTrend: 'stable'
      };
    }

    const totalSessions = sessions.length;
    const averageAttentionScore = sessions.reduce((sum, s) => sum + s.attention_score, 0) / totalSessions;
    const totalVideoTimeWatched = sessions.reduce((sum, s) => sum + s.video_duration_seconds, 0);
    const bestAttentionScore = Math.max(...sessions.map(s => s.attention_score));
    
    // Determine average engagement level
    const engagementCounts = sessions.reduce((counts, s) => {
      counts[s.engagement_level] = (counts[s.engagement_level] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);
    
    const averageEngagement = Object.entries(engagementCounts).reduce((a, b) => 
      engagementCounts[a[0]] > engagementCounts[b[0]] ? a : b
    )[0] as 'low' | 'medium' | 'high';

    // Calculate improvement trend (last 5 vs previous 5 sessions)
    let improvementTrend: 'improving' | 'stable' | 'declining' = 'stable';
    if (sessions.length >= 6) {
      const recent5 = sessions.slice(0, 5);
      const previous5 = sessions.slice(5, 10);
      const recentAvg = recent5.reduce((sum, s) => sum + s.attention_score, 0) / 5;
      const previousAvg = previous5.reduce((sum, s) => sum + s.attention_score, 0) / 5;
      
      if (recentAvg > previousAvg + 5) improvementTrend = 'improving';
      else if (recentAvg < previousAvg - 5) improvementTrend = 'declining';
    }

    return {
      totalSessions,
      averageAttentionScore: Math.round(averageAttentionScore),
      averageEngagement,
      totalVideoTimeWatched,
      bestAttentionScore: Math.round(bestAttentionScore),
      improvementTrend,
      recentSessions: sessions.slice(0, 10)
    };
  }
};