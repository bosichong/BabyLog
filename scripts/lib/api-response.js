function unwrapResponse(body) {
  if (
    body &&
    typeof body === 'object' &&
    !Array.isArray(body) &&
    body.status === 'success' &&
    Object.prototype.hasOwnProperty.call(body, 'data')
  ) {
    return body.data;
  }
  return body;
}

module.exports = {
  unwrapResponse,
};
