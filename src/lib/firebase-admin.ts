// firebase-admin usage removed. Use server-side SQL services instead.
export function getAdminDb(): never {
  throw new Error(
    "getAdminDb is removed. Use SQL-backed services (usersService) instead."
  );
}
