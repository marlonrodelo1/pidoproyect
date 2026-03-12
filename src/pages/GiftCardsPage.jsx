import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { getMarketplaceGiftCards } from '../ services/giftCardsService';

const GiftCardsPage = () => {
	const [giftCards, setGiftCards] = useState([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState('');

	useEffect(() => {
		let isMounted = true;

		const loadGiftCards = async () => {
			setIsLoading(true);
			setError('');
			try {
				const data = await getMarketplaceGiftCards();
				if (!isMounted) return;
				const next = data ?? [];
				if (import.meta.env.DEV) {
					console.log('[GiftCardsPage] Gift cards received in page:', next);
				}
				setGiftCards(next);
			} catch (err) {
				console.error('[GiftCardsPage] Error loading gift cards:', err);
				if (!isMounted) return;
				setError('No se pudieron cargar las tarjetas de regalo.');
			} finally {
				if (isMounted) {
					setIsLoading(false);
				}
			}
		};

		loadGiftCards();

		return () => {
			isMounted = false;
		};
	}, []);

	const handleOpenUrl = async (url) => {
		if (!url) return;

		if (Capacitor.isNativePlatform()) {
			try {
				await Browser.open({ url });
			} catch (err) {
				console.error('[GiftCardsPage] Error abriendo URL en Browser:', err);
			}
			return;
		}

		window.open(url, '_blank', 'noopener,noreferrer');
	};

	return (
		<main style={styles.page}>
			<section style={styles.card}>
				<h1 style={styles.title}>Tarjetas de regalo</h1>

				{isLoading && <p style={styles.message}>Cargando tarjetas de regalo...</p>}
				{!isLoading && error && <p style={styles.message}>{error}</p>}

				{!isLoading && !error && giftCards.length === 0 && (
					<p style={styles.message}>Todav&iacute;a no hay tarjetas de regalo disponibles.</p>
				)}

				{!isLoading && !error && giftCards.length > 0 && (
					<div style={styles.list}>
						{giftCards.map((card) => {
							const relations = Array.isArray(card.app_market_gift_cards_restaurants)
								? card.app_market_gift_cards_restaurants
								: [];
							const restaurants = relations
								.map((rel) => rel.restaurant)
								.filter(Boolean);
							const firstRestaurant = restaurants[0] ?? null;
								// Imagen principal: la imagen de la tarjeta de regalo.
								// Si no hay, usamos el logo del primer restaurante y por último un placeholder.
								const mainImage = card.image_url || firstRestaurant?.logo_image_url || '/placeholder-logo.png';
							const title = card.business_name || firstRestaurant?.name || 'Tarjeta de regalo';
							const count = restaurants.length;

							return (
								<details
									key={card.id}
									style={styles.item}
								>
									<summary style={styles.summary}>
										<div style={styles.imageWrapper}>
											<img
												src={mainImage}
												alt={title}
												style={styles.image}
											/>
										</div>
										<div style={styles.info}>
											<h2 style={styles.businessName}>{title}</h2>
											<p style={styles.countText}>
												{count === 0
													? 'Sin restaurantes asociados todavía'
													: `${count} restaurante${count > 1 ? 's' : ''} con esta tarjeta`}
											</p>
										</div>
									</summary>

									{count > 0 && (
										<div style={styles.dropdownContent}>
												{restaurants.map((restaurant) => (
													<div key={restaurant.id} style={styles.restaurantRow}>
														{restaurant.logo_image_url && (
															<img
																src={restaurant.logo_image_url}
																alt={restaurant.name}
																style={styles.restaurantLogo}
															/>
														)}
														<span style={styles.dropdownText}>{restaurant.name}</span>
													</div>
												))}
											{card.business_url && (
												<button
													type="button"
													style={styles.button}
													onClick={() => handleOpenUrl(card.business_url)}
												>
													Ver negocio
												</button>
											)}
										</div>
									)}
								</details>
							);
						})}
					</div>
				)}
			</section>
		</main>
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
		padding: '0 16px 90px',
		boxSizing: 'border-box',
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
	item: {
		backgroundColor: '#111827',
		borderRadius: '16px',
		padding: '10px',
		border: 'none',
	},
	summary: {
		display: 'flex',
		alignItems: 'center',
		gap: '12px',
		listStyle: 'none',
		cursor: 'pointer',
	},
	imageWrapper: {
		width: '80px',
		height: '80px',
		borderRadius: '12px',
		overflow: 'hidden',
		flexShrink: 0,
	},
	image: {
		width: '100%',
		height: '100%',
		objectFit: 'cover',
	},
	info: {
		flex: 1,
		display: 'flex',
		flexDirection: 'column',
		gap: '6px',
	},
	countText: {
		margin: 0,
		fontSize: '0.85rem',
		color: '#e5e7eb',
	},
	businessName: {
		margin: 0,
		fontSize: '1rem',
		fontWeight: 600,
		color: '#f9fafb',
	},
	dropdownContent: {
		marginTop: 8,
		paddingTop: 8,
		borderTop: '1px solid rgba(148, 163, 184, 0.4)',
	},
	dropdownText: {
			margin: 0,
			fontSize: '0.85rem',
			color: '#e5e7eb',
	},
		restaurantRow: {
			display: 'flex',
			alignItems: 'center',
			gap: 8,
			marginBottom: 8,
		},
		restaurantLogo: {
			width: 24,
			height: 24,
			borderRadius: '999px',
			objectFit: 'cover',
			flexShrink: 0,
		},
	button: {
		alignSelf: 'flex-start',
		padding: '6px 12px',
		borderRadius: '999px',
		border: 'none',
		backgroundColor: '#f97316',
		color: '#ffffff',
		fontSize: '0.85rem',
		fontWeight: 600,
		cursor: 'pointer',
	},
};

export default GiftCardsPage;
