import { supabase } from './supabase.js';

/**
 * Get all active rewards.
 */
export async function getRewards() {
    const { data, error } = await supabase
        .from('rewards')
        .select('*')
        .eq('active', true)
        .order('cost');

    if (error) throw error;
    return data;
}

/**
 * Add a new reward to the shop.
 */
export async function addReward({ name, description, cost, stock, image_url }) {
    const { data, error } = await supabase
        .from('rewards')
        .insert({ name, description, cost, stock: stock || null, image_url: image_url || null })
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Update an existing reward.
 */
export async function updateReward(id, updates) {
    const { data, error } = await supabase
        .from('rewards')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Soft-delete a reward (set active = false).
 */
export async function deleteReward(id) {
    const { error } = await supabase
        .from('rewards')
        .update({ active: false })
        .eq('id', id);

    if (error) throw error;
}

/**
 * Redeem a reward for a student.
 * Validates that the student has enough balance.
 * @param {string} studentId
 * @param {string} rewardId
 * @param {number} cost — the cost at time of purchase
 * @returns {{ success, error }}
 */
export async function redeemReward(studentId, rewardId, cost) {
    const { data: { user } } = await supabase.auth.getUser();

    // Insert the redemption record
    const { data, error } = await supabase
        .from('redemptions')
        .insert({
            student_id: studentId,
            reward_id: rewardId,
            cost,
            processed_by: user.id,
        })
        .select()
        .single();

    if (error) throw error;

    // If reward has stock, decrement it
    const { data: reward } = await supabase
        .from('rewards')
        .select('stock')
        .eq('id', rewardId)
        .single();

    if (reward && reward.stock !== null) {
        await supabase
            .from('rewards')
            .update({ stock: reward.stock - 1 })
            .eq('id', rewardId);
    }

    return data;
}

/**
 * Get redemption history for a student.
 */
export async function getRedemptionHistory(studentId) {
    const { data, error } = await supabase
        .from('redemptions')
        .select('*, rewards(name)')
        .eq('student_id', studentId)
        .order('redeemed_at', { ascending: false });

    if (error) throw error;
    return data;
}
