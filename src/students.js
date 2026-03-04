import { supabase } from './supabase.js';

/**
 * Fetch all students with their total earned points and spent points.
 * Returns: [{ id, name, total_earned, total_spent, balance }]
 */
export async function getStudents() {
    // Get students
    const { data: students, error: sErr } = await supabase
        .from('students')
        .select('id, name, created_at')
        .order('name');

    if (sErr) throw sErr;
    if (!students.length) return [];

    // Get earned points (sum of positive amounts from points table)
    const { data: pointTotals, error: pErr } = await supabase
        .from('points')
        .select('student_id, amount');

    if (pErr) throw pErr;

    // Get spent points (sum from redemptions table)
    const { data: redemptions, error: rErr } = await supabase
        .from('redemptions')
        .select('student_id, cost');

    if (rErr) throw rErr;

    // Aggregate
    const earned = {};
    for (const p of pointTotals) {
        earned[p.student_id] = (earned[p.student_id] || 0) + p.amount;
    }

    const spent = {};
    for (const r of redemptions) {
        spent[r.student_id] = (spent[r.student_id] || 0) + r.cost;
    }

    return students.map((s) => ({
        ...s,
        total_earned: earned[s.id] || 0,
        total_spent: spent[s.id] || 0,
        balance: (earned[s.id] || 0) - (spent[s.id] || 0),
    }));
}

/**
 * Add a new student.
 */
export async function addStudent(name) {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
        .from('students')
        .insert({ name, created_by: user.id })
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Delete a student by ID.
 */
export async function deleteStudent(id) {
    const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', id);

    if (error) throw error;
}
