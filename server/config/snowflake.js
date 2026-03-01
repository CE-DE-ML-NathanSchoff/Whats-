import snowflake from 'snowflake-sdk';

const useBrowserAuth = process.env.SNOWFLAKE_AUTHENTICATOR === 'EXTERNALBROWSER';

const connectionOptions = {
  account: process.env.SNOWFLAKE_ACCOUNT,
  username: process.env.SNOWFLAKE_USERNAME,
  password: process.env.SNOWFLAKE_PASSWORD,
  warehouse: process.env.SNOWFLAKE_WAREHOUSE || 'COMPUTE_WH',
  database: process.env.SNOWFLAKE_DATABASE || 'COMUNITREE',
  schema: process.env.SNOWFLAKE_SCHEMA || 'PUBLIC',
  role: process.env.SNOWFLAKE_ROLE || 'ACCOUNTADMIN',
  application: 'COMUNITREE_BACKEND',
  // MFA: set SNOWFLAKE_AUTHENTICATOR=USERNAME_PASSWORD_MFA and SNOWFLAKE_PASSCODE=<current TOTP code>
  // Browser: set SNOWFLAKE_AUTHENTICATOR=EXTERNALBROWSER to sign in via web browser (no password in .env needed)
  ...(process.env.SNOWFLAKE_AUTHENTICATOR && { authenticator: process.env.SNOWFLAKE_AUTHENTICATOR }),
  ...(process.env.SNOWFLAKE_PASSCODE && { passcode: process.env.SNOWFLAKE_PASSCODE }),
  // Use console login URL so the driver opens Snowflake's login page (works with MFA/passkey); avoids SDK bug when SSO URL API returns null
  ...(useBrowserAuth && { disableConsoleLogin: false }),
  // Give more time for browser login + MFA/passkey (default 2 min often too short)
  ...(useBrowserAuth && { browserActionTimeout: 300000 }),
};

const poolOptions = {
  max: 10,
  min: 0,
};

let pool = null;
/** @type {import('snowflake-sdk').Connection | null} */
let browserConn = null;
/** @type {Promise<import('snowflake-sdk').Connection> | null} - in-flight connection so concurrent callers share one attempt */
let browserConnPromise = null;

/**
 * Clear the cached browser connection so the next getBrowserConnection() will reconnect.
 * Call this when a query fails so stale/dead connections are not reused.
 */
function clearBrowserConnection() {
  browserConn = null;
  browserConnPromise = null;
}

/**
 * Get a connected connection when using EXTERNALBROWSER (opens browser once, then reuses).
 * Required because the driver's pool uses connect(), but EXTERNALBROWSER requires connectAsync().
 * Uses a shared pending promise so concurrent requests before the first connectAsync completes
 * all wait on the same connection attempt instead of starting multiple browser auth flows.
 * If the cached connection becomes stale (e.g. session timeout, network failure), clearBrowserConnection()
 * is called on query failure so the next call will reconnect.
 */
function getBrowserConnection() {
  if (browserConn) return Promise.resolve(browserConn);
  if (browserConnPromise) return browserConnPromise;
  if (!connectionOptions.account || !connectionOptions.username) {
    return Promise.reject(new Error('Missing Snowflake config: set SNOWFLAKE_ACCOUNT and SNOWFLAKE_USERNAME in .env for browser auth'));
  }
  const conn = snowflake.createConnection(connectionOptions);
  browserConnPromise = new Promise((resolve, reject) => {
    conn.connectAsync((err, c) => {
      if (err) {
        browserConnPromise = null; // allow retry on next call
        reject(err);
      } else {
        browserConn = c;
        browserConnPromise = null;
        resolve(c);
      }
    });
  });
  return browserConnPromise;
}

/**
 * Get or create the Snowflake connection pool (or browser-connection wrapper when EXTERNALBROWSER).
 */
export function getPool() {
  if (useBrowserAuth) {
    return {
      use(fn) {
        return getBrowserConnection()
          .then((conn) => fn(conn))
          .catch((err) => {
            clearBrowserConnection();
            throw err;
          });
      },
    };
  }
  if (!pool) {
    if (!connectionOptions.account || !connectionOptions.username || !connectionOptions.password) {
      throw new Error('Missing Snowflake config: set SNOWFLAKE_ACCOUNT, SNOWFLAKE_USERNAME, SNOWFLAKE_PASSWORD in .env');
    }
    pool = snowflake.createPool(connectionOptions, poolOptions);
  }
  return pool;
}

/**
 * Execute a SQL statement using the connection pool.
 * @param {string} sqlText - SQL query (use ? for bind placeholders)
 * @param {Array} [binds=[]] - Bind parameters
 * @returns {Promise<{ rows: Array, statement: object }>}
 */
export function execute(sqlText, binds = []) {
  const pool = getPool();
  return pool.use((conn) => {
    return new Promise((resolve, reject) => {
      conn.execute({
        sqlText,
        binds: binds.length ? binds : undefined,
        complete: (err, stmt, rows) => {
          if (err) reject(err);
          else resolve({ rows: rows || [], statement: stmt });
        },
      });
    });
  });
}

/**
 * Execute and return the first result set as an array of rows.
 * @param {string} sqlText
 * @param {Array} [binds=[]]
 * @returns {Promise<Array>}
 */
export async function query(sqlText, binds = []) {
  const { rows } = await execute(sqlText, binds);
  return rows;
}

export default { getPool, execute, query };
