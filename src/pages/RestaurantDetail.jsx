// Archivo eliminado por reestructuración. Página de detalle eliminada.
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Browser } from '@capacitor/browser';
import * as restaurantDetailService from '../ services/restaurantDetailService';
import PopupModal from '../components/PopupModal';
import GiftCardsModal from '../components/GiftCardsModal';
import '../styles/restaurantDetail.css';

const RestaurantDetail = () => {
	const navigate = useNavigate();
	const { state } = useLocation();
	const restaurant = state?.restaurant;
	const [error, setError] = useState('');
	const [isOpeningMenu, setIsOpeningMenu] = useState(false);
	const [isLoadingDetails, setIsLoadingDetails] = useState(false);
	const [popup, setPopup] = useState(null);
	const [showPopup, setShowPopup] = useState(false);
	const [showGiftModal, setShowGiftModal] = useState(false);
	const [promotions, setPromotions] = useState([]);
	const [giftCards, setGiftCards] = useState([]);

	useEffect(() => {
		if (!restaurant?.id) {
			setPopup(null);
			setShowPopup(false);
			setShowGiftModal(false);
			setPromotions([]);
			setGiftCards([]);
			setIsLoadingDetails(false);
			return;
		}

		let isMounted = true;

		const loadRestaurantDetails = async () => {
			setIsLoadingDetails(true);

			try {
				const [popupData, promotionsData, giftCardsData] = await Promise.all([
					restaurantDetailService.getRestaurantPopup(restaurant.id),
					restaurantDetailService.getRestaurantPromotions(restaurant.id),
					restaurantDetailService.getRestaurantGiftCards(restaurant.id),
				]);

				if (!isMounted) {
					return;
				}

				setPopup(popupData ?? null);
				if (popupData) {
					setShowPopup(true);
				} else {
					setShowPopup(false);
				}
				setPromotions(promotionsData ?? []);
				setGiftCards(giftCardsData ?? []);
			} catch (loadError) {
				if (!isMounted) {
					return;
				}

				setPopup(null);
				setShowPopup(false);
				setShowGiftModal(false);
				setPromotions([]);
				setGiftCards([]);
				setError(loadError?.message || 'No se pudo cargar el contenido del restaurante.');
			} finally {
				if (isMounted) {
					setIsLoadingDetails(false);
				}
			}
		};

		loadRestaurantDetails();

		return () => {
			isMounted = false;
		};
	}, [restaurant?.id]);

	const badges = useMemo(() => {
		if (!restaurant) {
			return [];
		}

		const isOpen = Boolean(restaurant.is_open);
		const hasDelivery = Boolean(restaurant.delivery_enabled ?? restaurant.has_delivery);
		const hasTakeaway = Boolean(restaurant.takeaway_enabled ?? restaurant.has_takeaway);

		return [
			{
				label: isOpen ? 'Abierto' : 'Cerrado',
				className: isOpen ? 'badge-open' : 'badge-closed',
			},
			{
				label: 'Delivery',
				className: `badge-delivery ${hasDelivery ? '' : 'badge-disabled'}`,
			},
			{
				label: 'Takeaway',
				className: `badge-takeaway ${hasTakeaway ? '' : 'badge-disabled'}`,
			},
		];
	}, [restaurant]);

	const hasMenuUrl = useMemo(() => {
		if (typeof restaurant?.menu_url !== 'string') {
			return false;
		}

		return restaurant.menu_url.trim().length > 0;
	}, [restaurant?.menu_url]);

	const handleOpenMenu = async () => {
		if (!hasMenuUrl) {
			return;
		}

		try {
			setError('');
			setIsOpeningMenu(true);
			await Browser.open({
				url: restaurant.menu_url.trim(),
				showToolbar: true,
			});
		} catch (openError) {
			setError(openError?.message || 'No se pudo abrir la carta.');
		} finally {
			setIsOpeningMenu(false);
		}
	};

	if (!restaurant) {
		return (
			<main style={styles.page}>
				<div className="page-enter">
					<section style={styles.card}>
						<h1 style={styles.title}>Detalle del restaurante</h1>
						<p style={styles.text}>No se encontró información del restaurante.</p>
						<button type="button" style={styles.secondaryButton} onClick={() => navigate(-1)}>
							Volver
						</button>
					</section>
				</div>
			</main>
		);
	}

	const bannerUrl = restaurant.banner_image_url;
	const logoUrl = restaurant.logo_image_url;
	const detailCategories = (Array.isArray(restaurant.restaurant_categories)
		? restaurant.restaurant_categories
		: [])
		.map((entry) => entry?.categories?.name)
		.filter(Boolean);

	return (
		<main style={styles.page}>
			<div className="page-enter">
				<section style={styles.card}>
					<div style={styles.mediaWrapper}>
						{bannerUrl ? (
							<img style={styles.banner} src={bannerUrl} alt={`Banner de ${restaurant.name ?? 'Restaurante'}`} />
						) : (
							<div style={styles.bannerFallback} />
						)}

						{logoUrl ? (
							<img style={styles.logo} src={logoUrl} alt={`Logo de ${restaurant.name ?? 'Restaurante'}`} />
						) : (
							<div style={styles.logoFallback} />
						)}
					</div>

					<div style={styles.content}>
						<h1 style={styles.title}>{restaurant.name ?? 'Restaurante'}</h1>
						{detailCategories.length > 0 && (
							<div style={styles.categoryTags}>
								{detailCategories.map((categoryName) => (
									<span key={categoryName} style={styles.categoryTag}>
										{categoryName}
									</span>
								))}
							</div>
						)}
						<p style={styles.text}>{restaurant.description ?? 'Sin descripción disponible.'}</p>

						<div style={styles.badges}>
							{badges.map((badge) => (
								<span key={badge.label} className={`badge ${badge.className}`}>
									{badge.label}
								</span>
							))}
							{restaurant.has_delivery_now === true ? (
								<span className="badge badge-delivery-now">Reparto ahora</span>
							) : null}
						</div>

						<button
							type="button"
							onClick={handleOpenMenu}
							disabled={isOpeningMenu || !hasMenuUrl}
							className={`restaurant-detail-menu-btn ${isOpeningMenu ? 'is-loading' : ''}`}
						>
							{isOpeningMenu ? 'Abriendo carta...' : 'Ver carta'}
						</button>

						{!hasMenuUrl && <p style={styles.info}>Este restaurante no tiene carta disponible.</p>}

						<button
							type="button"
							className="secondary-button"
							onClick={() => setShowGiftModal(true)}
						>
							🎁 Tarjetas de regalo
						</button>

						{!!error && <p style={styles.error}>{error}</p>}

						{isLoadingDetails && <p style={styles.info}>Cargando contenido...</p>}

						{promotions.length > 0 && (
							<section style={styles.blockSection}>
								<h2 style={styles.sectionTitle}>Promociones</h2>
								<div style={styles.verticalList}>
									{promotions.map((promotion) => {
										const promotionImage =
											promotion.image_url ?? promotion.banner_image_url ?? promotion.logo_image_url;

										return (
											<article key={promotion.id ?? promotion.title} style={styles.listItemCard}>
												{promotionImage ? (
													<img
														style={styles.listItemImage}
														src={promotionImage}
														alt={promotion.title ?? 'Promoción'}
													/>
												) : null}
												<p style={styles.listItemTitle}>{promotion.title ?? 'Promoción'}</p>
											</article>
										);
									})}
								</div>
							</section>
						)}

					</div>
				</section>

				{showPopup && (
					<PopupModal
						popup={popup}
						onClose={() => setShowPopup(false)}
					/>
				)}

				{showGiftModal && (
					<GiftCardsModal
						giftCards={giftCards}
						onClose={() => setShowGiftModal(false)}
					/>
				)}
			</div>
		</main>
	);
};

