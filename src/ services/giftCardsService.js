import { supabase } from './supabaseClient';

export const getMarketplaceGiftCards = async () => {
	if (!supabase) {
		console.error('[getMarketplaceGiftCards] Supabase client is not initialized');
		return [];
	}

	const { data, error } = await supabase
		.from('app_market_gift_cards')
		.select(`
			id,
			business_name,
			image_url,
			business_url,
			is_active,
			display_order,
			created_at,
			app_market_gift_cards_restaurants (
				restaurant:restaurants (
					id,
					name,
					logo_image_url
				)
			)
		`)
		.eq('is_active', true)
		.order('display_order', { ascending: true })
		.order('created_at', { ascending: true });

	if (error) {
		console.error('[getMarketplaceGiftCards] Failed to fetch gift cards:', error);
		return [];
	}

	const safeData = data ?? [];
	if (import.meta.env.DEV) {
		console.log('[getMarketplaceGiftCards] Gift cards loaded (no filtro por tipo de negocio):', safeData);
	}

	return safeData;
};
