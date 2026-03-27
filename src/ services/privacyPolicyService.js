import { supabase } from './supabaseClient';

export const getLatestPrivacyPolicy = async () => {
	if (!supabase) {
		console.error('[getLatestPrivacyPolicy] Supabase client is not initialized');
		return null;
	}

	const { data, error } = await supabase
		.from('privacy_policies')
		.select('id, title, content, created_at')
		.order('created_at', { ascending: false })
		.limit(1)
		.maybeSingle();

	if (error) {
		console.error('[getLatestPrivacyPolicy] Failed to fetch privacy policy:', error);
		return null;
	}

	return data ?? null;
};
