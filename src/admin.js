import { supabase } from './supabase.js';

/**
 * Invite a new user via Netlify Function (which uses the service role key).
 * @param {string} email
 * @param {string} role — 'admin' or 'teacher'
 * @param {string} password — initial password
 */
export async function inviteUser(email, role, password) {
    const { data: { session } } = await supabase.auth.getSession();

    const res = await fetch('/.netlify/functions/admin', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ action: 'invite', email, role, password }),
    });

    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to invite user');
    return result;
}

/**
 * List all users via Netlify Function.
 */
export async function listUsers() {
    const { data: { session } } = await supabase.auth.getSession();

    const res = await fetch('/.netlify/functions/admin?action=list-users', {
        headers: {
            'Authorization': `Bearer ${session.access_token}`,
        },
    });

    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to list users');
    return result.users;
}

/**
 * Get admin stats: total students, points, redemptions, users.
 */
export async function getAdminStats() {
    const [students, points, redemptions] = await Promise.all([
        supabase.from('students').select('id', { count: 'exact', head: true }),
        supabase.from('points').select('amount'),
        supabase.from('redemptions').select('id', { count: 'exact', head: true }),
    ]);

    const totalPoints = (points.data || []).reduce((sum, p) => sum + p.amount, 0);

    return {
        students: students.count || 0,
        points: totalPoints,
        redemptions: redemptions.count || 0,
    };
}
