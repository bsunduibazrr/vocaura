type TokenGetter = () => Promise<string | null>;

let tokenGetter: TokenGetter | null = null;

export function setTokenGetter(getter: TokenGetter | null) {
  tokenGetter = getter;
}

export async function getAuthToken(): Promise<string | null> {
  return tokenGetter ? tokenGetter() : null;
}
