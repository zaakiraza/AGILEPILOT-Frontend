import { DataStore } from './dataStore';

export const Auth = {
  login(email, password) {
    const user = DataStore.getUserByEmail(email);
    if (!user || user.password !== password) throw new Error('Invalid credentials');
    const token = 'fake-jwt.' + btoa(email);
    localStorage.setItem('ap_token', token);
    localStorage.setItem('ap_user', JSON.stringify(user));
    return { token, user };
  },
  logout() { localStorage.removeItem('ap_token'); localStorage.removeItem('ap_user'); },
  currentUser() { return JSON.parse(localStorage.getItem('ap_user') || 'null'); },
  isAuthenticated() { return !!localStorage.getItem('ap_token'); }
};