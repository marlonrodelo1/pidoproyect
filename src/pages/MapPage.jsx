import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getNearbyRestaurants } from '../ services/restaurantService';
import { getUserLocation } from '../utils/locationStorage';

const DEFAULT_CENTER = [40.4168, -3.7038];
const INITIAL_ZOOM = 17;

const createUserIcon = () => {
	return L.divIcon({
		className: 'user-marker-wrapper',
		html: '<div class="user-marker"></div>',
		iconSize: [18, 18],
		iconAnchor: [9, 9],
	});
};

const createRestaurantIcon = (logoUrl) => {
	const image = logoUrl || 'https://placehold.co/50x50?text=R';

	return L.divIcon({
		className: 'restaurant-marker-wrapper',
		html: `
			<div class="pulse-marker restaurant-marker-pulse"></div>
			<img class="restaurant-marker-logo" src="${image}" alt="Logo restaurante" />
		`,
		iconSize: [50, 50],
		iconAnchor: [25, 25],
		popupAnchor: [0, -25],
	});
};

const MapPage = ({ restaurants = [] }) => {
	const { state } = useLocation();
	const userLatitude = Number(state?.latitude);
	const userLongitude = Number(state?.longitude);
	const restaurantsFromState = state?.restaurants;
	const hasUserCoordinates = Number.isFinite(userLatitude) && Number.isFinite(userLongitude);
	const restaurantsList = Array.isArray(restaurantsFromState) ? restaurantsFromState : restaurants;
	const [displayRestaurants, setDisplayRestaurants] = useState(restaurantsList ?? []);

	const mapContainerRef = useRef(null);
	const mapRef = useRef(null);
	const userMarkerRef = useRef(null);
	const restaurantsLayerRef = useRef(null);
	const radiusCircleRef = useRef(null);

	useEffect(() => {
		if (!mapContainerRef.current || mapRef.current) {
			return;
		}

		try {
			const map = L.map(mapContainerRef.current, {
				zoomControl: false,
				attributionControl: false,
				scrollWheelZoom: true,
			}).setView(DEFAULT_CENTER, INITIAL_ZOOM);

			L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
				maxZoom: 19,
			}).addTo(map);

			restaurantsLayerRef.current = L.layerGroup().addTo(map);
			mapRef.current = map;

			const userCoordinates = hasUserCoordinates ? [userLatitude, userLongitude] : DEFAULT_CENTER;
			map.setView(userCoordinates, INITIAL_ZOOM);

			userMarkerRef.current = L.marker(userCoordinates, {
				icon: createUserIcon(),
			}).addTo(map);

			// Dibujar un cÃ­rculo de 15 km de radio alrededor de la ubicaciÃ³n del usuario
			try {
				const circle = L.circle(userCoordinates, {
					radius: 15000,
					color: '#2563eb',
					weight: 2,
					fillColor: '#2563eb',
					fillOpacity: 0.08,
				});
				circle.addTo(map);
				radiusCircleRef.current = circle;

				// Ajustamos el mapa para que se vea todo el radio de 15 km
				const circleBounds = circle.getBounds();
				if (circleBounds.isValid && circleBounds.isValid()) {
					map.fitBounds(circleBounds, { padding: [40, 40] });
				}
			} catch (circleError) {
				console.error('[MapPage] Error dibujando el circulo de radio:', circleError);
			}

			return () => {
				map.remove();
				mapRef.current = null;
				userMarkerRef.current = null;
				restaurantsLayerRef.current = null;
				radiusCircleRef.current = null;
			};
		} catch (error) {
			console.error('[MapPage] Error inicializando el mapa:', error);
		}
	}, [hasUserCoordinates, userLatitude, userLongitude]);

	// Cargar restaurantes cercanos si no vienen en el estado/navegación
	useEffect(() => {
		let isMounted = true;

		const loadNearby = async () => {
			let lat = userLatitude;
			let lng = userLongitude;

			if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
				const storedLocation = getUserLocation();
				if (storedLocation) {
					lat = storedLocation.latitude;
					lng = storedLocation.longitude;
				}
			}

			if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
				// Sin ubicación válida, usamos los restaurantes que vengan por props/estado como fallback.
				if (Array.isArray(restaurantsList) && restaurantsList.length > 0) {
					setDisplayRestaurants(restaurantsList);
				} else {
					setDisplayRestaurants([]);
				}
				return;
			}

			try {
				const nearby = await getNearbyRestaurants(lat, lng);
				if (!isMounted) return;
				if (Array.isArray(nearby) && nearby.length > 0) {
					// Mostramos restaurantes dentro del radio cercano al usuario.
					setDisplayRestaurants(nearby);
				} else if (Array.isArray(restaurantsList) && restaurantsList.length > 0) {
					// Si la RPC no devuelve nada, usamos los restaurantes recibidos como fallback.
					setDisplayRestaurants(restaurantsList);
				} else {
					setDisplayRestaurants([]);
				}
			} catch (error) {
				console.error('[MapPage] Error cargando restaurantes cercanos:', error);
				if (!isMounted) return;
				if (Array.isArray(restaurantsList) && restaurantsList.length > 0) {
					setDisplayRestaurants(restaurantsList);
				} else {
					setDisplayRestaurants([]);
				}
			}
		};

		loadNearby();

		return () => {
			isMounted = false;
		};
	}, [restaurantsList, userLatitude, userLongitude]);

	useEffect(() => {
		const map = mapRef.current;
		const restaurantsLayer = restaurantsLayerRef.current;

		if (!map || !restaurantsLayer) {
			return;
		}

		try {
			restaurantsLayer.clearLayers();

			const bounds = L.latLngBounds([]);

			displayRestaurants.forEach((restaurant) => {
				const latitude = Number(restaurant?.latitude);
				const longitude = Number(restaurant?.longitude);

				if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
					return;
				}

				const marker = L.marker([latitude, longitude], {
					icon: createRestaurantIcon(restaurant?.logo_image_url),
				});

				marker.bindPopup(restaurant?.name ?? 'Restaurante');
				marker.addTo(restaurantsLayer);
				bounds.extend([latitude, longitude]);
			});

			// Ajustar el mapa para que los restaurantes queden visibles al abrir la página
			if (!bounds.isEmpty()) {
				map.fitBounds(bounds, { padding: [40, 40] });
			}
		} catch (error) {
			console.error('[MapPage] Error pintando marcadores:', error);
		}
	}, [displayRestaurants]);

	return (
		<main style={styles.page}>
			<div ref={mapContainerRef} style={styles.map} />
			<style>{`
				.user-marker-wrapper {
					background: transparent;
					border: none;
				}

				.user-marker {
					width: 18px;
					height: 18px;
					border-radius: 50%;
					background: #2563eb;
					border: 3px solid #ffffff;
					box-shadow: 0 3px 10px rgba(37, 99, 235, 0.5);
				}

				.restaurant-marker-wrapper {
					background: transparent;
					border: none;
					position: relative;
				}

				.restaurant-marker-pulse {
					position: absolute;
					inset: 0;
					border-radius: 50%;
					background: rgba(16, 24, 40, 0.22);
					animation: mapMarkerPulse 1.6s ease-out infinite;
				}

				.restaurant-marker-logo {
					position: relative;
					width: 50px;
					height: 50px;
					border-radius: 50%;
					object-fit: cover;
					border: 2px solid #ffffff;
					box-shadow: 0 6px 14px rgba(0, 0, 0, 0.22);
					background: #ffffff;
				}

				@keyframes mapMarkerPulse {
					0% {
						transform: scale(1);
						opacity: 0.8;
					}
					70% {
						transform: scale(1.25);
						opacity: 0;
					}
					100% {
						transform: scale(1);
						opacity: 0;
					}
				}
			`}</style>
		</main>
	);
};

const styles = {
	page: {
		height: '100vh',
		width: '100%',
		paddingBottom: '92px',
		backgroundColor: '#0f172a',
	},
	map: {
		height: 'calc(100vh - 92px)',
		width: '100%',
	},
};

export default MapPage;
