"use client";
import React, { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext();

const getUsers = () => JSON.parse(localStorage.getItem("users") || "[]");
const saveUsers = (users) => localStorage.setItem("users", JSON.stringify(users));

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const session = JSON.parse(localStorage.getItem("session") || "null");
      if (session) setUser(session);
    } catch (e) {
      // ignore
    } finally {
      setLoaded(true);
    }
  }, []);

  const register = ({ name, email, password, role = "usuario" }) => {
    const users = getUsers();
    if (users.find((u) => u.email === email)) {
      throw new Error("El correo ya está registrado");
    }
    const newUser = { id: Date.now(), name, email, password, role };
    users.push(newUser);
    saveUsers(users);
    const session = { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role };
    localStorage.setItem("session", JSON.stringify(session));
    setUser(session);
  };

  const login = ({ email, password }) => {
    const users = getUsers();
    const found = users.find((u) => u.email === email && u.password === password);
    if (!found) throw new Error("Credenciales inválidas");
    const session = { id: found.id, name: found.name, email: found.email, role: found.role };
    localStorage.setItem("session", JSON.stringify(session));
    setUser(session);
  };

  const logout = () => {
    localStorage.removeItem("session");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, register, login, logout, loaded }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
