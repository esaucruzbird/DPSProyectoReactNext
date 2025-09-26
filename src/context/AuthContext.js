"use client"; //indica a Next.js App Router que este módulo es un componente del lado cliente
import React, { createContext, useContext, useEffect, useState } from "react";
//createContext: crea un contexto para compartir estado de auth
//useContext: hook para consumir el contexto desde componentes hijos
//useEffect: hook para efectos secundarios (leer session en mount)
//useState: hook para estados locales (user, loaded)

//crea el contexto de autenticación. Inicialmente su valor es `undefined`
//(se rellena en el <AuthContext.Provider> dentro del AuthProvider)
const AuthContext = createContext();

//función auxiliar que lee la clave "users" de localStorage y la parsea a un array
//si no existe, devuelve "[]", que se convierte en un array vacío
//retorna la lista de usuarios registrados (incluye contraseñas en claro)
const getUsers = () => JSON.parse(localStorage.getItem("users") || "[]");
//función auxiliar que serializa el array `users` a JSON y lo guarda en localStorage
//bajo la clave "users". Sirve para persistir usuarios nuevos/actualizados
const saveUsers = (users) => localStorage.setItem("users", JSON.stringify(users));

//componente proveedor del contexto. Cubre partes de la app que necesitan auth
//recibe `children` (los componentes que consumen el contexto)
export function AuthProvider({ children }) {
  //estado local `user`, representa la sesión actual (objeto con id, name, email, role) o null si no hay sesión
  const [user, setUser] = useState(null);
  //estado que indica si la inicialización (lectura de localStorage) ya terminó
  //util para no renderizar pantallas dependientes de auth antes de saber si hay sesión
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      //lee "session" desde localStorage. Si no existe, parsea "null"
      const session = JSON.parse(localStorage.getItem("session") || "null");
      //si hay una sesión válida en localStorage, la coloca en el estado `user`
      if (session) setUser(session);
    //si hay error (p. ej. JSON inválido o acceso denegado a localStorage), se ignora
    } catch (e) {
      //aquí se podría registrar el error o limpiar la clave corrupta
    } finally {
      //indica que ya terminó la fase de carga inicial (sea éxito o error).
      setLoaded(true);
    }
  }, []);

  //funcion para registrar un nuevo usuario
  //recibe un objeto con name, email, password y opcionalmente role (por defecto "usuario")
  const register = ({ name, email, password, role = "usuario" }) => {
    //recupera la lista actual de usuarios desde localStorage
    const users = getUsers();
    if (users.find((u) => u.email === email)) {
      //si ya existe un usuario con ese email, lanza un error (se espera que el llamador lo capture)
      throw new Error("El correo ya está registrado");
    }
    //crea el objeto del nuevo usuario
    //se usa Date.now() como id simple
    const newUser = { id: Date.now(), name, email, password, role };
    //añade el nuevo usuario al array
    users.push(newUser);
    //se guarda la lista actualizada de usuarios en localStorage
    saveUsers(users);
    //crea el objeto session que se guardará para indicar que el usuario queda autenticado
    const session = { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role };
    //guarda la sesión en localStorage. Esto permite persistir la sesión entre recargas
    //y también dispara el evento "storage" en otras pestañas (útil para detección entre pestañas)
    localStorage.setItem("session", JSON.stringify(session));
    //actualiza el estado local `user` para reflejar que hay una sesión activa
    setUser(session);
  };

  //función para autenticación (login)
  const login = ({ email, password }) => {
    //lee usuarios desde localStorage
    const users = getUsers();
    //busca un usuario cuyo email y password coincidan exactamente
    //(comparación sencilla, no hay hashing ni verificación por servidor)
    const found = users.find((u) => u.email === email && u.password === password);
    //si no se encuentra coincidencia, lanza el error
    if (!found) throw new Error("Credenciales inválidas");
    //construye el objeto session a partir del usuario encontrado
    const session = { id: found.id, name: found.name, email: found.email, role: found.role };
    //guarda la session en localStorage (persistencia con notificación a otras pestañas)
    localStorage.setItem("session", JSON.stringify(session));
    //actualiza el estado local `user`
    setUser(session);
  };

  //función para cerrar sesión
  const logout = () => {
    //elimina la sesión de localStorage (también dispara "storage" en otras pestañas)
    localStorage.removeItem("session");
    //pone `user` en null en la pestaña actual
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, register, login, logout, loaded }}>
      {children}
    </AuthContext.Provider>
  );
  //provee el contexto asi:
  //user: objeto de sesión o null
  //isAuthenticated: booleano derivado (!!user, doble negación)
  //register, login, logout: funciones expuestas para manejar auth
  //loaded: indica si la carga inicial ya se realizó
}
//hook personalizado que facilita consumir el AuthContext en otros componentes
export const useAuth = () => useContext(AuthContext);
