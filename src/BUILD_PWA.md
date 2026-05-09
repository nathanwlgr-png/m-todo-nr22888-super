# 🚀 SEAMATY NR22888 — BUILD PWA FINAL

## ⚡ Passos Rápidos

### 1. Preparar Ícones/Splashes
```bash
# Criar pasta se não existir
mkdir -p public

# Adicionar em public/:
# - icon-192x192.png
# - icon-512x512.png
# - icon-maskable-192x192.png
# - icon-maskable-512x512.png
# - favicon.svg
# - favicon.ico
# - splash-1125x2436.png (opcional)
# - splash-1536x2048.png (opcional)
# - screenshot-540x720.png (opcional)
# - screenshot-1280x720.png (opcional)
```

**Gerar ícones rápido (online):**
- https://www.favicon-generator.org/
- Upload logo
- Download todos ícones
- Colocar em `public/`

### 2. Build
```bash
npm run build
```

Esperar: `✓ built in XXs`

### 3. Testar Localmente
```bash
# Instalar serve
npm install -g serve

# Rodar em HTTPS local (obrigatório para PWA)
serve -l 3000 dist --ssl-cert server.crt --ssl-key server.key
```

Ou usar Vite preview:
```bash
npm run preview
```

### 4. Publicar
- Vercel: `vercel deploy`
- Netlify: Conectar repo + auto-deploy
- AWS/DigitalOcean: fazer upload `dist/`

**IMPORTANTE:** Precisa ser HTTPS (não HTTP)

### 5. Instalar no Tablet
1. Abrir em `https://seu-dominio.com`
2. Esperar notificação "Instalar"
3. Tocar "Instalar Agora"
4. Pronto!

---

## ✅ Verificação PWA

Abrir no navegador:
- F12 → Application → Service Workers
  - Status: "activated and running"
- F12 → Application → Manifest
  - Todos campos verdes
- F12 → Application → Cache Storage
  - "seamaty-nr22-v1" deve existir

---

## 📋 Status Implementado

- ✅ manifest.json válido
- ✅ Service Worker (offline)
- ✅ Meta tags PWA
- ✅ Icons (4 tamanhos)
- ✅ Splash screens
- ✅ Install prompt
- ✅ Offline indicator
- ✅ Layout tablet-friendly
- ✅ Dados offline (localStorage)
- ✅ Responsive (320px-2560px)

---

## 🎯 Próximos Passos (Opcional)

1. **Criar ícones oficiais:**
   - Logo Seamaty em PNG (transparente)
   - Gerar em https://www.favicon-generator.org/

2. **Customizar cores:**
   - Editar manifest.json (theme_color, background_color)
   - Editar index.html (meta theme-color)

3. **Testar em dispositivo real:**
   - Build local
   - Deploy em staging
   - Instalar no tablet via QR code

4. **Monitorar offline:**
   - Verificar localStorage em F12
   - Testar modo avião
   - Ver sincronização ao voltar online

---

## 🔗 Links Úteis

- [PWA Docs MDN](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [Web.dev PWA Checklist](https://web.dev/pwa-checklist/)
- [Manifest Generator](https://www.favicon-generator.org/)
- [Lighthouse PWA Audit](chrome://settings/safety) → DevTools

---

## ❓ Erros Comuns

**"Could not resolve ./layout"**
→ Usar `.jsx` no import

**Service Worker não funciona**
→ Verificar HTTPS + browser cache

**Offline não sincroniza**
→ Verificar localStorage + função sync

**Ícone não aparece**
→ Recarregar, limpar cache, reinstalar app

---

**Status: ✅ Pronto para Build e Deploy**

Rodar: `npm run build