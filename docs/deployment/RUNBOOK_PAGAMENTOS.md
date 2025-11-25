# 🆘 Runbook - Incidentes no Fluxo de Pagamentos

> **Contexto**: Aplicável ao fluxo automatizado descrito em `docs/FINANCEIRO_AUTOMATICO.md`. Use este runbook para diagnosticar e mitigar falhas envolvendo reservas concluídas, pagamentos no gateway e distribuição de rewards.

## 1. Matriz de Detecção

| Alerta | Fonte | SLO | Responsável |
| --- | --- | --- | --- |
| `payments.created` sem confirmação em 5 min | Prometheus (métrica `payment_settlement_duration`) | 99% das liquidações < 5 min | Backend On-Call |
| Falha de assinatura no gateway | Loki (consulta `service=gateway severity=error`) | 0 incidentes críticos/dia | Gateway On-Call |
| Worker `reward-cron` parado > 30 min | Healthcheck PagerDuty | Execução a cada 6 h | DevOps |
| Desktop sem enviar métricas por 10 min | Monitoring dashboard | 95% das reservas com heartbeat | Desktop/Field Ops |

## 2. Checklist Geral

1. Confirmar horário e ambiente (staging vs production).
2. Bloquear novas execuções se houver risco de pagamentos duplicados (`auto_pay_enabled = false`).
3. Coletar IDs afetados: `reservationId`, `paymentId`, `providerAddress`.
4. Checar status em `payments` e `reward_history` antes de qualquer ação manual.

## 3. Playbooks Específicos

### 3.1 Pagamento Pendura (status `pending` > SLA)

1. `SELECT * FROM payments WHERE status='pending' ORDER BY created_at DESC LIMIT 5;`
2. Verificar fila `payments:pending` (BullMQ / Redis Stream) com `XINFO STREAM payments:pending`.
3. No gateway, consultar logs pela `paymentId` e garantir chegada do evento.
4. Se evento não chegou:
   - Rodar `npm run worker:payments` (backend) manualmente.
   - Reenfileirar com `node scripts/requeue-payment.js <paymentId>`.
5. Se evento chegou mas falhou a transação:
   - Conferir saldo da carteira da plataforma (via `hardhat console` ou RPC).
   - Validar `treasury_address` e `provider_address`.
   - Reprocessar com `POST /api/payments/:id/retry` (endpoint admin).
6. Após confirmação, monitorar `payments.status=confirmed` e `usage_records.status=paid`.

### 3.2 Falha de Assinatura / Tx revertida

1. Log detalhado no gateway deve conter `txHash` ou motivo de erro.
2. Revisar nonce atual da carteira (`eth_getTransactionCount`). Ajustar se múltiplas concorrências.
3. Caso erro seja `insufficient funds`, transferir fundos e reprocessar.
4. Se contrato alvo falhou, executar `hardhat verify <tx data>` para reproduzir.
5. Documentar no ticket e anexar `txHash`.

### 3.3 Rewards não distribuídos

1. Conferir job `reward-cron` (scheduler). Rodar `npm run worker:rewards` manualmente.
2. Checar tabela `reward_history` e última execução.
3. Validar se há saldo disponível no contrato `RewardDistribution`.
4. Em caso de falta de saldo, transferir tokens para o contrato e reexecutar.

### 3.4 Monitoramento não registra uso

1. Desktop logs → buscar `reservationId`.
2. API `GET /api/monitoring/usage/:reservationId` para conferir histórico.
3. Se inexistente, verificar `CONNECTION_TOKEN` e handshakes com gateway.
4. Ativar fallback: desktop envia payloads pendentes novamente.

## 4. Comunicação & Escalada

1. **Gravidade**
   - Sev1: pagamentos em produção sem liquidar > 30 min ou falha generalizada.
   - Sev2: atraso parcial (>3 provedores impactados).
   - Sev3: issue isolada.
2. **Fluxo**
   - Abrir ticket no `status/INCIDENTES.md` + canal `#incident-payments`.
   - Atualizar a cada 30 min até resolver.
   - Após resolução, registrar RCA em `status/POSTMORTEMS/<data>-pagamentos.md`.

## 5. Tarefas Pós-Incidente

- Reativar `auto_pay_enabled` se tiver sido desativado.
- Validar consistência financeira (somatórios `providerShare` vs blockchain explorer).
- Rodar testes automatizados (`npm run test payments`).
- Atualizar `docs/FINANCEIRO_AUTOMATICO.md` caso o procedimento permanente mude.

## 6. Referências

- `docs/FINANCEIRO_AUTOMATICO.md` – fluxo completo.
- `docs/PLANO_EXECUCAO_FINAL.md` – prioridades e responsáveis.
- `backend/src/services/payment.service.ts`, `reward.service.ts`.
- Dashboards Prometheus/Grafana “Payment Automation”.
