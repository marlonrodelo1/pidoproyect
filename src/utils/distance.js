const toRadians = (degrees) => (degrees * Math.PI) / 180;

export const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
	const values = [lat1, lon1, lat2, lon2];

	if (values.some((value) => value === null || value === undefined)) {
		return 0;
	}

	const [numLat1, numLon1, numLat2, numLon2] = values.map(Number);

	if ([numLat1, numLon1, numLat2, numLon2].some((value) => Number.isNaN(value))) {
		return 0;
	}

	const earthRadiusKm = 6371;
	const deltaLat = toRadians(numLat2 - numLat1);
	const deltaLon = toRadians(numLon2 - numLon1);

	const a =
		Math.sin(deltaLat / 2) ** 2 +
		Math.cos(toRadians(numLat1)) *
			Math.cos(toRadians(numLat2)) *
			Math.sin(deltaLon / 2) ** 2;

	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	const distance = earthRadiusKm * c;

	return Number(distance.toFixed(2));
};
