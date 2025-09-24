// src/app/page.js
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Page() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Ajusta aquí la key que usas para la sesión en localStorage
    // ejemplo: const auth = localStorage.getItem("sess") || localStorage.getItem("auth");
    const auth = localStorage.getItem("session"); 

    if (auth) {
      // si hay sesión, ir al dashboard
      router.replace("/dashboard");
    } else {
      // si no, ir a login
      router.replace("/login");
    }
    // opcional: quitar el estado de checking si quieres mostrar algo mientras tanto
    setChecking(false);
  }, [router]);

  if (checking) return <div style={{padding:20}}>Redirigiendo…</div>;
  return null;
}
