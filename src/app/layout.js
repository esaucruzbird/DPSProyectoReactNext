//Importa 2 fuentes desde el helper next/font/google (Next.js): Geist y Geist_Mono. Esto permite cargar fuentes optimizadas y tener variables CSS para usarlas sin cargar fuentes vía <link> externo
import { Geist, Geist_Mono } from 'next/font/google';
//incluyes el CSS global, se aplica a toda la app y normalmente contiene resets, variables CSS y estilos base
import './globals.css';
//importa el componente Providers que envuelve la app con contextos (AuthProvider, etc.)
import Providers from '../providers/Providers';

//configura la fuente Geist. Al pedir variable: '--font-geist-sans' Next genera una clase y una variable CSS que se puede aplicar en el <html> o <body> para usar la fuente vía var(--font-geist-sans) o la clase que Next exporta
const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

//igual para la fuente monospace Geist_Mono, usar variables facilita mezclar fuentes (ejemplo, tipografía principal y la fuente monospace para código)
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

//exporta metadata para que Next.js (App Router) la inserte en <head> automáticamente (título, meta description, etc.). se puede ampliar con openGraph, icons, etc.
export const metadata = {
  title: 'Sistema de proyectos y tareas',
  description: 'Aplicacion de React con NextJS',
};

//RootLayout es el layout raíz (server component por defecto)
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      {/*body envuelve el contenido y dentro se coloca el Providers (client component) para que los children tengan acceso a los contexts*/}
      <body>
        {/*providers es un Client Component que expone contextos (Auth, Theme, etc.)
          colocar Providers aquí asegura que los children puedan consumir esos contexts*/}
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
