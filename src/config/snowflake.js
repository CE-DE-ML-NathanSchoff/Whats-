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

/**
 * Get a connected connection when using EXTERNALBROWSER (opens browser once, then reuses).
 * Required because the driver's pool uses connect(), but EXTERNALBROWSER requires connectAsync().
 */
function getBrowserConnection() {
  if (browserConn) return Promise.resolve(browserConn);
  if (!connectionOptions.account || !connectionOptions.username) {
    return Promise.reject(new Error('Missing Snowflake config: set SNOWFLAKE_ACCOUNT and SNOWFLAKE_USERNAME in .env for browser auth'));
  }
  const conn = snowflake.createConnection(connectionOptions);
  return new Promise((resolve, reject) => {
    conn.connectAsync((err, c) => {
      if (err) reject(err);
      else {
        browserConn = c;
        resolve(c);
      }
    });
  });
}

/**
 * Get or create the Snowflake connection pool (or browser-connection wrapper when EXTERNALBROWSER).
 */
export function getPool() {
  if (useBrowserAuth) {
    return {
      use(fn) {
        return getBrowserConnection().then((conn) => fn(conn));
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
  // #region agent log
  fetch('http://127.0.0.1:7845/ingest/7de3d914-7760-4475-bfb8-cab4b17760b2',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'46a376'},body:JSON.stringify({sessionId:'46a376',location:'snowflake.js:execute',message:'execute called',data:{sqlPreview:String(sqlText).slice(0,60)},timestamp:Date.now(),hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  const pool = getPool();
  return pool.use((conn) => {
    // #region agent log
    console.log('[DEBUG] pool.use callback invoked, conn acquired');
    fetch('http://127.0.0.1:7845/ingest/7de3d914-7760-4475-bfb8-cab4b17760b2',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'46a376'},body:JSON.stringify({sessionId:'46a376',location:'snowflake.js:pool.use',message:'conn acquired',data:{},timestamp:Date.now(),hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    return new Promise((resolve, reject) => {
      console.log('[DEBUG] calling conn.execute');
      conn.execute({
        sqlText,
        binds: binds.length ? binds : undefined,
        complete: (err, stmt, rows) => {
          console.log('[DEBUG] complete callback invoked', err ? err.message : 'ok');
          // #region agent log
          fetch('http://127.0.0.1:7845/ingest/7de3d914-7760-4475-bfb8-cab4b17760b2',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'46a376'},body:JSON.stringify({sessionId:'46a376',location:'snowflake.js:complete',message:'complete callback',data:{hasErr:!!err,errMessage:err?err.message:null},timestamp:Date.now(),hypothesisId:'B,C,E'})}).catch(()=>{});
          // #endregion
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