const styles = {
	page: {
		minHeight: '100vh',
		padding: '16px 16px 24px',
		display: 'flex',
		justifyContent: 'center',
	},
	card: {
		width: '100%',
		maxWidth: '420px',
		display: 'flex',
		flexDirection: 'column',
		gap: '16px',
		backgroundColor: '#ffffff',
		borderRadius: '16px',
		overflow: 'hidden',
		boxShadow: '0 10px 24px rgba(15, 23, 42, 0.12)',
	},
	mediaWrapper: {
		position: 'relative',
	},
	banner: {
		width: '100%',
		height: '200px',
		objectFit: 'cover',
		display: 'block',
	},
	bannerFallback: {
		width: '100%',
		height: '200px',
		background: 'linear-gradient(135deg, #eceff3, #dfe3e8)',
	},
	logo: {
		width: '88px',
		height: '88px',
		borderRadius: '50%',
		border: '3px solid #ffffff',
		objectFit: 'cover',
		position: 'absolute',
		left: '50%',
		bottom: '-44px',
		transform: 'translateX(-50%)',
		backgroundColor: '#ffffff',
		boxShadow: '0 6px 14px rgba(15, 23, 42, 0.18)',
	},
	logoFallback: {
		width: '88px',
		height: '88px',
		borderRadius: '50%',
		border: '3px solid #ffffff',
		position: 'absolute',
		left: '50%',
		bottom: '-44px',
		transform: 'translateX(-50%)',
		background: '#eceff3',
		boxShadow: '0 6px 14px rgba(15, 23, 42, 0.18)',
	},
	content: {
		padding: '56px 16px 16px',
		display: 'flex',
		flexDirection: 'column',
		gap: '12px',
	},
	title: {
		margin: 0,
		fontSize: '1.35rem',
		textAlign: 'center',
	},
	text: {
		margin: 0,
		fontSize: '0.95rem',
		lineHeight: 1.45,
		textAlign: 'center',
	},
	categoryTags: {
		display: 'flex',
		flexWrap: 'wrap',
		justifyContent: 'center',
		gap: '8px',
	},
	categoryTag: {
		fontSize: '0.75rem',
		lineHeight: 1,
		padding: '6px 10px',
		borderRadius: '999px',
		backgroundColor: '#f2f4f7',
		color: '#344054',
		whiteSpace: 'nowrap',
	},
	badges: {
		display: 'flex',
		gap: '10px',
		flexWrap: 'wrap',
		justifyContent: 'center',
	},
	primaryButton: {
		height: '52px',
		borderRadius: '12px',
		border: 'none',
		backgroundColor: '#101828',
		color: '#ffffff',
		fontSize: '1rem',
		fontWeight: 600,
	},
	secondaryButton: {
		height: '44px',
		borderRadius: '10px',
		border: '1px solid #d0d5dd',
		backgroundColor: 'transparent',
		fontSize: '0.95rem',
		fontWeight: 600,
	},
	error: {
		margin: 0,
		fontSize: '0.9rem',
		textAlign: 'center',
		color: '#b42318',
	},
	info: {
		margin: 0,
		fontSize: '0.9rem',
		textAlign: 'center',
		color: '#475467',
	},
	blockSection: {
		display: 'flex',
		flexDirection: 'column',
		gap: '10px',
		marginTop: '4px',
		paddingTop: '8px',
		borderTop: '1px solid #eaecf0',
	},
	sectionTitle: {
		margin: 0,
		fontSize: '1.05rem',
		fontWeight: 600,
	},
	sectionText: {
		margin: 0,
		fontSize: '0.9rem',
		lineHeight: 1.4,
		color: '#344054',
	},
	blockImageLarge: {
		width: '100%',
		height: '160px',
		objectFit: 'cover',
		borderRadius: '12px',
	},
	verticalList: {
		display: 'flex',
		flexDirection: 'column',
		gap: '10px',
	},
	listItemCard: {
		display: 'flex',
		flexDirection: 'column',
		gap: '8px',
		padding: '10px',
		borderRadius: '12px',
		backgroundColor: '#f8fafc',
	},
	listItemImage: {
		width: '100%',
		height: '120px',
		objectFit: 'cover',
		borderRadius: '10px',
	},
	listItemTitle: {
		margin: 0,
		fontSize: '0.92rem',
		fontWeight: 600,
		color: '#101828',
	},
};

export default RestaurantDetail;
