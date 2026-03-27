import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';

const RestaurantCard = ({ restaurant }) => {
	const categoryNames = restaurant.restaurant_categories
		?.map((rc) => rc?.categories?.name)
		.filter(Boolean)
		.slice(0, 2)
		.join(' • ');

	const handleOpenMenu = async () => {
		if (!restaurant?.menu_url) return;

		// En apps nativas, abrir dentro de la app con Capacitor Browser
		if (Capacitor.isNativePlatform()) {
			try {
				await Browser.open({ url: restaurant.menu_url });
			} catch (error) {
				console.error('Error abriendo URL en Browser:', error);
			}
			return;
		}

		// En web, seguir usando window.open en una nueva pestaña
		window.open(restaurant.menu_url, '_blank', 'noopener,noreferrer');
	};

	return (
		<article
			className="restaurant-card card-clickable"
			onClick={handleOpenMenu}
			role="button"
			tabIndex={0}
			onKeyDown={(event) => {
				if (event.key === 'Enter' || event.key === ' ') {
					event.preventDefault();
					handleOpenMenu();
				}
			}}
		>
			<div className="banner-container">
				<img
					src={restaurant.banner_image_url || '/placeholder.jpg'}
					alt="Banner del restaurante"
					className="banner-image"
				/>

				<div className="badges-overlay">
					{restaurant.is_open && (
						<span className="badge badge-open">Abierto</span>
					)}
					{restaurant.accepts_delivery && (
						<span className="badge badge-delivery">Delivery</span>
					)}
					{restaurant.accepts_takeaway && (
						<span className="badge badge-takeaway">Takeaway</span>
					)}
				</div>

				<img
					src={restaurant.logo_image_url || '/placeholder-logo.png'}
					className="restaurant-logo"
					alt={`Logo de ${restaurant.name}`}
				/>
			</div>

			<div className="glass-info">
				<div className="info-row">
					<div>
						<h3 className="restaurant-title">{restaurant.name}</h3>
						{typeof restaurant.distanceKm === 'number' && (
							<div className="distance">
								📍 {restaurant.distanceKm.toFixed(1)} km
							</div>
						)}
					</div>

					<div className="categories">
						{categoryNames}
					</div>
				</div>
			</div>
		</article>
	);
};

export default RestaurantCard;
