import sql, {
  ISqlTypeFactory,
  ISqlType,
  VarChar,
  NVarChar,
  Int,
  BigInt,
} from "mssql";

// Prefer explicit DB_* settings; fall back to DATABASE_URL if provided.
const {
  DB_SERVER,
  DB_NAME,
  DB_USER,
  DB_PASSWORD,
  DB_PORT,
  DB_ENCRYPT,
  DB_TRUST_SERVER_CERTIFICATE,
  DATABASE_URL,
} = process.env as Record<string, string | undefined>;

const parsedPort = DB_PORT ? Number(DB_PORT) : 1433;
const parsedEncrypt = DB_ENCRYPT ? DB_ENCRYPT.toLowerCase() === "true" : true;
const parsedTrustCert = DB_TRUST_SERVER_CERTIFICATE
  ? DB_TRUST_SERVER_CERTIFICATE.toLowerCase() === "true"
  : true;

const useUrl = !!DATABASE_URL;
if (!useUrl && !DB_SERVER) {
  throw new Error(
    "DATABASE_URL or DB_SERVER/DB_NAME/DB_USER/DB_PASSWORD is required for SQL Server connection"
  );
}

const connectionConfig: sql.config | string = useUrl
  ? (DATABASE_URL as string)
  : {
      server: DB_SERVER as string,
      database: DB_NAME,
      user: DB_USER,
      password: DB_PASSWORD,
      port: parsedPort,
      options: {
        encrypt: parsedEncrypt,
        trustServerCertificate: parsedTrustCert,
      },
    };

let pool: sql.ConnectionPool | null = null;

/** Get or create a singleton SQL Server connection pool. */
export async function getPool(): Promise<sql.ConnectionPool> {
  if (pool) return pool;
  pool = await sql.connect(connectionConfig as sql.config);
  return pool;
}

type InputValue = string | number | null | Date | boolean;

/**
 * Run a parameterized query using mssql driver. Inputs is a map of param name to value and type.
 * Example: runQuery('SELECT * FROM Users WHERE id = @id', { id: { type: Int, value: 1 } })
 */
export async function runQuery<T = unknown>(
  queryText: string,
  inputs: Record<
    string,
    { type: ISqlTypeFactory | ISqlType; value: InputValue }
  > = {}
): Promise<sql.IResult<T>> {
  const p = await getPool();
  const request = p.request();
  for (const [key, cfg] of Object.entries(inputs)) {
    request.input(key, cfg.type as sql.ISqlType, cfg.value as sql.ISqlType);
  }
  return request.query<T>(queryText);
}

/** Execute a stored procedure with inputs, returning result sets. */
export async function runProcedure<T = unknown>(
  procedureName: string,
  inputs: Record<
    string,
    { type: ISqlTypeFactory | ISqlType; value: InputValue }
  > = {}
): Promise<sql.IProcedureResult<T>> {
  const p = await getPool();
  const request = p.request();
  for (const [key, cfg] of Object.entries(inputs)) {
    request.input(key, cfg.type as sql.ISqlType, cfg.value as sql.ISqlType);
  }
  return request.execute<T>(procedureName);
}

// Re-export common SQL types for convenience
export const Types = { VarChar, NVarChar, Int, BigInt };

export default { getPool, runQuery, runProcedure, Types };
