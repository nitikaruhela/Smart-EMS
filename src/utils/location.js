export function haversineDistanceKm(start, end) {
  const startLatitude = Number.parseFloat(start?.latitude);
  const startLongitude = Number.parseFloat(start?.longitude);
  const endLatitude = Number.parseFloat(end?.latitude);
  const endLongitude = Number.parseFloat(end?.longitude);

  if (
    !Number.isFinite(startLatitude) ||
    !Number.isFinite(startLongitude) ||
    !Number.isFinite(endLatitude) ||
    !Number.isFinite(endLongitude)
  ) {
    return null;
  }

  const earthRadiusKm = 6371;
  const latitudeDelta = toRadians(endLatitude - startLatitude);
  const longitudeDelta = toRadians(endLongitude - startLongitude);
  const normalizedStartLatitude = toRadians(startLatitude);
  const normalizedEndLatitude = toRadians(endLatitude);

  const haversine =
    Math.sin(latitudeDelta / 2) * Math.sin(latitudeDelta / 2) +
    Math.cos(normalizedStartLatitude) *
      Math.cos(normalizedEndLatitude) *
      Math.sin(longitudeDelta / 2) *
      Math.sin(longitudeDelta / 2);

  const angularDistance =
    2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));

  return earthRadiusKm * angularDistance;
}

function toRadians(value) {
  return (value * Math.PI) / 180;
}
