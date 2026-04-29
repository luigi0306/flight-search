# 01. Contexto do Produto e Regras de Negócio

## Visão Geral do Projeto

O sistema é um rastreador autônomo de passagens aéreas para uso pessoal. O objetivo principal é monitorar diariamente os preços de voos para destinos específicos e notificar o usuário automaticamente via Telegram quando uma passagem for encontrada com um valor abaixo do limite predefinido.

## O Fluxo do Usuário (MVP)

1. O usuário acessa a aplicação web (Interface Next.js).
2. O usuário visualiza um dashboard listando os "Alertas de Voos" já cadastrados.
3. O usuário pode cadastrar um novo Alerta informando:
   - Aeroporto de Origem (Código IATA, ex: BSB).
   - Aeroporto de Destino (Código IATA, ex: GRU).
   - Data de Ida (ou um intervalo de datas flexível, se a API permitir).
   - Data de Volta (opcional).
   - Preço Alvo (O valor máximo que o usuário está disposto a pagar).
4. O sistema roda em background (Cron Job) de forma invisível.
5. Se o sistema encontra um voo que atenda aos critérios e cujo preço seja menor ou igual ao "Preço Alvo", o usuário recebe uma mensagem no Telegram com os detalhes do voo e o link para compra.

## Entidades Principais (Lógica)

- **Flight Alert (Alerta de Voo):** É o registro criado pelo usuário contendo os parâmetros da viagem desejada.
- **Price History (Histórico de Preço):** Cada vez que o sistema faz uma busca, ele salva o menor preço encontrado naquele dia para gerar gráficos futuros de tendência de preço.

## Regras de Negócio e Restrições (Importante para a IA)

- **Prevenção de Spam (Notificações):** O sistema não deve notificar o usuário todas as vezes que buscar. A notificação via Telegram SÓ deve ser disparada se:
  a) O preço atual for menor ou igual ao Preço Alvo.
  b) O usuário já não tiver sido notificado sobre ESSE MESMO preço nas últimas 24 horas (para evitar mensagens repetidas a cada execução do cron).
- **Fuso Horário:** Todas as datas de busca e logs do sistema devem considerar o fuso horário local (`America/Sao_Paulo`) para evitar confusões com os dias dos voos.
- **Escopo Fechado:** Não haverá sistema de autenticação complexo (login/senha) no MVP, pois o uso é estritamente pessoal. A interface web pode ser protegida apenas por uma variável de ambiente estática (uma senha simples de acesso) para evitar que bots ou curiosos na internet manipulem os alertas.
