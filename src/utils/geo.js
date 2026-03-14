// Calculate distance between two points using Haversine formula
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km
  return distance;
};

const deg2rad = (deg) => {
  return deg * (Math.PI / 180);
};

export const findNearestCenter = (userLat, userLng, centers) => {
  if (!centers || centers.length === 0) return null;

  let nearestCenter = centers[0];
  let minDistance = calculateDistance(userLat, userLng, nearestCenter.location.lat, nearestCenter.location.lng);

  for (let i = 1; i < centers.length; i++) {
    const dist = calculateDistance(userLat, userLng, centers[i].location.lat, centers[i].location.lng);
    if (dist < minDistance) {
      minDistance = dist;
      nearestCenter = centers[i];
    }
  }

  return { nearestCenter, distance: minDistance };
};
