const { getErrorReason, formatDurationMs } = require('./error-reason');

const INSTALLED = Symbol.for('babylog.databaseQueryLogger');

function getSqlText(sql) {
  if (typeof sql === 'string') return sql;
  if (sql && typeof sql.query === 'string') return sql.query;
  return String(sql || '');
}

function extractTarget(sql) {
  const normalized = getSqlText(sql).replace(/\s+/g, ' ').trim();
  const patterns = [
    /^(?:INSERT\s+(?:OR\s+\w+\s+)?INTO|UPDATE|DELETE\s+FROM|ALTER\s+TABLE)\s+[`"[]?([\w.]+)/i,
    /^SELECT\b.*?\bFROM\s+[`"[]?([\w.]+)/i,
    /^CREATE\s+(?:UNIQUE\s+)?TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?[`"[]?([\w.]+)/i,
    /^CREATE\s+(?:UNIQUE\s+)?INDEX\s+(?:IF\s+NOT\s+EXISTS\s+)?[`"[]?([\w.]+)/i,
    /^DROP\s+(?:TABLE|INDEX)\s+(?:IF\s+EXISTS\s+)?[`"[]?([\w.]+)/i,
    /^(?:PRAGMA|TRUNCATE\s+TABLE|VACUUM)\s+[`"[]?([\w.]+)/i,
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (match && match[1]) return match[1];
  }
  return '';
}

function describeQuery(sql) {
  const normalized = getSqlText(sql).replace(/\s+/g, ' ').trim();
  const target = extractTarget(normalized);

  let operation = 'QUERY';
  const operationMatch = normalized.match(
    /^(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|PRAGMA|TRUNCATE|VACUUM|SAVEPOINT|RELEASE|BEGIN|COMMIT|ROLLBACK)\b/i,
  );
  if (operationMatch) operation = operationMatch[1].toUpperCase();

  return target ? `${operation} ${target}` : operation;
}

/**
 * 包装 Sequelize 的统一查询入口。模型查询、事务和原始 SQL 最终都会经过这里，
 * 因此无需在每个路由重复打印数据库日志。
 */
function installDatabaseQueryLogger(sequelize) {
  if (!sequelize || sequelize[INSTALLED]) return;

  const originalQuery = sequelize.query.bind(sequelize);
  sequelize.query = async function loggedQuery(sql, options, ...rest) {
    const startedAt = process.hrtime.bigint();
    const description = describeQuery(sql);

    try {
      const result = await originalQuery(sql, options, ...rest);
      console.log(`[数据库][成功] ${description} | 耗时 ${formatDurationMs(startedAt)}`);
      return result;
    } catch (error) {
      const reason = getErrorReason(error) || '未知数据库错误';
      console.error(
        `[数据库][失败] ${description} | 耗时 ${formatDurationMs(startedAt)} | 原因: ${reason}`,
      );
      throw error;
    }
  };

  Object.defineProperty(sequelize, INSTALLED, {
    value: true,
    enumerable: false,
    configurable: false,
  });
}

module.exports = {
  installDatabaseQueryLogger,
  describeQuery,
};
