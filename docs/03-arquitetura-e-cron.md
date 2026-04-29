# 03. Arquitetura do Motor de Busca e Cron Job

## O Endpoint do Cron (`/api/cron/fetch-flights`)

Este é o coração do sistema. Ele será acionado via requisição GET automática (Vercel Cron) e deve operar 100% no backend. O agente codificador deve programar esta rota com a seguinte lógica sequencial:

1. **Busca de Alertas Ativos:** Consultar no Supabase (tabela `flight_alerts`) todos os registros onde `is_active = true`.
2. **Iteração e Consulta:** Para cada alerta ativo, realizar uma chamada à API de aviação escolhida utilizando `origin`, `destination`, `departure_date` e `return_date`.
3. **Processamento de Preço:** Extrair do JSON da API externa o voo mais barato que atenda rigorosamente aos critérios do alerta.
4. **Registro de Histórico:** Inserir um novo registro na tabela `price_history` no Supabase contendo o `alert_id`, o `price_found` e o `booking_link`.
5. **Avaliação de Gatilho e Notificação (Anti-Spam):**
   - **SE** `price_found` <= `target_price`...
   - **E SE** `price_found` for diferente do `last_notified_price` (para não reenviar a mesma notificação a cada execução do cron)...
   - **ENTÃO** disparar a mensagem para o Telegram.
6. **Atualização de Estado:** Caso a notificação do Telegram tenha sucesso, atualizar o campo `last_notified_price` na tabela `flight_alerts` para evitar repetições no futuro.

## Gestão de Timeouts (Vercel Serverless)

No plano Hobby da Vercel, o limite padrão de execução é de 10 a 15 segundos, o que é arriscado quando fazemos chamadas a APIs de voos que costumam ser lentas.

- **Ação Obrigatória:** O agente deve incluir `export const maxDuration = 60;` no topo do arquivo `route.ts` do cron para garantir tempo hábil de processamento.
- **Requisições:** Ao processar múltiplos alertas, utilizar um loop assíncrono sequencial (`for...of`) com um pequeno _delay_ se necessário, em vez de disparar todos simultaneamente (`Promise.all`), para evitar o bloqueio por limite de requisições (_rate limit_) na API de voos.

## Interface Base de Serviços (`src/lib/`)

O agente deve isolar a complexidade de chamadas externas criando dois arquivos em `/lib`:

### 1. `flight-api.ts`

Deve conter a abstração da busca.

```typescript
interface FlightSearchParams {
  origin: string;
  destination: string;
  dateFrom: string;
  dateTo?: string | null;
}

interface FlightResult {
  price: number;
  link: string;
  currency: string;
}

// A implementação real fará o fetch na API (ex: Tequila/Kiwi)
export async function fetchCheapestFlight(params: FlightSearchParams): Promise<FlightResult | null> { ... }

### 2. `telegram.ts`

interface TelegramNotificationParams {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string | null;
  priceFound: number;
  targetPrice: number;
  bookingLink: string;
}

// Implementação fará um POST para: [https://api.telegram.org/bot](https://api.telegram.org/bot)<TOKEN>/sendMessage
// Layout esperado da mensagem:
// 🚨 ALERTA DE PASSAGEM!
// 🛫 BSB ➡️ GRU
// 📅 Ida: 15/05/2026 | Volta: 20/05/2026
// 💰 Preço Atual: R$ 350,00 (Seu Alvo: R$ 400,00)
// 🔗 [Link para Comprar]
export async function sendTelegramNotification(params: TelegramNotificationParams): Promise<boolean> { ... }

### 3. `supabase.ts`

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Instância única para interagir com o banco de dados
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```
