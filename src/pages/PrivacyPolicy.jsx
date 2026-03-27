import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/global.css';
import { getLatestPrivacyPolicy } from '../ services/privacyPolicyService';

const PrivacyPolicy = () => {
	const [policy, setPolicy] = useState(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState('');
	const navigate = useNavigate();

	useEffect(() => {
		let isMounted = true;

		const loadPolicy = async () => {
			setIsLoading(true);
			setError('');
			try {
				const data = await getLatestPrivacyPolicy();
				if (!isMounted) return;
				setPolicy(data);
			} catch (err) {
				console.error('[PrivacyPolicy] Error loading policy:', err);
				if (!isMounted) return;
				setError('No se pudo cargar la política de privacidad.');
			} finally {
				if (isMounted) {
					setIsLoading(false);
				}
			}
		};

		loadPolicy();

		return () => {
			isMounted = false;
		};
	}, []);

	const title = policy?.title || 'Política de privacidad';
	const content = policy?.content || '';

	return (
		<main className="page privacy-page">
			<section className="page-content">
				<h1>{title}</h1>
				{isLoading && <p>Cargando pol&iacute;tica de privacidad...</p>}
				{!isLoading && error && <p>{error}</p>}
				{!isLoading && !error && content && (
					<pre className="privacy-content">
						{content}
					</pre>
				)}
				{!isLoading && !error && !content && (
					<p>No hay pol&iacute;tica de privacidad disponible por el momento.</p>
				)}
			</section>
			<button
				type="button"
				className="privacy-bottom-button"
				onClick={() => navigate('/')}
			>
				Volver
			</button>
		</main>
	);
};

export default PrivacyPolicy;
