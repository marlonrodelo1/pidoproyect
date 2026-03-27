import { useEffect, useState } from 'react';

const PopupModal = ({ popup, onClose }) => {
	const [isVisible, setIsVisible] = useState(false);

	useEffect(() => {
		const frameId = requestAnimationFrame(() => setIsVisible(true));

		return () => {
			cancelAnimationFrame(frameId);
		};
	}, []);

	if (!popup) {
		return null;
	}

	const handleBackdropClick = (event) => {
		if (event.target === event.currentTarget) {
			onClose?.();
		}
	};

	return (
		<div
			style={{
				...styles.overlay,
				opacity: isVisible ? 1 : 0,
			}}
			onClick={handleBackdropClick}
			role="presentation"
		>
			<div
				style={{
					...styles.modal,
					opacity: isVisible ? 1 : 0,
					transform: isVisible ? 'scale(1)' : 'scale(0.96)',
				}}
				role="dialog"
				aria-modal="true"
				aria-label={popup.title ?? 'Popup'}
			>
				{popup.image_url ? (
					<img
						style={styles.image}
						src={popup.image_url}
						alt={popup.title ?? 'Imagen del popup'}
					/>
				) : null}

				<div style={styles.content}>
					<h2 style={styles.title}>{popup.title ?? 'Novedades'}</h2>
					<p style={styles.description}>{popup.description ?? ''}</p>

					<button type="button" onClick={onClose} style={styles.button}>
						Cerrar
					</button>
				</div>
			</div>
		</div>
	);
};

const styles = {
	overlay: {
		position: 'fixed',
		inset: 0,
		padding: '16px',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: 'rgba(0, 0, 0, 0.6)',
		zIndex: 1000,
		transition: 'opacity 180ms ease',
	},
	modal: {
		width: '100%',
		maxWidth: '420px',
		backgroundColor: '#ffffff',
		borderRadius: '16px',
		overflow: 'hidden',
		boxShadow: '0 16px 40px rgba(0, 0, 0, 0.18)',
		transition: 'opacity 180ms ease, transform 180ms ease',
	},
	image: {
		width: '100%',
		height: '200px',
		objectFit: 'cover',
		display: 'block',
	},
	content: {
		padding: '16px',
		display: 'flex',
		flexDirection: 'column',
		gap: '10px',
	},
	title: {
		margin: 0,
		fontSize: '1.15rem',
		fontWeight: 600,
	},
	description: {
		margin: 0,
		fontSize: '0.95rem',
		lineHeight: 1.45,
		color: '#344054',
	},
	button: {
		width: '100%',
		height: '46px',
		border: 'none',
		borderRadius: '12px',
		backgroundColor: '#111827',
		color: '#ffffff',
		fontSize: '1rem',
		fontWeight: 600,
		cursor: 'pointer',
		marginTop: '4px',
	},
};

// Archivo eliminado por reestructuración. PopupModal eliminado.

