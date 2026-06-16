import { supabase } from './supabase';

export type ModerationVerdict = 'approved' | 'needs_review' | 'rejected';

export interface ModerationResult {
  verdict: ModerationVerdict;
  confidence: number;
  reason: string;
  flags: string[];
}

export interface ModerationInput {
  contentType: 'review' | 'classified_ad' | 'auction' | 'job_posting' | 'job_seeker' | 'business' | 'professional_profile' | 'report';
  contentId?: string;
  title?: string;
  description?: string;
  category?: string;
  price?: number;
}

export async function moderateContent(input: ModerationInput): Promise<ModerationResult> {
  try {
    const { data, error } = await supabase.functions.invoke('moderate-content', {
      body: input,
    });

    if (error || !data) {
      console.warn('Moderation service unavailable, defaulting to needs_review');
      return { verdict: 'needs_review', confidence: 0.5, reason: '', flags: [] };
    }

    return data as ModerationResult;
  } catch (err) {
    console.warn('Moderation error, defaulting to needs_review:', err);
    return { verdict: 'needs_review', confidence: 0.5, reason: '', flags: [] };
  }
}

export function getModerationBadge(status: string | null | undefined): {
  label: string;
  color: string;
  bg: string;
  border: string;
} {
  switch (status) {
    case 'approved':
      return { label: 'AI: OK', color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200' };
    case 'rejected':
      return { label: 'AI: Rifiutato', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' };
    case 'needs_review':
      return { label: 'AI: Da verificare', color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200' };
    default:
      return { label: 'AI: Non analizzato', color: 'text-gray-500', bg: 'bg-gray-50', border: 'border-gray-200' };
  }
}
