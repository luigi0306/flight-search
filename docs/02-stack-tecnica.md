# 02. Stack Técnica e Estrutura de Dados

## Tecnologias Base

- **Framework Frontend e Backend:** Next.js (App Router). O código deve priorizar Server Components onde for possível para visualização e Server Actions para mutações (cadastrar alertas).
- **Banco de Dados:** Supabase (PostgreSQL). Utilizaremos o Supabase JS Client (`@supabase/supabase-js`) para interagir com o banco de forma direta e tipada.
- **Hospedagem e Execução:** Vercel, utilizando _Serverless Functions_ (Node.js runtime, NÃO Edge) para garantir tempo suficiente na execução das consultas de voos.
- **Agendamento:** Vercel Cron Jobs via `vercel.json`.
- **Notificações:** Telegram Bot API (via requisições HTTP POST para `api.telegram.org`).

## Banco de Dados (Schema PostgreSQL)

O sistema opera com duas tabelas relacionais simples no Supabase.

### Tabela 1: `flight_alerts`

Armazena as configurações de busca definidas pelo usuário.

- `id` (uuid, primary key, default gen_random_uuid())
- `origin` (text, código IATA, ex: "BSB")
- `destination` (text, código IATA, ex: "GRU")
- `departure_date` (date, formato YYYY-MM-DD)
- `return_date` (date, formato YYYY-MM-DD, nullable)
- `target_price` (numeric, valor máximo aceitável)
- `is_active` (boolean, default true)
- `last_notified_price` (numeric, nullable) - Usado para controle de spam, atualizado apenas quando o sistema dispara uma notificação no Telegram.
- `created_at` (timestamptz, default now())

### Tabela 2: `price_history`

Gera o log diário dos preços para construção de gráficos e histórico.

- `id` (uuid, primary key, default gen_random_uuid())
- `alert_id` (uuid, foreign key referenciando `flight_alerts.id`, on delete cascade)
- `price_found` (numeric, o menor preço encontrado na busca daquele dia)
- `booking_link` (text, URL direta para a compra gerada pela API)
- `checked_at` (timestamptz, default now())

## Variáveis de Ambiente Esperadas (`.env.local`)

O agente codificador deve assumir a existência destas chaves:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
TELEGRAM_BOT_TOKEN=your_bot_token_from_botfather
TELEGRAM_CHAT_ID=your_personal_telegram_user_id
FLIGHT_API_KEY=your_api_key_for_flights
APP_ACCESS_PASSWORD=senha_simples_para_bloquear_o_frontend
```
