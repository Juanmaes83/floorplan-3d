// External links using the official Google Maps URL contract. Constructing a URL performs no request.
export function googleContextLinks([longitude, latitude]) {
  if (!Number.isFinite(longitude) || Math.abs(longitude) > 180 ||
      !Number.isFinite(latitude) || Math.abs(latitude) > 90) throw new RangeError('Invalid parcel coordinates');
  const point = latitude.toFixed(6) + ',' + longitude.toFixed(6);
  const url = (path, parameters) =>
    'https://www.google.com/maps/' + path + '?' + new URLSearchParams({ api: '1', ...parameters });
  return {
    map: url('search/', { query: point }),
    directions: url('dir/', { destination: point }),
    street: url('@', { map_action: 'pano', viewpoint: point })
  };
}
