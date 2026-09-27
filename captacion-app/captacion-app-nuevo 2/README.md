# CAPTACIÓN

Web app interna para consultar y editar la base de datos de jugadores del
Athletic Club Football Center, conectada a Supabase.

## Funcionalidad

- Listado de jugadores con filtro por posición y buscador por nombre, con vista de tabla o de tarjetas.
- Alta, edición y borrado de jugadores.
- Acceso protegido con inicio de sesión por email + contraseña.
- Gestión de usuarios (crear, cambiar contraseña, quitar acceso) desde `/usuarios`, dentro de la propia app.

## Variables de entorno

Ver `.env.example`. En Vercel se configuran en **Project Settings → Environment
Variables**:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (clave secreta de Supabase, solo servidor)
- `APP_PASSWORD` (contraseña de acceso a la app)

## Desarrollo local

```bash
npm install
cp .env.example .env.local   # y rellena los valores
npm run dev
```

## Despliegue

Pensada para desplegarse en Vercel, importando este repositorio directamente.
