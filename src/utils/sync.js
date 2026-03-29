import { supabase } from './supabase';

/**
 * Load user profile from Supabase.
 * Returns null if not found or Supabase is not configured.
 */
export async function loadFromSupabase(userId) {
    if (!supabase || !userId) return null;

    try {
        const { data, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = row not found
            console.error('[Supabase] Load error:', error.message);
            return null;
        }

        return data || null;
    } catch (e) {
        console.error('[Supabase] Load exception:', e);
        return null;
    }
}

/**
 * Save (upsert) the current app state to Supabase for the given user.
 */
export async function saveToSupabase(userId, state) {
    if (!supabase || !userId) return;

    try {
        const { error } = await supabase
            .from('user_profiles')
            .upsert({
                id: userId,
                name: state.user?.name,
                email: state.user?.email,
                picture: state.user?.picture,
                xp: state.xp,
                streak: state.streak,
                last_study_date: state.lastStudyDate,
                words: state.words,
                sentences: state.sentences,
                shadowing_progress: state.shadowingProgress,
                quiz_history: state.quizHistory,
                chat_sessions: state.chatSessions,
                story_progress: state.storyProgress,
                updated_at: new Date().toISOString(),
            }, { onConflict: 'id' });

        if (error) console.error('[Supabase] Save error:', error.message);
    } catch (e) {
        console.error('[Supabase] Save exception:', e);
    }
}
