# 🔐 CONFIGURAÇÃO RÁPIDA DE SECRETS

## Passo 1: Dashboard Base44

1. Vá para **Settings → Environment Variables**
2. Clique em **Add Secret**

## Passo 2: Cole Um Por Um

```
INSTAGRAM_APP_ID = [seu-app-id]
INSTAGRAM_APP_SECRET = [seu-app-secret]
INSTAGRAM_ACCESS_TOKEN = [seu-token]
INSTAGRAM_BUSINESS_ACCOUNT_ID = [seu-account-id]
WHATSAPP_PHONE_ID = [seu-phone-id]
WHATSAPP_ACCESS_TOKEN = [seu-token]
GOOGLE_CALENDAR_ID = [seu-calendar-id]
```

## Passo 3: Onde Pegar Cada Um

### Instagram
- App ID & Secret: https://developers.facebook.com/apps → Seu App → Settings → Basic
- Access Token: Apps → Seu App → Tools → Access Token
- Business Account ID: Seu App → Instagram → Configurações

### WhatsApp
- Phone ID: WhatsApp Manager → Contas → Sua Conta → Phone Number ID
- Access Token: WhatsApp Manager → Configurações → Access Token

### Google Calendar
- Calendar ID: Google Calendar → Configurações → ID do calendário

## Pronto!

Os backends vão ler automaticamente com:
```javascript
const token = Deno.env.get('INSTAGRAM_ACCESS_TOKEN');
```

Nenhum clique extra necessário. Tudo funciona direto.