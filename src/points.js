import { supabase } from './supabase.js';

/** Default point categories */
export const CATEGORIES = [
    'Listening',
    'Participation',
    'Kindness',
    'Homework',
    'Teamwork',
    'Effort',
    'General',
];

/**
 * Award (or deduct) points to a student.
 * @param {string} studentId
 * @param {number} amount — positive = award, negative = deduct
 * @param {string} category
 */
export async function awardPoints(studentId, amount, category = 'General') {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
        .from('points')
        .insert({
            student_id: studentId,
            amount,
            category,
            awarded_by: user.id,
        })
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Get the leaderboard — students sorted by total earned points (desc).
 */
export async function getLeaderboard() {
    // Re-use the student query with aggregation
    const { data: students, error: sErr } = await supabase
        .from('students')
        .select('id, name');

    if (sErr) throw sErr;
    if (!students.length) return [];

    const { data: points, error: pErr } = await supabase
        .from('points')
        .select('student_id, amount');

    if (pErr) throw pErr;

    const { data: redemptions, error: rErr } = await supabase
        .from('redemptions')
        .select('student_id, cost');

    if (rErr) throw rErr;

    const earned = {};
    for (const p of points) {
        earned[p.student_id] = (earned[p.student_id] || 0) + p.amount;
    }

    const spent = {};
    for (const r of redemptions) {
        spent[r.student_id] = (spent[r.student_id] || 0) + r.cost;
    }

    return students
        .map((s) => ({
            id: s.id,
            name: s.name,
            total_earned: earned[s.id] || 0,
            balance: (earned[s.id] || 0) - (spent[s.id] || 0),
        }))
        .sort((a, b) => b.total_earned - a.total_earned);
}

/**
 * Reset all points (delete all rows from points table).
 * Admin only — call from admin console.
 */
export async function resetAllPoints() {
    const { error } = await supabase
        .from('points')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // delete all rows

    if (error) throw error;
}
