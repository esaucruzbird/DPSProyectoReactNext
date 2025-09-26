"use client";
//ejecuta la lógica de protección cuando cambian dependencias (auth, user, loaded, etc)
import { useEffect } from "react";
//useRouter del App Router para redirecciones cliente (router.replace, router.push)
import { useRouter } from "next/navigation";
//hook personalizado que devuelve { user, isAuthenticated, loaded, ... }
import { useAuth } from "../context/AuthContext";

//hook personalizado que protege componentes / páginas en el cliente
//allowedRoles: opcional, lista de roles permitidos. Si es null solo se requiere estar autenticado
export default function useRequireAuth(allowedRoles = null) {
  const { isAuthenticated, user, loaded } = useAuth();
  //extrae del contexto:
  //isAuthenticated: booleano (!!user, doble negación)
  //user: objeto de sesión (id, name, email, role)
  //loaded: indica si ya se leyó localStorage y sabemos si hay sesión
  
  //router para redireccionar
  const router = useRouter();

  useEffect(() => {
    //espera a cargar session desde localStorage, espera a que la inicialización de AuthProvider acabe
    if (!loaded) return; 
    if (!isAuthenticated) {
      //si no está autenticado, redirige al inicio (/)
      router.replace("/"); //Aqui se puede forzar que apunte siempre a la page que hay en /login
      return;
    }
    if (allowedRoles && !allowedRoles.includes(user?.role)) {
      router.replace("/not-authorized");
    }
  }, [isAuthenticated, user, loaded, allowedRoles, router]);
  //dependencias: el efecto se vuelve a ejecutar cuando cualquiera cambie

  //retorna valores para que el componente que usa el hook pueda renderizar condicionalmente
  return { isAuthenticated, user, loaded };
}
