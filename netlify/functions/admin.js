/**
 * Netlify Function: Admin operations
 * Handles user management via Supabase Admin API (service role key).
 * Only accessible to admin users.
 */

import { createClient } from '@supabase/supabase-js';

// Server-side Supabase client with service role key (full admin access)
const supabaseAdmin = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Public Supabase client to verify the calling user's auth token
const supabasePublic = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

/**
 * Verify the request is from an authenticated admin user.
 */
async function verifyAdmin(authHeader) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return { user: null, error: 'Missing authorization header' };
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error } = await supabasePublic.auth.getUser(token);

    if (error || !user) {
        return { user: null, error: 'Invalid token' };
    }

    if (user.user_metadata?.role !== 'admin') {
        return { user: null, error: 'Admin access required' };
    }

    return { user, error: null };
}

export async function handler(event) {
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
    };

    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 204, headers, body: '' };
    }

    // Verify admin access
    const { user, error: authError } = await verifyAdmin(
        event.headers.authorization || event.headers.Authorization
    );

    if (authError) {
        return {
            statusCode: 401,
            headers,
            body: JSON.stringify({ error: authError }),
        };
    }

    try {
        // ── GET: List users ──
        if (event.httpMethod === 'GET') {
            const params = event.queryStringParameters || {};

            if (params.action === 'list-users') {
                const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();
                if (error) throw error;
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({ users }),
                };
            }

            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Unknown action' }),
            };
        }

        // ── POST: Invite user ──
        if (event.httpMethod === 'POST') {
            const body = JSON.parse(event.body);

            if (body.action === 'invite') {
                const { email, role, password } = body;

                if (!email || !password) {
                    return {
                        statusCode: 400,
                        headers,
                        body: JSON.stringify({ error: 'Email and password are required' }),
                    };
                }

                const { data, error } = await supabaseAdmin.auth.admin.createUser({
                    email,
                    password,
                    email_confirm: true, // auto-confirm the email
                    user_metadata: { role: role || 'teacher' },
                });

                if (error) throw error;

                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({ user: data.user, message: `Invited ${email} as ${role}` }),
                };
            }

            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Unknown action' }),
            };
        }

        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' }),
        };
    } catch (err) {
        console.error('Admin function error:', err);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: err.message }),
        };
    }
}
