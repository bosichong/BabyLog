/**
 * 提取适合终端日志和接口返回的失败原因，避免只留下笼统的“操作失败”。
 */
function getErrorReason(error) {
  if (!error) return '';
  if (typeof error === 'string') return error.trim();

  const reasons = [];
  const add = (value) => {
    const text = typeof value === 'string' ? value.trim() : '';
    if (text && !reasons.includes(text)) reasons.push(text);
  };

  add(error.message);
  add(error.original && error.original.message);

  if (Array.isArray(error.errors)) {
    error.errors.forEach((item) => add(item && item.message));
  }

  return reasons.join(' | ');
}

function formatDurationMs(startedAt) {
  return `${(Number(process.hrtime.bigint() - startedAt) / 1e6).toFixed(2)}ms`;
}

module.exports = {
  getErrorReason,
  formatDurationMs,
};
