# 💸 Playbook Financeiro Automatizado

## 1. Visão Geral do Fluxo

```
Reserva confirmada → Uso monitorado → Registro de uso → Pagamento ↔ Gateway → Split Provider/Plataforma → Reward semanal
```

| Etapa | Responsável | Saída principal |
| --- | --- | --- |
| Reserva (`POST /api/marketplace/reserve`) | Backend | `reservations` + TTL |
| Uso (monitoramento desktop) | App Desktop → Monitoring API | Métricas periódicas (CPU, storage, bandwidth) |
| Conclusão (`/complete-reservation/:id`) | Consumer ou automação | `usage_records` + custo calculado |
| Pagamento (`paymentService.processPayment`) | Backend → Gateway | Registro em `payments` (status `pending`) |
| Assinatura/transação | Gateway Service | `txHash` + transferência on-chain |
| Split 95/5 (default) | Contrato ou gateway | `providerShare`, `platformFee` |
| Reward semanal (`rewardService.distributeReward`) | Worker backend | Entrada em `reward_history` |

## 2. Configuração Obrigatória

1. **Contratos implantados**
   - Executar `scripts/setup-initial.ps1` ou `contracts/npm run deploy:local`.
   - Atualizar `backend/src/config/addresses.<env>.json` e variáveis `RESOURCE_PROVIDER_CONTRACT_ADDRESS`, `REWARD_DISTRIBUTION_CONTRACT_ADDRESS`, `TOKEN_CONTRACT_ADDRESS`.
2. **Secrets do gateway**
   - Armazenar carteira da plataforma e chave privada no painel admin (recomendado usar vault/Keytar no desktop admin).
   - Definir `GATEWAY_PUBLIC_URL`, `BACKEND_API_URL` e `CONNECTION_TOKEN_SECRET`.
3. **Parâmetros financeiros**
   - Criar tabela `platform_settings` (ou JSON em Redis) contendo `platform_fee_percent`, `treasury_address`, `auto_pay_enabled`, `min_payout`.
   - Atualizar `reward.service.ts` para ler o percentual dinamicamente.
4. **Jobs e webhooks**
   - Worker `npm run dev:worker` executando `rewardService.distributeReward` a cada N horas.
   - Webhook/queue `payments:pending` para o gateway consumir e assinar transações.

## 3. Fluxo de Pagamento Detalhado

1. **Reserva & Escrow (opcional)**
   - Backend calcula depósito estimado (capacity × price). Se escrow estiver habilitado, consumer transfere tokens para contrato `ResourceEscrow` (ver proposta em `docs/SISTEMA_PAGAMENTO_AUTOMATICO.md`).
2. **Monitoramento de uso**
   - Desktop envia POST `/api/monitoring/report-usage` com `{ reservationId, usage, metrics, timestamp }`.
   - Backend atualiza `provider_resources.used_capacity` e mantém histórico para auditoria.
3. **Conclusão automática**
   - Scheduler identifica reservas expiradas ou consumo completo e chama `usageService.completeReservation`.
   - Serviço calcula `cost = amount × pricePerUnit` e grava `usage_records`.
4. **Criação do pagamento**
   - `paymentService.processPayment` grava registro `pending` com `amount`, `provider_address`, `platform_fee_percent` e dispara evento (`payments.created`).
5. **Gateway assina e executa**
   - Ao consumir o evento, o gateway:
     1. Calcula `providerShare = amount × (1 - fee)`.
     2. Executa transação on-chain ou chama contrato para split automático.
     3. Retorna `txHash` via `PATCH /api/payments/:id/confirm`.
6. **Confirmação & logging**
   - Backend marca `payments.status = confirmed`, atualiza `usage_records.status`, grava `platform_fee` em `reward_history` e publica métricas (OpenTelemetry).

## 4. Painel Administrativo (Requisitos)

- **Campos**: fee padrão, overrides por provider, carteira da plataforma, modos `auto_pay`/`manual`, limites de saque.
- **Visualizações**: lista de pagamentos pendentes/confirmados, recompensas por provider, status dos túneis do gateway, alertas de falha de contrato.
- **Ações**: disparar `distributeReward`, forçar reprocessamento de pagamento, rotacionar chaves.

## 5. Checklist "Tudo Automático"

- [ ] Contratos implantados e endereços configurados.
- [ ] Worker/cron ativo para rewards e expiração de reservas.
- [ ] Painel admin com fee configurável e carteira segura.
- [ ] Evento `payments.created` → gateway em funcionamento.
- [ ] Desktop enviando métricas consistentes (monitoramento validado).
- [ ] Alertas/observabilidade (OpenTelemetry + logs estruturados) habilitados.
- [ ] Documentação atualizada (`docs/FINANCEIRO_AUTOMATICO.md` + `docs/SISTEMA_PAGAMENTO_AUTOMATICO.md`).

> Quando todos os itens acima estiverem verdes, o pagamento passa a ser realmente "hands-off": consumer conclui uso, gateway paga provider, plataforma recolhe o fee e o histórico financeiro fica centralizado.
