const USER_LOCATION_KEY = 'pidoo_user_location';

export const saveUserLocation = (latitude, longitude) => {
	if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
		return;
	}

	const payload = JSON.stringify({ latitude, longitude });
	localStorage.setItem(USER_LOCATION_KEY, payload);
};

export const getUserLocation = () => {
	const rawValue = localStorage.getItem(USER_LOCATION_KEY);

	if (!rawValue) {
		return null;
	}

	try {
		const parsedValue = JSON.parse(rawValue);
		const latitude = Number(parsedValue?.latitude);
		const longitude = Number(parsedValue?.longitude);

		if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
			return null;
		}

		return { latitude, longitude };
	} catch {
		return null;
	}
};
