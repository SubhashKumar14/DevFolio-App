export function unwrapApiData(response) {
  if (response && typeof response === 'object' && !Array.isArray(response)) {
    if (Object.prototype.hasOwnProperty.call(response, 'data')) {
      return response.data;
    }
  }

  return response;
}