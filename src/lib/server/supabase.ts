import { createClient } from '@supabase/supabase-js';
import { SUPABASE_SERVICE_KEY } from '$env/static/private';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';

if (!PUBLIC_SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
	console.warn('Supabase server env vars are missing.');
}

export const supabaseAdmin = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_KEY, {
	auth: {
		persistSession: false,
		autoRefreshToken: false
	}
});
