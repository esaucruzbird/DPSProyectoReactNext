"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";

export default function useRequireAuth(allowedRoles = null) {
  const { isAuthenticated, user, loaded } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loaded) return; // espera a cargar session desde localStorage
    if (!isAuthenticated) {
      router.replace("/"); //Aqui se puede forzar que apunte siempre a la page que hay en /login
      return;
    }
    if (allowedRoles && !allowedRoles.includes(user?.role)) {
      router.replace("/not-authorized");
    }
  }, [isAuthenticated, user, loaded, allowedRoles, router]);

  return { isAuthenticated, user, loaded };
}
