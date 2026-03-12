import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Geolocation } from '@capacitor/geolocation';
import RestaurantCard from '../components/RestaurantCard';
import FeaturedSlider from '../components/FeaturedSlider';
import { getCategories } from '../ services/categoryService';
import { subscribeRestaurantsWithDeliveryStatus, getNearbyRestaurants } from '../ services/restaurantService';
import { getUserLocation, saveUserLocation } from '../utils/locationStorage';
import { calculateDistanceKm } from '../utils/distance';
import '../styles/home.css';

const HomePage = () => {
	const location = useLocation();
	const initialBusinessType = location.state?.businessType || 'food';

	const [userLocation, setUserLocation] = useState(() => getUserLocation());
	const userLatitude = userLocation?.latitude;
	const userLongitude = userLocation?.longitude;

	const [restaurants, setRestaurants] = useState([]);
	const [categories, setCategories] = useState([]);
	const [selectedCategory, setSelectedCategory] = useState(null);
	const [filteredRestaurants, setFilteredRestaurants] = useState([]);
	const [searchTerm, setSearchTerm] = useState('');
	const [businessType, setBusinessType] = useState(initialBusinessType);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState('');
	const [geoError, setGeoError] = useState('');

	const hasLocation = useMemo(() => {
		return typeof userLatitude === 'number' && typeof userLongitude === 'number';
	}, [userLatitude, userLongitude]);

	// Actualizar tipo de negocio si venimos de la pantalla inicial con otro valor
	useEffect(() => {
		if (location.state?.businessType) {
			setBusinessType(location.state.businessType);
		}
	}, [location.state?.businessType]);

	// Escuchar cambios del buscador de la barra inferior mediante un evento global sencillo
	useEffect(() => {
		const handleSearch = (event) => {
			const value = typeof event.detail === 'string' ? event.detail : '';
			setSearchTerm(value);
		};

		if (typeof window !== 'undefined') {
			window.addEventListener('pidoo:search', handleSearch);
		}

		return () => {
			if (typeof window !== 'undefined') {
				window.removeEventListener('pidoo:search', handleSearch);
			}
		};
	}, []);

	const requestLocation = async () => {
		// Si ya tenemos ubicación válida guardada, no volvemos a pedirla
		if (hasLocation) return;

		try {
			setGeoError('');
			const permission = await Geolocation.requestPermissions();

			if (permission.location === 'denied') {
				setGeoError('No pudimos acceder a tu ubicación. Actívala en los ajustes y vuelve a intentarlo.');
				return;
			}

			const position = await Geolocation.getCurrentPosition();
			const { latitude, longitude } = position.coords;

			if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
				setGeoError('No pudimos obtener tu ubicación. Inténtalo de nuevo.');
				return;
			}

			saveUserLocation(latitude, longitude);
			setUserLocation({ latitude, longitude });
		} catch (geoErr) {
			console.error('[HomePage] Error obteniendo geolocalización:', geoErr);
			setGeoError('No pudimos obtener tu ubicación. Puedes intentarlo de nuevo.');
		}
	};

	useEffect(() => {
		// Intentar obtener la ubicación del usuario al entrar en la Home
		if (!hasLocation) {
			requestLocation();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useEffect(() => {
		let cleanup = null;
		let isMounted = true;

		const loadMarketplaceData = async () => {
			setIsLoading(true);
			setError('');
			try {
				// Cargar categorías siempre, independientemente de restaurantes cercanos
				const categoriesData = await getCategories();
				if (!isMounted) return;
				setCategories(categoriesData ?? []);
			} catch (categoriesError) {
				if (!isMounted) return;
				console.error('[HomePage] Error cargando categorías:', categoriesError);
			}

			try {
				if (typeof userLatitude !== 'number' || typeof userLongitude !== 'number') {
					if (!isMounted) return;
					setRestaurants([]);
					setFilteredRestaurants([]);
					setError('Activa tu ubicación para ver restaurantes cercanos.');
				} else {
					const nearbyRestaurants = await getNearbyRestaurants(userLatitude, userLongitude);
					if (!isMounted) return;
					setRestaurants(nearbyRestaurants ?? []);
				}
			} catch (loadError) {
				if (!isMounted) return;
				console.error('[HomePage] Error cargando restaurantes o destacados:', loadError);
				setError(loadError?.message || 'No se pudieron cargar los restaurantes cercanos.');
				setRestaurants([]);
				setFilteredRestaurants([]);
			}
			setIsLoading(false);
		};

		loadMarketplaceData();

		cleanup = subscribeRestaurantsWithDeliveryStatus((restaurantsData) => {
			if (!isMounted) return;
			const incoming = restaurantsData ?? [];
			if (import.meta.env.DEV) {
				console.log('[HomePage] restaurantsData desde Supabase:', incoming);
			}
			setRestaurants(incoming);
		});

		return () => {
			isMounted = false;
			if (cleanup) cleanup();
		};
	}, [userLatitude, userLongitude]);

	useEffect(() => {
		const businessFilter = (restaurant) => {
			if (!businessType || businessType === 'all') return true;
			const type = restaurant.business_type || 'food';
			return type === businessType;
		};

		const selectedCategoryId = selectedCategory === null ? null : String(selectedCategory);

		const businessMatchedRestaurants = restaurants.filter(businessFilter);

		const categoryMatchedRestaurants = businessMatchedRestaurants.filter((restaurant) => {
			if (selectedCategoryId === null) {
				return true;
			}

			const links = Array.isArray(restaurant.restaurant_categories)
				? restaurant.restaurant_categories
				: [];

			return links.some((link) => {
				const linkCategoryId = link?.category_id ?? link?.categories?.id;
				return String(linkCategoryId) === selectedCategoryId;
			});
		});

		if (import.meta.env.DEV) {
			console.log('[HomePage] selectedCategory:', selectedCategoryId);
			console.log('[HomePage] resultado después del filtro de categoría:', categoryMatchedRestaurants);
		}

		// Filtro por texto de búsqueda (nombre o categoría)
		const term = searchTerm.trim().toLowerCase();
		const searchMatchedRestaurants = term
			? categoryMatchedRestaurants.filter((restaurant) => {
				const name = String(restaurant?.name ?? '').toLowerCase();
				const categoriesLinks = Array.isArray(restaurant.restaurant_categories)
					? restaurant.restaurant_categories
					: [];

				const categoryNames = categoriesLinks
					.map((rc) => rc?.categories?.name)
					.filter(Boolean)
					.map((value) => String(value).toLowerCase());

				const matchesName = name.includes(term);
				const matchesCategory = categoryNames.some((catName) => catName.includes(term));

				return matchesName || matchesCategory;
			})
			: categoryMatchedRestaurants;

		// El filtro de 15 km se hace en Supabase mediante la RPC nearby_restaurants,
		// pero aquí calculamos la distancia solo para mostrarla en la card y ordenar.
		const nextRestaurants = searchMatchedRestaurants.map((restaurant) => {
			let distanceKm = null;

			if (
				typeof userLatitude === 'number' &&
				typeof userLongitude === 'number' &&
				typeof restaurant.latitude === 'number' &&
				typeof restaurant.longitude === 'number'
			) {
				distanceKm = calculateDistanceKm(
					userLatitude,
					userLongitude,
					restaurant.latitude,
					restaurant.longitude,
				);
			}

			return {
				...restaurant,
				has_delivery_now: restaurant.has_delivery_now,
				distanceKm,
			};
		});

		nextRestaurants.sort((a, b) => {
			const da = typeof a.distanceKm === 'number' ? a.distanceKm : Number.POSITIVE_INFINITY;
			const db = typeof b.distanceKm === 'number' ? b.distanceKm : Number.POSITIVE_INFINITY;
			return da - db;
		});

		setFilteredRestaurants(nextRestaurants);
	}, [restaurants, selectedCategory, userLatitude, userLongitude, searchTerm]);

	const featuredNearby = filteredRestaurants.filter((restaurant) => restaurant.is_featured === true);
	const nearbyRestaurants = filteredRestaurants;

	const filteredCategoriesForBusiness = useMemo(() => {
		if (!Array.isArray(categories) || !Array.isArray(restaurants)) {
			return categories ?? [];
		}

		if (!businessType || businessType === 'all') {
			return categories;
		}

		const businessFilter = (restaurant) => {
			const type = restaurant.business_type || 'food';
			return type === businessType;
		};

		const businessRestaurants = restaurants.filter(businessFilter);
		const usedCategoryIds = new Set();

		businessRestaurants.forEach((restaurant) => {
			const links = Array.isArray(restaurant.restaurant_categories)
				? restaurant.restaurant_categories
				: [];

			links.forEach((link) => {
				const linkCategoryId = link?.category_id ?? link?.categories?.id;
				if (linkCategoryId != null) {
					usedCategoryIds.add(String(linkCategoryId));
				}
			});
		});

		if (usedCategoryIds.size === 0) {
			return categories;
		}

		return categories.filter((category) => usedCategoryIds.has(String(category.id)));
	}, [categories, restaurants, businessType]);

	const businessTypeTitleMap = {
		food: 'Comida',
		supermarket: 'Supermercados',
		pharmacy: 'Farmacias y belleza',
		store: 'Tiendas',
		parcel: 'Envío de paquetes',
		all: 'Restaurantes',
	};

	const sectionTitle = `${businessTypeTitleMap[businessType] || 'Restaurantes'} cerca de ti`;

	return (
	  <div className="page-container page-safe-container">
		<main style={styles.page}>
			<section style={styles.card}>
				<h1 className="home-title" style={styles.title}>{sectionTitle}</h1>

				{geoError && (
					<div style={styles.geoError}>
						<p style={styles.message}>{geoError}</p>
						<button
							type="button"
							style={styles.retryButton}
							onClick={requestLocation}
						>
							Intentar de nuevo
						</button>
					</div>
				)}

				<div className="categories-slider" role="tablist" aria-label="Categorías">
					<button
						type="button"
						className={`category-item ${selectedCategory === null ? 'is-active' : ''}`}
						onClick={() => setSelectedCategory(null)}
					>
						<span className="category-all">Todos</span>
					</button>

					{filteredCategoriesForBusiness.map((category) => (
						<button
							type="button"
							key={category.id}
							className={`category-item ${String(selectedCategory) === String(category.id) ? 'is-active' : ''}`}
							onClick={() => setSelectedCategory(String(category.id))}
						>
							<img
								src={category.icon || '/placeholder-logo.png'}
								alt={category.name ?? 'Categoría'}
								className="category-icon"
							/>
							<span className="category-label">{category.name ?? 'Categoría'}</span>
						</button>
					))}
				</div>

				{featuredNearby.length > 0 && (
					<>
						<h2 className="section-title">🔥 Restaurantes destacados</h2>
						<FeaturedSlider featuredRestaurants={featuredNearby} />
					</>
				)}

				{isLoading && <p style={styles.message}>Cargando restaurantes...</p>}

				{!isLoading && !!error && <p style={styles.message}>{error}</p>}

				{!isLoading && !error && filteredRestaurants.length === 0 && (
					<p style={styles.message}>
						{selectedCategory === null
							? 'No hay restaurantes activos cerca de ti.'
							: 'No hay restaurantes de esta categoría cerca de ti.'}
					</p>
				)}

				{!isLoading && !error && nearbyRestaurants.length > 0 && (
					<>
						<h2 className="section-title">📍 Todos los restaurantes cercanos</h2>
						<div style={styles.list}>
							{nearbyRestaurants.map((restaurant) => (
								<RestaurantCard
									key={restaurant.id ?? `${restaurant.name}-${restaurant.latitude}-${restaurant.longitude}`}
									restaurant={restaurant}
								/>
							))}
						</div>
					</>
				)}
			</section>
		</main>
	  </div>
	);
};

const styles = {
	page: {
		minHeight: '100vh',
		padding: '8px 0 12px',
		width: '100%',
	},
	card: {
		width: '100%',
		display: 'flex',
		flexDirection: 'column',
		gap: '12px',
	},
	title: {
		margin: 0,
		fontSize: '1.25rem',
		marginBottom: '8px',
	},
	message: {
		margin: 0,
		fontSize: '0.95rem',
	},
	list: {
		display: 'flex',
		flexDirection: 'column',
		gap: '10px',
	},
	geoError: {
		marginTop: 8,
		marginBottom: 4,
	},
	retryButton: {
		marginTop: 4,
		padding: '6px 10px',
		borderRadius: 999,
		border: 'none',
		backgroundColor: '#111827',
		color: '#f9fafb',
		fontSize: '0.8rem',
		cursor: 'pointer',
	},
};

export default HomePage;
