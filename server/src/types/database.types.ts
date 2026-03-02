// server/src/types/database.types.ts

// Script-related interfaces (defined first for use in Database type)
export interface ScriptParameters {
  // For refinement
  refinementType?: 'simple' | 'custom'
  customInstructions?: string
  originalScript?: string
  
  // For generation
  title?: string
  language?: string
  topic?: string
  scriptType?: string
  tone?: string
  targetAudience?: string
  keyPoints?: string
  introStyle?: string
  includeHook?: boolean
  includeCTA?: boolean
  includeTransitions?: boolean
  includeQuestions?: boolean
  specialRequirements?: string
  
  // Common parameters
  duration: number
  pacing: string
}

export interface ScriptVersion {
  versionNumber: number
  content: string
  feedback: string
  createdAt: string
}

export interface ScriptMetadata {
  wordCount: number
  estimatedDuration: number
  scriptType?: string
  tone?: string
}

// Database schema types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          clerk_id: string
          email: string | null
          first_name: string | null
          last_name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          clerk_id: string
          email?: string | null
          first_name?: string | null
          last_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          clerk_id?: string
          email?: string | null
          first_name?: string | null
          last_name?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      scripts: {
        Row: {
          id: string
          script_id: string
          user_id: string
          language: string
          method: 'refinement' | 'generated' | 'passthrough'
          content: string
          parameters: ScriptParameters | null
          versions: ScriptVersion[]
          status: 'draft' | 'approved' | 'in_progress'
          metadata: ScriptMetadata | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          script_id: string
          user_id: string
          language: string
          method: 'refinement' | 'generated' | 'passthrough'
          content: string
          parameters?: ScriptParameters | null
          versions?: ScriptVersion[]
          status?: 'draft' | 'approved' | 'in_progress'
          metadata?: ScriptMetadata | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          script_id?: string
          user_id?: string
          language?: string
          method?: 'refinement' | 'generated' | 'passthrough'
          content?: string
          parameters?: ScriptParameters | null
          versions?: ScriptVersion[]
          status?: 'draft' | 'approved' | 'in_progress'
          metadata?: ScriptMetadata | null
          created_at?: string
          updated_at?: string
        }
      }
      user_media: {
        Row: {
          id: string
          clerk_id: string
          media_type: 'audio' | 'video'
          language: 'english' | 'urdu' | null
          filename: string
          file_path: string
          mime_type: string | null
          size_bytes: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          clerk_id: string
          media_type: 'audio' | 'video'
          language?: 'english' | 'urdu' | null
          filename: string
          file_path: string
          mime_type?: string | null
          size_bytes?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          clerk_id?: string
          media_type?: 'audio' | 'video'
          language?: 'english' | 'urdu' | null
          filename?: string
          file_path?: string
          mime_type?: string | null
          size_bytes?: number | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

// Script interface for convenience
export interface Script {
  id: string
  script_id: string
  user_id: string
  language: string
  method: 'refinement' | 'generated' | 'passthrough'
  content: string
  parameters: ScriptParameters | null
  versions: ScriptVersion[]
  status: 'draft' | 'approved' | 'in_progress'
  metadata: ScriptMetadata | null
  created_at: string
  updated_at: string
}
