const AUTH_KEY_STORAGE = 'downpe_auth_key';

export class AuthService {
  static saveKey(key: string): void {
    localStorage.setItem(AUTH_KEY_STORAGE, key);
  }

  static getKey(): string | null {
    return localStorage.getItem(AUTH_KEY_STORAGE);
  }

  static clearKey(): void {
    localStorage.removeItem(AUTH_KEY_STORAGE);
  }

  static isAuthenticated(): boolean {
    return !!this.getKey();
  }
}
