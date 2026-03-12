import { supabase } from './supabaseClient';

export const getRestaurantPopup = async (restaurantId) => {
	if (!supabase) {
		console.error('[getRestaurantPopup] Supabase client is not initialized');
		return null;
	}
	if (!restaurantId) {
		return null;
	}

	const { data, error } = await supabase
		.from('app_home_popup')
		.select('*')
		.eq('restaurant_id', restaurantId)
		.eq('is_active', true)
		.single();

	if (error) {
		if (error.code === 'PGRST116') {
			return null;
		}

		throw new Error(`Failed to fetch restaurant popup: ${error.message}`);
	}

	return data ?? null;
};

export const getRestaurantPromotions = async (restaurantId) => {
	if (!restaurantId) {
		return [];
	}
	if (!supabase) {
		console.error('[getRestaurantPromotions] Supabase client is not initialized');
		return [];
	}

	const { data, error } = await supabase
		.from('app_promotions')
		.select('*')
		.eq('restaurant_id', restaurantId)
		.eq('is_active', true)
		.order('display_order', { ascending: true });

	if (error) {
		throw new Error(`Failed to fetch restaurant promotions: ${error.message}`);
	}

	return data ?? [];
};

export const getRestaurantGiftCards = async (restaurantId) => {
	if (!restaurantId) {
		return [];
	}
	if (!supabase) {
		console.error('[getRestaurantGiftCards] Supabase client is not initialized');
		return [];
	}

	const { data, error } = await supabase
		.from('app_gift_cards')
		.select('*')
		.eq('restaurant_id', restaurantId)
		.eq('is_active', true);

	if (error) {
		throw new Error(`Failed to fetch restaurant gift cards: ${error.message}`);
	}

	return data ?? [];
};
