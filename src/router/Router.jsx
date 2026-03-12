import {
	HashRouter,
	Navigate,
	Route,
	Routes,
	useLocation,
} from 'react-router-dom';
import HomePage from '../pages/HomePage';
import LocationPage from '../pages/LocationPage';
import MapPage from '../pages/MapPage';
import NotificationsPage from '../pages/NotificationsPage';
import GiftCardsPage from '../pages/GiftCardsPage';
import PrivacyPolicy from '../pages/PrivacyPolicy';

import BottomNav from '../components/BottomNav';

const AppRoutes = () => {
	const location = useLocation();
	const hideBottomNav = location.pathname === '/' || location.pathname === '/privacy-policy';

	return (
		<>
			<Routes>
				<Route path="/" element={<LocationPage />} />
				<Route path="/home" element={<HomePage />} />
				<Route path="/map" element={<MapPage />} />
				<Route path="/notifications" element={<NotificationsPage />} />
				<Route path="/gift-cards" element={<GiftCardsPage />} />
				<Route path="/privacy-policy" element={<PrivacyPolicy />} />
				<Route path="*" element={<Navigate to="/" replace />} />
			</Routes>
			{!hideBottomNav && <BottomNav />}
		</>
	);
};

const Router = () => {
	return (
		<HashRouter>
			<AppRoutes />
		</HashRouter>
	);
};

export default Router;
