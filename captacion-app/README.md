# CAPTACIÓN

Web app interna para consultar y editar la base de datos de jugadores del
Athletic Club Football Center, conectada a Supabase.

## Funcionalidad

- Listado de jugadores con filtro por posición y buscador por nombre.
- Alta, edición y borrado de jugadores.
- Acceso protegido con una contraseña única (pantalla de login).

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
