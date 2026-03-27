import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import LocationOnRoundedIcon from '@mui/icons-material/LocationOnRounded';
import CardGiftcardRoundedIcon from '@mui/icons-material/CardGiftcardRounded';
import NotificationsRoundedIcon from '@mui/icons-material/NotificationsRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getActiveRestaurants } from '../ services/restaurantService';
import { getUserLocation } from '../utils/locationStorage';
import { getUnreadCount, subscribeToNotifications } from '../services/notificationService';

const BottomNav = ({ latitude = null, longitude = null, restaurants = [] }) => {
	const navigate = useNavigate();
	const { state } = useLocation();
	const storedLocation = getUserLocation();

	const restaurantsPayload = Array.isArray(restaurants) && restaurants.length > 0
		? restaurants
		: Array.isArray(state?.restaurants)
			? state.restaurants
			: [];

	const latitudePayload = latitude ?? state?.latitude ?? storedLocation?.latitude ?? null;
	const longitudePayload = longitude ?? state?.longitude ?? storedLocation?.longitude ?? null;
	const [unreadCount, setUnreadCount] = useState(0);
	const [searchValue, setSearchValue] = useState('');

	const handleSearchChange = (event) => {
		const value = event.target.value;
		setSearchValue(value);

		if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
			try {
				window.dispatchEvent(new CustomEvent('pidoo:search', { detail: value }));
			} catch (error) {
				console.error('[BottomNav] Error enviando evento de búsqueda:', error);
			}
		}
	};

	const handleGoToMap = async () => {
		let mapRestaurants = restaurantsPayload;

		if (!Array.isArray(mapRestaurants) || mapRestaurants.length === 0) {
			try {
				mapRestaurants = await getActiveRestaurants();
			} catch {
				mapRestaurants = [];
			}
		}

		navigate('/map', {
			state: {
				latitude: latitudePayload,
				longitude: longitudePayload,
				restaurants: mapRestaurants,
			},
		});
	};

	const handleGoToHome = () => {
		navigate('/home');
	};

	const handleGoToGiftCards = () => {
		navigate('/gift-cards');
	};

	const handleGoToNotifications = () => {
		navigate('/notifications');
	};

	useEffect(() => {
		let isMounted = true;
		const init = async () => {
			const count = await getUnreadCount();
			if (!isMounted) return;
			setUnreadCount(count);
		};

		init();

		const unsubscribe = subscribeToNotifications(async (payload) => {
			if (!payload) return;

			if (payload.eventType === 'INSERT') {
				const newNotification = payload.new;
				if (!newNotification?.is_read) {
					setUnreadCount((prev) => prev + 1);
				}
			} else if (payload.eventType === 'UPDATE') {
				const count = await getUnreadCount();
				if (!isMounted) return;
				setUnreadCount(count);
			}
		});

		return () => {
			isMounted = false;
			if (typeof unsubscribe === 'function') {
				unsubscribe();
			}
		};
	}, []);

	return (
		<div className="bottom-nav-wrapper">
			<div className="bottom-nav">
				<div className="bottom-nav-group">
					<button type="button" className="bottom-nav-btn" aria-label="Inicio" onClick={handleGoToHome}>
						<HomeRoundedIcon sx={{ fontSize: 24 }} />
					</button>

					<button
						type="button"
						className="bottom-nav-btn"
						aria-label="Ubicación"
						onClick={handleGoToMap}
					>
						<LocationOnRoundedIcon sx={{ fontSize: 24 }} />
					</button>
				</div>

				<div className="bottom-nav-search" role="search">
					<SearchRoundedIcon sx={{ fontSize: 20 }} />
					<input
						type="text"
						placeholder="Buscar restaurante o categoría"
						aria-label="Buscar restaurante o categoría"
						inputMode="search"
						autoCorrect="off"
						autoCapitalize="none"
						value={searchValue}
						onChange={handleSearchChange}
					/>
				</div>

				<div className="bottom-nav-group">
					<button
						type="button"
						className="bottom-nav-btn"
						aria-label="Tarjetas de regalo"
						onClick={handleGoToGiftCards}
					>
						<CardGiftcardRoundedIcon sx={{ fontSize: 24 }} />
					</button>

					<button
						type="button"
						className="bottom-nav-btn bottom-nav-btn--notifications"
						aria-label="Notificaciones"
						onClick={handleGoToNotifications}
					>
						<NotificationsRoundedIcon sx={{ fontSize: 24 }} />
						{unreadCount > 0 && (
							<span className="bottom-nav-badge">{unreadCount}</span>
						)}
					</button>
				</div>
			</div>
		</div>
	);
};

export default BottomNav;
