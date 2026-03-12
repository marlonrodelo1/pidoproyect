import { supabase } from './supabaseClient';

export const getCategories = async () => {
	if (!supabase) {
		console.error('[getCategories] Supabase client is not initialized');
		return [];
	}

	const { data, error } = await supabase
		.from('categories')
		.select('id, name, icon, created_at')
		.order('created_at', { ascending: true });

	if (error) {
		console.error('[getCategories] Failed to fetch categories:', error);
		return [];
	}

	const categories = data ?? [];

	return categories.map((category) => {
		const nextCategory = { ...category };

		if (
			typeof nextCategory.icon === 'string' &&
			nextCategory.icon &&
			!nextCategory.icon.startsWith('http')
		) {
			const { data: iconData } = supabase.storage
				.from('app-images')
				.getPublicUrl(nextCategory.icon);

			nextCategory.icon = iconData?.publicUrl ?? nextCategory.icon;
		}

		return nextCategory;
	});
};
