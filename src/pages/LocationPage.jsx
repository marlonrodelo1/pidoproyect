import { useCallback, useEffect, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
import { Link, useNavigate } from 'react-router-dom';
import { saveUserLocation } from '../utils/locationStorage';
import canaryImage from '../../resources/canary.png';
import '../styles/location.css';

const LocationPage = () => {
	const navigate = useNavigate();
	const [error, setError] = useState('');
	const isMountedRef = useRef(true);

	const requestLocation = useCallback(
		async () => {
			setError('');

			try {
				let position;
				const isNative = Capacitor.isNativePlatform();

				if (isNative) {
					const permissionResult = await Geolocation.requestPermissions();
					const hasPermission =
						permissionResult.location === 'granted' ||
						permissionResult.coarseLocation === 'granted';

					if (!hasPermission) {
						throw new Error('Necesitamos tu ubicación para mostrar restaurantes cerca de ti.');
					}

					position = await Geolocation.getCurrentPosition({
						enableHighAccuracy: true,
						timeout: 5000,
						maximumAge: 0,
					});
				} else {
					if (typeof window === 'undefined' || !('geolocation' in navigator)) {
						throw new Error('La geolocalización no está disponible en este dispositivo.');
					}

					position = await new Promise((resolve, reject) => {
						navigator.geolocation.getCurrentPosition(
							resolve,
							reject,
							{
								enableHighAccuracy: true,
								timeout: 5000,
								maximumAge: 0,
							},
						);
					});
				}

				if (!isMountedRef.current) {
					return;
				}

				const lat = position.coords.latitude;
				const lng = position.coords.longitude;
				saveUserLocation(lat, lng);
			} catch (geolocationError) {
				if (!isMountedRef.current) {
					return;
				}

				console.error('[LocationPage] Geolocation error:', geolocationError);
				setError(
					geolocationError?.message ||
						'No hemos podido obtener tu ubicación. Puedes activarla más tarde en los ajustes.',
				);
			}
		},
		[],
	);

	useEffect(() => {
		// Pedimos la ubicación en segundo plano al entrar en la app,
		// solo para guardar la posición del usuario.
		requestLocation();

		return () => {
			isMountedRef.current = false;
		};
	}, [requestLocation]);

	const handleSelectBusinessType = (type) => {
		navigate('/home', { state: { businessType: type } });
	};

	return (
		<main className="location-screen location-page">
			<div className="location-screen-gradient" />
			<div className="location-map-layer" aria-hidden="true">
				<span className="map-blob blob-a" />
				<span className="map-blob blob-b" />
				<span className="map-blob blob-c" />
				<span className="map-grid" />
			</div>

			<section className="location-screen-content" aria-live="polite">
				<div className="business-hero-wrapper">
					<img src={canaryImage} alt="Canarias" className="business-hero" />
				</div>
				<div className="business-card">
					<h1 className="business-title">Tipos de negocio</h1>

					<div className="business-grid" role="list">
						<button
							type="button"
							className="business-item business-item-main"
							role="listitem"
							onClick={() => handleSelectBusinessType('food')}
						>
							<span className="business-icon">🍔</span>
							<span className="business-label">Comida</span>
						</button>
						<button
							type="button"
							className="business-item"
							role="listitem"
							onClick={() => handleSelectBusinessType('supermarket')}
						>
							<span className="business-icon">🛒</span>
							<span className="business-label">Supermercados</span>
						</button>
						<button
							type="button"
							className="business-item"
							role="listitem"
							onClick={() => handleSelectBusinessType('pharmacy')}
						>
							<span className="business-icon">💊</span>
							<span className="business-label">Farmacias y belleza</span>
						</button>
						<button
							type="button"
							className="business-item"
							role="listitem"
							onClick={() => handleSelectBusinessType('store')}
						>
							<span className="business-icon">🛍️</span>
							<span className="business-label">Tiendas</span>
						</button>
					</div>

					{!!error && <p className="location-error-text business-error">{error}</p>}

					<p className="privacy-text">
						Al continuar aceptas nuestra{' '}
						<Link to="/privacy-policy">Política de privacidad</Link>.
					</p>
				</div>
			</section>
		</main>
	);
};

export default LocationPage;
