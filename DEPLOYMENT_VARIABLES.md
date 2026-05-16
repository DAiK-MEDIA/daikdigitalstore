# DataHub Live Deployment Checklist

Use this document to collect the details from the client. It is written in plain language so the client can understand what they need to share.

---

## 1) Supabase credentials

These are the values needed to store and retrieve bundle orders.

### For the backend server
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY

### For the website frontend
- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY

---

## 2) Server deployment values

These are values the backend needs when the app is hosted live.

- PORT (optional, usually 5000)
- CLIENT_URL — the website address, for example `https://your-site.vercel.app`
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
- PAYSTACK_SECRET_KEY
- GETUS_API_KEY
- MYZTADATA_API_KEY (optional only if using MyZtaData)
- ADMIN_EMAIL (optional)
- ADMIN_PASSWORD (optional)
- USE_MOCK_PAYSTACK = false

---

## 3) Website frontend values

These are values the frontend needs in its deployment settings.

- VITE_API_BASE_URL — the backend API address, for example `https://your-site.vercel.app/api`
- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY

---

## 4) Paystack payment setup

This is required for customers to pay online.

- PAYSTACK_SECRET_KEY

Also confirm:
- CLIENT_URL is the live website URL
- The backend will use that URL for payment callback links like `/status/...`

---

## 5) GetUs automatic order placement

This is required for approved orders to be placed automatically on the external site.

- GETUS_API_KEY
- Make sure `auto_fulfill_api` is enabled in the product settings

Optional if using the second provider:
- MYZTADATA_API_KEY
- Enable `auto_fulfill_api_myztadata` only if MyZtaData should also be used

---

## 6) Settings the website should have

These are values that should be configured in the website admin settings:

- auto_fulfill_api = true
- auto_fulfill_api_myztadata = false (or true if using MyZtaData)
- whatsapp_link = https://api.whatsapp.com/send/?phone=233531257913
- momo_number = actual MoMo transfer number
- broadcast_message = optional banner text
- broadcast_active = true or false

---

## 7) What to ask the client for

Ask for:
- Supabase project URL
- Supabase service role key
- Supabase anonymous key
- Paystack secret key
- GetUs API key
- MyZtaData API key (if available)
- Frontend website URL
- Backend API URL
- MoMo phone number
- WhatsApp link (if different)

---

## 8) Quick live launch checklist

- [ ] Supabase backend values provided
- [ ] Supabase frontend values provided
- [ ] Paystack secret provided
- [ ] GetUs API key provided
- [ ] CLIENT_URL set correctly
- [ ] VITE_API_BASE_URL set correctly
- [ ] auto_fulfill_api turned on
- [ ] WhatsApp and MoMo details configured
- [ ] USE_MOCK_PAYSTACK disabled

---

## 9) Simple explanation for the client

1. We need Supabase values so the website can save orders.
2. We need Paystack values so customers can pay online.
3. We need GetUs values so approved orders can be sent automatically to the external site.
4. We need the live website URL so payment returns go to the right place.
5. We need WhatsApp and MoMo details so manual payment support works.
