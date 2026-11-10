function sendSuccess(res, data = null, options = {}) {
  const { status = 200, message } = options;
  const body = {
    status: 'success',
    data,
  };
  if (message) body.message = message;
  return res.status(status).json(body);
}

module.exports = {
  sendSuccess,
};
