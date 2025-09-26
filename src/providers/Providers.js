"use client";
//declara que este módulo es un client component en el App Router de Next.js. Es necesario porque el AuthProvider que aquí se usa accede a localStorage y hooks de React (useState/useEffect), cosas que solo funcionan en el cliente

import React from "react";
//importa el proveedor de autenticación definido. AuthProvider expone el contexto (AuthContext.Provider) y gestiona estado de sesión, login, logout, etc.
import { AuthProvider } from "../context/AuthContext";

//define y exporta un componente llamado Providers que recibe children y los envuelve con AuthProvider
//propósito, centraliza aquí todos los providers que la app necesita (auth, theming, state managers, query clients, etc.) y luego usar Providers en el layout raíz (src/app/layout.js) para que el contexto esté disponible en toda la aplicación
//providers es un componente de orden superior simple, no añade lógica, solo composición
export default function Providers({ children }) {
  //solo envuelve con AuthProvider
  return <AuthProvider>{children}</AuthProvider>;
}
