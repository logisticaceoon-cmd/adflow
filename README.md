# ⚡ AdFlow — Plataforma de Anuncios con IA

Plataforma SaaS para crear y gestionar campañas de Facebook Ads con Inteligencia Artificial.

---

## 🚀 Instalación paso a paso

### PASO 1 — Crear el proyecto en tu computadora

```bash
# 1. Copiá todos los archivos de este proyecto a una carpeta llamada "adflow"

# 2. Abrí la terminal y ejecutá:
cd adflow
npm install

# Deberías ver que instala todas las dependencias (tarda 1-2 minutos)
```

---

### PASO 2 — Configurar Supabase (base de datos y login)

1. Ir a **supabase.com** → crear cuenta gratis → **New Project**
2. Elegí nombre: `adflow`, región: **South America (São Paulo)**
3. Esperá 1-2 minutos que cree el proyecto
4. Ir a **Settings → API** y copiar:
   - `Project URL` → va en `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → va en `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role secret` → va en `SUPABASE_SERVICE_ROLE_KEY`
5. Ir a **SQL Editor → New Query** → pegá todo el contenido del archivo `supabase-schema.sql` → **Run**

---

### PASO 3 — Configurar las variables de entorno

```bash
# En la carpeta del proyecto, crear el archivo .env.local
cp .env.local.example .env.local

# Editá .env.local con tus datos reales
```

Abrí `.env.local` con cualquier editor de texto y completá:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

ANTHROPIC_API_KEY=sk-ant-...   # console.anthropic.com
RESEND_API_KEY=re_...          # resend.com

FB_APP_ID=123456789
FB_APP_SECRET=abcdef123...

NEXT_PUBLIC_APP_URL=http://localhost:3000
CRON_SECRET=genera_un_string_aleatorio_seguro_aqui
```

---

### PASO 4 — Obtener API Key de Anthropic (Claude IA)

1. Ir a **console.anthropic.com** → crear cuenta
2. **API Keys → Create Key** → copiá la key
3. Pegala en `.env.local` como `ANTHROPIC_API_KEY`
4. Tiene créditos gratis para empezar ($5 USD)

---

### PASO 5 — Obtener API Key de Resend (emails)

1. Ir a **resend.com** → crear cuenta gratis
2. **API Keys → Create API Key** → copiá la key
3. Pegala en `.env.local` como `RESEND_API_KEY`
4. Plan gratuito: 3,000 emails/mes

---

### PASO 6 — Configurar app de Facebook (para conectar cuentas de clientes)

1. Ir a **developers.facebook.com** → Login con tu cuenta de Facebook
2. **My Apps → Create App → Business**
3. Nombre: `AdFlow` → crear
4. **Settings → Basic** → copiar `App ID` y `App Secret`
5. **Add Product → Facebook Login → Web**
6. En "Valid OAuth Redirect URIs" agregar: `http://localhost:3000/api/facebook/callback`
7. **App Review → Permissions → Solicitar**: `ads_management`, `ads_read`, `business_management`

> ⚠️ Para producción, Meta necesita aprobar la app (5-10 días hábiles). En desarrollo podés usar cuentas de prueba.

---

### PASO 7 — Correr la aplicación

```bash
npm run dev
```

Abrí el navegador en **http://localhost:3000**

Deberías ver la landing page de AdFlow. Hacé clic en "Empezar gratis" para crear tu primera cuenta.

---

## 🌐 Deploy en Vercel (para subir a internet)

```bash
# 1. Instalar Vercel CLI
npm install -g vercel

# 2. Deploy
vercel

# Seguí los pasos en la terminal. Vercel te va a dar una URL pública.
# Acordate de agregar todas las variables de .env.local en Vercel → Settings → Environment Variables
```

Después del deploy:
- Actualizá `NEXT_PUBLIC_APP_URL` con tu dominio de Vercel
- Agregá la nueva URL en Facebook Login como redirect URI adicional

---

## 📁 Estructura del proyecto

```
adflow/
├── src/
│   ├── app/
│   │   ├── page.tsx                    # Landing page pública
│   │   ├── login/page.tsx              # Login
│   │   ├── register/page.tsx           # Registro
│   │   ├── dashboard/
│   │   │   ├── layout.tsx              # Layout con sidebar (protegido)
│   │   │   ├── page.tsx                # Resumen general
│   │   │   ├── campaigns/page.tsx      # Lista de campañas
│   │   │   ├── create/page.tsx         # Crear campaña con IA ⭐
│   │   │   ├── reports/page.tsx        # Reportes diarios
│   │   │   └── settings/page.tsx       # Configuración + conectar FB
│   │   └── api/
│   │       ├── ai/generate-copies/     # 🤖 Claude genera los copies
│   │       ├── facebook/callback/      # OAuth de Facebook
│   │       └── cron/daily-report/      # 📩 Reporte automático diario
│   ├── components/
│   │   └── dashboard/Sidebar.tsx       # Menú lateral
│   ├── lib/
│   │   └── supabase/                   # Clientes de Supabase
│   └── types/index.ts                  # Tipos TypeScript
├── supabase-schema.sql                 # ← Ejecutar en Supabase SQL Editor
├── vercel.json                         # Cron job configurado (8 AM Argentina)
└── .env.local.example                  # Plantilla de variables
```

---

## 🔧 Funcionalidades implementadas

- [x] Landing page pública
- [x] Registro y login (Supabase Auth)
- [x] Dashboard protegido con sidebar
- [x] Resumen general con métricas
- [x] Lista de campañas con tabla
- [x] Crear campaña con formulario
- [x] Generación de copies con Claude IA
- [x] Subida de creativos (imágenes/videos)
- [x] Conexión con cuenta de Facebook (OAuth)
- [x] Cron job de reportes diarios
- [x] Análisis de métricas con Claude IA
- [x] Envío de email con reporte HTML
- [x] Configuración de cuenta y reportes

## 🚧 Próxima fase (Fase 2)

- [ ] Publicación real de campaña en Facebook Ads API
- [ ] Dashboard de métricas en tiempo real con gráficos
- [ ] Aplicar recomendaciones con un clic
- [ ] Generación de imágenes con IA (DALL-E / Flux)
- [ ] Sistema de pagos con Stripe

---

## 🆘 Soporte

Si algo no funciona, revisá:
1. Que todas las variables de `.env.local` estén completas
2. Que el SQL de `supabase-schema.sql` se ejecutó correctamente en Supabase
3. Que la API Key de Anthropic tenga crédito disponible
