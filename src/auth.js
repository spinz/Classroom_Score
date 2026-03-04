import { supabase } from './supabase.js';

/**
 * Sign in with email and password.
 * @returns {{ user, error }}
 */
export async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });
    return { user: data?.user ?? null, error };
}

/**
 * Sign out the current user.
 */
export async function signOut() {
    const { error } = await supabase.auth.signOut();
    return { error };
}

/**
 * Get the currently logged-in user (if any).
 * @returns {{ user, session }}
 */
export async function getCurrentUser() {
    const { data: { session } } = await supabase.auth.getSession();
    return {
        user: session?.user ?? null,
        session,
    };
}

/**
 * Check if the current user has admin role.
 * We store role in user_metadata.role (set during invite).
 */
export function isAdmin(user) {
    if (!user) return false;
    return user.user_metadata?.role === 'admin';
}

/**
 * Listen for auth state changes (login/logout).
 */
export function onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange((_event, session) => {
        callback(session?.user ?? null, session);
    });
}
