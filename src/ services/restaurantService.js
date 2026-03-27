import { supabase } from './supabaseClient';

/**
 * Obtiene restaurantes con estado de delivery en tiempo real.
 * @param {function} onUpdate Callback para actualizar restaurantes en tiempo real.
 * @returns {function} cleanup para eliminar la suscripción.
 */
export function subscribeRestaurantsWithDeliveryStatus(onUpdate) {
	let subscription = null;
	let isMounted = true;

	if (!supabase) {
		console.error('[subscribeRestaurantsWithDeliveryStatus] Supabase client is not initialized');
		if (isMounted && typeof onUpdate === 'function') onUpdate([]);
		return () => {
			isMounted = false;
		};
	}

	async function fetchRestaurants() {
		const { data, error } = await supabase
			.from('restaurants')
			.select(`
				*,
				restaurant_categories (
					category_id,
					categories (
						id,
						name,
						icon
					)
				),
				restaurant_drivers (
					is_approved,
					is_online,
					driver:delivery_drivers (
						id,
						is_active
					)
				)
			`)
			.eq('is_active', true);

		if (error) {
			console.error('[subscribeRestaurantsWithDeliveryStatus] Failed to fetch restaurants:', error);
			if (isMounted && typeof onUpdate === 'function') onUpdate([]);
			return;
		}

		const restaurants = (data ?? []).map(restaurant => {
			const hasDeliveryNow =
				restaurant.is_open === true &&
				restaurant.accepts_delivery === true &&
				Array.isArray(restaurant.restaurant_drivers) &&
				restaurant.restaurant_drivers.some(rd =>
					rd.is_approved === true &&
					rd.is_online === true &&
					rd.driver?.is_active === true
				);
			return {
				...restaurant,
				has_delivery_now: hasDeliveryNow
			};
		});
		if (isMounted) onUpdate(restaurants);
	}

	fetchRestaurants();

	subscription = supabase
		.channel('restaurant_drivers_changes')
		.on(
			'postgres_changes',
			{ event: 'UPDATE', schema: 'public', table: 'restaurant_drivers' },
			() => {
				fetchRestaurants();
			}
		)
		.subscribe();

	return () => {
		isMounted = false;
		if (subscription) supabase.removeChannel(subscription);
	};
}

/**
 * Obtiene restaurantes activos dentro de 15 km usando la columna geography `location`.
 * Requiere una función RPC en la base de datos llamada `nearby_restaurants`.
 *
 * SQL orientativo para la función (ejecutar en Supabase):
 *
 * create or replace function nearby_restaurants(
 *   lat float,
 *   lng float
 * )
 * returns setof restaurants
 * language sql
 * stable
 * as $$
 *   select *
 *   from restaurants
 *   where is_active = true
 *   and ST_DWithin(
 *     location,
 *     ST_SetSRID(ST_MakePoint(lng, lat),4326)::geography,
 *     15000
 *   );
 * $$;
 */
export const getNearbyRestaurants = async (userLatitude, userLongitude) => {
	if (!supabase) {
		console.error('[getNearbyRestaurants] Supabase client is not initialized');
		return [];
	}

	if (typeof userLatitude !== 'number' || typeof userLongitude !== 'number') {
		// Sin coordenadas válidas devolvemos todos los restaurantes activos sin filtro de distancia.
		const { data, error } = await supabase
			.from('restaurants')
			.select(`
				id,
				name,
				business_type,
				is_featured,
				banner_image_url,
				logo_image_url,
				menu_url,
				is_open,
				accepts_delivery,
				accepts_takeaway,
				restaurant_categories (
					category_id,
					categories (
						id,
						name,
						icon
					)
				)
			`)
			.eq('is_active', true);

		if (error) {
			console.error('[getNearbyRestaurants] Failed to fetch active restaurants without location:', error);
			return [];
		}

		return data ?? [];
	}

	// Con coordenadas válidas usamos la RPC nearby_restaurants para que el filtro de distancia
	// se haga completamente en la base de datos con ST_DWithin.
	const { data, error } = await supabase
		.rpc('nearby_restaurants', {
			lat: userLatitude,
				lng: userLongitude,
		})
		.select(`
			id,
			name,
			latitude,
			longitude,
			business_type,
			is_featured,
			banner_image_url,
			logo_image_url,
			menu_url,
			is_open,
			accepts_delivery,
			accepts_takeaway,
			restaurant_categories (
				category_id,
				categories (
					id,
					name,
					icon
				)
			)
		`);

	if (error) {
		console.error('[getNearbyRestaurants] Failed to fetch nearby restaurants:', error);
		return [];
	}

	return data ?? [];
};


