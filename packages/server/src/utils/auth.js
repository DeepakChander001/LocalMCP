export function authenticate(providedToken, expectedToken) {
    return providedToken === expectedToken;
  }
  
  export function generateToken() {
    return crypto.randomUUID();
  }