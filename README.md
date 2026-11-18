# El Gringo Celulares: interfaz web

Interfaz del sistema de gestión de «El Gringo Celulares» (Formosa). Aplicación de una sola página con React 19, Vite, Tailwind CSS 4 y React Router 7. Funciona en computadora y en celular.

**Seminario de Integración**, Universidad de la Cuenca del Plata (Lic. en Sistemas de Información, Comisión U, Sede Formosa), 2026.
Britez Joaquín Emiliano · Ortega Minardi Martín · Rivero Ruth Camila

El servidor está en el repositorio [gringo-backend](https://github.com/MartinOrtega3RL/gringo-backend). Hay que tenerlo en marcha (puerto 3000) para usar la interfaz.

## Uso

```bash
npm ci
npm run dev       # desarrollo: http://localhost:5173
npm run build     # compilado para producción, en dist/
```

En desarrollo, Vite reenvía `/api` al servidor en `http://127.0.0.1:3000`, así que no hace falta configurar CORS. En producción, Nginx entrega `dist/` y reenvía `/api` al servidor.

## Estructura

```
src/
  api/       Cliente HTTP con el token de sesión
  app/       Rutas y marco de la aplicación
  modulos/   Una carpeta por área: acceso, permisos, catálogo, existencias,
             clientes, proveedores, ventas, servicio, reportes
  ui/        Componentes compartidos
```
