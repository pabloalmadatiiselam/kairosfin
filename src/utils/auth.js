// utils/auth.js

// CONTRASEÑA DEL SISTEMA (cambiar por la que quieras)
const SYSTEM_PASSWORD = 'Kf2025$Fin#Secure';

// Nombre de la clave en sessionStorage
const AUTH_KEY = 'kairosfin_auth';

export const login = (password) => {
  if (password === SYSTEM_PASSWORD) {
    sessionStorage.setItem(AUTH_KEY, 'authenticated');
    return true;
  }
  return false;
};

export const logout = () => {
  sessionStorage.removeItem(AUTH_KEY);
};

export const isAuthenticated = () => {
  return sessionStorage.getItem(AUTH_KEY) === 'authenticated';
};