export const getActiveRestaurants = async () => {
	if (!supabase) {
		console.error('[getActiveRestaurants] Supabase client is not initialized');
		return [];
	}

	const { data, error } = await supabase
		.from('restaurants')
		.select('id, name, business_type, latitude, longitude, banner_image_url, logo_image_url, menu_url, is_open, accepts_delivery, accepts_takeaway')
		.eq('is_active', true)
		.not('latitude', 'is', null)
		.not('longitude', 'is', null);

	if (error) {
		console.error('[getActiveRestaurants] Failed to fetch active restaurants:', error);
		return [];
	}

	const restaurants = data ?? [];

	return restaurants.map((restaurant) => {
		const nextRestaurant = { ...restaurant };

		if (
			typeof nextRestaurant.banner_image_url === 'string' &&
			nextRestaurant.banner_image_url !== null &&
			nextRestaurant.banner_image_url &&
			!nextRestaurant.banner_image_url.startsWith('http')
		) {
			const { data: bannerData } = supabase.storage
				.from('app-images')
				.getPublicUrl(nextRestaurant.banner_image_url);

			nextRestaurant.banner_image_url = bannerData?.publicUrl ?? nextRestaurant.banner_image_url;
		}

		if (
			typeof nextRestaurant.logo_image_url === 'string' &&
			nextRestaurant.logo_image_url !== null &&
			nextRestaurant.logo_image_url &&
			!nextRestaurant.logo_image_url.startsWith('http')
		) {
			const { data: logoData } = supabase.storage
				.from('app-images')
				.getPublicUrl(nextRestaurant.logo_image_url);

			nextRestaurant.logo_image_url = logoData?.publicUrl ?? nextRestaurant.logo_image_url;
		}

		return nextRestaurant;
	});
};

export const getRestaurantsWithCategories = async () => {
	if (!supabase) {
		console.error('[getRestaurantsWithCategories] Supabase client is not initialized');
		return [];
	}

	const { data, error } = await supabase
		.from('restaurants')
		.select(`
			id,
			name,
			business_type,
			latitude,
			longitude,
			banner_image_url,
			logo_image_url,
			menu_url,
			is_open,
			accepts_delivery,
			accepts_takeaway,
			restaurant_categories (
				category_id,
				categories (
					id,
					name
				)
			)
		`)
		.eq('is_active', true)
		.not('latitude', 'is', null)
		.not('longitude', 'is', null);

	if (error) {
		console.error('[getRestaurantsWithCategories] Failed to fetch restaurants with categories:', error);
		return [];
	}

	const restaurants = data ?? [];

	return restaurants.map((restaurant) => {
		const nextRestaurant = { ...restaurant };

		if (
			typeof nextRestaurant.banner_image_url === 'string' &&
			nextRestaurant.banner_image_url &&
			!nextRestaurant.banner_image_url.startsWith('http')
		) {
			const { data: bannerData } = supabase.storage
				.from('app-images')
				.getPublicUrl(nextRestaurant.banner_image_url);

			nextRestaurant.banner_image_url = bannerData?.publicUrl ?? nextRestaurant.banner_image_url;
		}

		if (
			typeof nextRestaurant.logo_image_url === 'string' &&
			nextRestaurant.logo_image_url &&
			!nextRestaurant.logo_image_url.startsWith('http')
		) {
			const { data: logoData } = supabase.storage
				.from('app-images')
				.getPublicUrl(nextRestaurant.logo_image_url);

			nextRestaurant.logo_image_url = logoData?.publicUrl ?? nextRestaurant.logo_image_url;
		}

		return nextRestaurant;
	});
};

export const getFeaturedRestaurants = async () => {
	if (!supabase) {
		console.error('[getFeaturedRestaurants] Supabase client is not initialized');
		return [];
	}

	const { data, error } = await supabase
		.from('restaurants')
		.select('id, name, business_type, latitude, longitude, banner_image_url, logo_image_url, menu_url, is_open, accepts_delivery, accepts_takeaway, created_at')
		.eq('is_active', true)
		.eq('is_featured', true)
		.order('created_at', { ascending: false });

	if (error) {
		console.error('[getFeaturedRestaurants] Failed to fetch featured restaurants:', error);
		return [];
	}

	const restaurants = data ?? [];

	return restaurants.map((restaurant) => {
		const nextRestaurant = { ...restaurant };

		if (
			typeof nextRestaurant.banner_image_url === 'string' &&
			nextRestaurant.banner_image_url &&
			!nextRestaurant.banner_image_url.startsWith('http')
		) {
			const { data: bannerData } = supabase.storage
				.from('app-images')
				.getPublicUrl(nextRestaurant.banner_image_url);

			nextRestaurant.banner_image_url = bannerData?.publicUrl ?? nextRestaurant.banner_image_url;
		}

		if (
			typeof nextRestaurant.logo_image_url === 'string' &&
			nextRestaurant.logo_image_url &&
			!nextRestaurant.logo_image_url.startsWith('http')
		) {
			const { data: logoData } = supabase.storage
				.from('app-images')
				.getPublicUrl(nextRestaurant.logo_image_url);

			nextRestaurant.logo_image_url = logoData?.publicUrl ?? nextRestaurant.logo_image_url;
		}

		return nextRestaurant;
	});
};
