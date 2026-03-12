import '../styles/featuredSlider.css';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';

const FeaturedSlider = ({ featuredRestaurants = [] }) => {
	if (!Array.isArray(featuredRestaurants) || featuredRestaurants.length === 0) {
		return null;
	}

	const handleOpenMenu = async (restaurant) => {
		const menuUrl = restaurant?.menu_url;
		if (!menuUrl) return;

		if (Capacitor.isNativePlatform()) {
			try {
				await Browser.open({ url: menuUrl });
			} catch (error) {
				console.error('Error abriendo URL destacada en Browser:', error);
			}
			return;
		}

		window.open(menuUrl, '_blank', 'noopener,noreferrer');
	};

	return (
		<section className="featured-section" aria-label="Restaurantes destacados">
			<h2 className="featured-title">Destacados</h2>

			<div className="featured-slider" role="list">
				{featuredRestaurants.map((restaurant) => {
					const isOpen = Boolean(restaurant?.is_open);
					const hasDelivery = Boolean(
						restaurant?.accepts_delivery ?? restaurant?.delivery_enabled ?? restaurant?.has_delivery
					);
					const hasTakeaway = Boolean(
						restaurant?.accepts_takeaway ?? restaurant?.takeaway_enabled ?? restaurant?.has_takeaway
					);

					return (
						<article
							key={restaurant?.id ?? restaurant?.name}
							className="featured-card"
							role="button"
							tabIndex={0}
							onClick={() => handleOpenMenu(restaurant)}
							onKeyDown={(event) => {
								if (event.key === 'Enter' || event.key === ' ') {
									event.preventDefault();
									handleOpenMenu(restaurant);
								}
							}}
						>
							<div className="featured-media">
								<img
									className="featured-banner"
									src={restaurant?.banner_image_url || '/placeholder.jpg'}
									alt={`Banner de ${restaurant?.name ?? 'Restaurante'}`}
								/>

								<img
									className="featured-logo"
									src={restaurant?.logo_image_url || '/placeholder-logo.png'}
									alt={`Logo de ${restaurant?.name ?? 'Restaurante'}`}
								/>
							</div>

							<div className="featured-badges-row">
								<span className={`featured-badge ${isOpen ? 'is-open' : 'is-muted'}`}>Abierto</span>
								<span className={`featured-badge ${hasDelivery ? 'is-delivery' : 'is-muted'}`}>Delivery</span>
								<span className={`featured-badge ${hasTakeaway ? 'is-takeaway' : 'is-muted'}`}>Takeaway</span>
							</div>
						</article>
					);
				})}
			</div>
		</section>
	);
};

export default FeaturedSlider;
