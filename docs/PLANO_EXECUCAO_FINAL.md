# 📅 Plano de Execução Integrado (24/11/2025)

## 1. Objetivo
Transformar o fluxo atual — hoje parcialmente manual — em uma operação 100% automatizada, cobrindo backend, gateway, desktop, contratos e monitoramento. Este plano prioriza estabilidade de pagamentos, segurança operacional e visibilidade.

## 2. Prioridades por Horizonte

| Horizonte | Meta | Entregáveis principais |
| --- | --- | --- |
| **D0-D2** | Base pronta | Contratos configurados, filas ativas, monitoramento alinhado |
| **D3-D7** | Pagamentos automáticos | Gateway consumindo `payments.created`, painel admin mínimo |
| **D8-D14** | Operação resiliente | Observabilidade, alertas, runbooks e validação end-to-end em staging |

## 3. Workstreams Detalhados

### 3.1 Backend & Serviços

1. **Configurar contratos e endereços**
   - Rodar deploy (`contracts/npm run deploy:local` ou mainnet equivalente).
   - Atualizar `backend/src/config/addresses.<env>.json` + variáveis `.env` (token, escrow, reward, gateway).
   - Adicionar verificação automática no `bootstrap` para falhar caso algum endereço esteja vazio.
2. **Pagamentos e rewards**
   - Criar `platform_settings` (Postgres) com `platform_fee_percent`, `treasury_address`, `auto_pay_enabled`.
   - Refatorar `payment.service.ts` para ler settings >  cachear em Redis > invalidar via painel.
   - Ajustar `reward.service.ts` para usar mesma fonte de verdade e aceitar `triggerBy` (manual/cron).
3. **Workers e jobs**
   - Ativar fila/evento `payments.created` (BullMQ ou Redis Stream) chamado dentro de `processPayment`.
   - Worker `reward-cron` chamando `distributeReward` a cada 6h; worker `reservation-expirer` para concluir reservas vencidas.
4. **APIs adicionais**
   - `PATCH /api/payments/:id/confirm` (já existente) → garantir schema de validação e logs estruturados.
   - `POST /api/platform/settings` protegido para painel admin.

### 3.2 Gateway Service

1. **Consumo de eventos**
   - Subscriber em `payments.created` com retry exponencial.
   - Validação de carteiras (provider + treasury) antes de assinar transação.
2. **Execução financeira**
   - Implementar split 95/5 (configurável) dentro do contrato ou via duas transferências atômicas.
   - Retornar `txHash`, `gasUsed`, `network` ao backend.
3. **Segurança**
   - Guardar private keys em Keytar/Hashicorp Vault; usar `CONNECTION_TOKEN_SECRET` para autenticar webhooks.
4. **Observabilidade**
   - Exportar métricas (tempo de liquidação, falhas de assinatura) para Prometheus/Grafana.

### 3.3 Desktop App & Monitoramento

1. **Payload único**
   - Garantir envio periódico `{ reservationId, usage, metrics, signature }` conforme `docs/MULTIPLE_RESOURCES_SYSTEM.md`.
2. **Fallback & buffer**
   - Persistir métricas localmente quando offline; reprocessar ao reconectar.
3. **Integração gateway**
   - Dashboard desktop exibe status dos túneis e pagamentos referentes ao host.

### 3.4 Painel Administrativo

1. **MVP Web (Next.js)**
   - Login admin → visão `Pagamentos` (pendente/confirmado), `Rewards`, `Gateway health`.
   - Ações: editar platform fee, habilitar/desabilitar auto-pay, reprocessar pagamento.
2. **Auditoria**
   - Todas as alterações gravadas em `platform_audit_log` com usuário, timestamp, diff.

### 3.5 Observabilidade & Ops

1. **Logging**
   - Padronizar `paymentId`, `reservationId`, `providerAddress` em todos os logs.
   - Enviar para Loki/ELK + alertar em caso de `status=failed` > 3 ocorrências em 30 min.
2. **Tracing**
   - OpenTelemetry ligando backend ↔ gateway ↔ worker; sample rate 20%.
3. **Runbooks**
   - Criar em `docs/deployment/RUNBOOK_PAGAMENTOS.md` cobrindo: chave expirada, transação stuck, fila congestionada.

## 4. Checklists Executáveis

### Antes de habilitar auto-pay
- [ ] `FINANCEIRO_AUTOMATICO.md` seguido e atualizado.
- [ ] Eventos `payments.created` confirmados no Redis.
- [ ] Gateway devolvendo `txHash` em ambiente de teste.
- [ ] Painel admin exibindo status em tempo real.
- [ ] Alertas configurados (Slack/Email) para falhas críticas.

### Go-live em produção
- [ ] Dry-run completo em staging (consumer → pagamento → reward).
- [ ] Aprovação formal do time legal/financeiro sobre split e taxas.
- [ ] Snapshot de configurações salvo em `deployment/DEPLOYMENT_INFO.md`.

## 5. Riscos & Mitigações

| Risco | Impacto | Mitigação |
| --- | --- | --- |
| Chave privada comprometida | Perda financeira | Vault + rotação semanal + permissões mínimas |
| Falha na fila de pagamentos | Pagamentos atrasados | Retry + Dead Letter Queue + alerta PagerDuty |
| Desktop fora do ar | Uso não registrado | Buffer local + reprocessamento + alerta de heartbeats |
| Divergência de fee | Receita incorreta | Fonte única (`platform_settings`) + testes automatizados |

## 6. Próximos Passos

1. Validar deploy de contratos e preencher configurações (responsável: Contracts).
2. Implementar fila/evento de pagamentos e worker no gateway (responsável: Backend/Gateway).
3. Subir painel admin MVP e conectar ao `platform_settings` (responsável: Frontend).
4. Ativar observabilidade completa e documentar runbooks (responsável: DevOps).

> Ao concluir as quatro frentes acima, o sistema estará pronto para operar pagamentos automáticos, split provider/plataforma e recompensas semanais sem intervenções manuais.
