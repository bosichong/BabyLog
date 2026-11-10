const { getErrorReason } = require('./error-reason');

/**
 * 统一返回失败原因，并确保终端日志包含请求、失败动作和原始原因。
 */
function sendError(req, res, status, message, error, details = {}) {
  const reason = getErrorReason(error);
  const requestLabel = req ? `${req.method} ${req.originalUrl || req.url || ''}` : '未知请求';

  if (reason) {
    console.error(`[API][失败] ${requestLabel} | ${message} | 原因: ${reason}`);
    res.locals.errorReason = reason;
    res.locals.errorLogged = true;
  }

  const body = {
    status: 'error',
    message,
    ...details,
  };
  if (reason) body.reason = reason;

  return res.status(status).json(body);
}

module.exports = {
  sendError,
};
