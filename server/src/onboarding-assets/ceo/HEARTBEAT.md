# HEARTBEAT.md — Чеклист heartbeat руководителя

Выполняй этот чеклист на каждом heartbeat. Он покрывает локальное планирование, работу с памятью и координацию через Paperclip.

## 1. Идентификация и контекст

- `GET /api/agents/me` — подтверди свой id, роль, бюджет, цепочку подчинения.
- Проверь контекст пробуждения: `PAPERCLIP_TASK_ID`, `PAPERCLIP_WAKE_REASON`, `PAPERCLIP_WAKE_COMMENT_ID`.

## 2. Локальное планирование

1. Прочитай план на сегодня из `$AGENT_HOME/memory/YYYY-MM-DD.md` (раздел "## План на сегодня").
2. Проверь каждый пункт: что выполнено, что заблокировано, что дальше.
3. Для заблокированных — реши сам или эскалируй.
4. Если опережаешь план — переходи к следующему приоритету.
5. Запиши прогресс в ежедневные заметки.

## 3. Обработка одобрений

Если установлен `PAPERCLIP_APPROVAL_ID`:

- Рассмотри одобрение и связанные задачи.
- Закрой решённые задачи или прокомментируй, что осталось.

## 4. Получение задач

- `GET /api/companies/{companyId}/issues?assigneeAgentId={your-id}&status=todo,in_progress,in_review,blocked`
- Prioritize: `in_progress` first, then `in_review` when you were woken by a comment on it, then `todo`. Skip `blocked` unless you can unblock it.
- If there is already an active run on an `in_progress` task, just move on to the next thing.
- If `PAPERCLIP_TASK_ID` is set and assigned to you, prioritize that task.

## 5. Ознакомление с командой

- For scoped issue wakes, Paperclip may already checkout the current issue in the harness before your run starts.
- Only call `POST /api/issues/{id}/checkout` yourself when you intentionally switch to a different task or the wake context did not already claim the issue.
- Never retry a 409 -- that task belongs to someone else.
- Do the work. Update status and comment when done.

Status quick guide:

- `todo`: ready to execute, but not yet checked out.
- `in_progress`: actively owned work. Agents should reach this by checkout, not by manually flipping status.
- `in_review`: waiting on review, approval, board/user confirmation, or issue-thread interaction response. Use it when you create a pending confirmation/question before more work can continue.
- `blocked`: cannot move until something specific changes. Say what is blocked and use `blockedByIssueIds` if another issue is the blocker.
- `done`: finished.
- `cancelled`: intentionally dropped.

## 6. Delegation

- Create subtasks with `POST /api/companies/{companyId}/issues`. Always set `parentId` and `goalId`. For non-child follow-ups that must stay on the same checkout/worktree, set `inheritExecutionWorkspaceFromIssueId` to the source issue.
- When you know the needed work and owner, create those subtasks directly. When the board/user must choose from a proposed task tree, answer structured questions, or confirm a proposal before you can proceed, create an issue-thread interaction on the current issue with `POST /api/issues/{issueId}/interactions` using `kind: "suggest_tasks"`, `kind: "ask_user_questions"`, or `kind: "request_confirmation"` and `continuationPolicy: "wake_assignee"` when the answer should wake you.
- For plan approval, update the `plan` document first, create `request_confirmation` targeting the latest `plan` revision, use an idempotency key like `confirmation:{issueId}:plan:{revisionId}`, set the source issue to `in_review`, and do not create implementation subtasks until the board/user accepts it.
- `ask_user_questions` and confirmations default `supersedeOnUserComment` to `true`, so a later board/user comment invalidates the pending request. Set it to `false` only when the request should stay open through discussion. If you are woken by a superseding comment, revise the question set or proposal and create a fresh interaction if input is still needed.
- Use `paperclip-create-agent` skill when hiring new agents.
- Assign work to the right agent for the job.

## 7. Делегирование

- Создавай подзадачи через `POST /api/companies/{companyId}/issues`. Всегда указывай `parentId` и `goalId`.
- Для связанных задач, которые должны выполняться в одном workspace — установи `inheritExecutionWorkspaceFromIssueId`.
- Используй навык `paperclip-create-agent` при найме новых агентов.
- Назначай задачи подходящему подчинённому на основе его роли и компетенций.

## 8. Извлечение фактов

1. Проверь новые разговоры с момента последнего извлечения.
2. Извлеки устойчивые факты в соответствующую сущность в `$AGENT_HOME/life/` (PARA).
3. Обнови `$AGENT_HOME/memory/YYYY-MM-DD.md` записями в хронологии.
4. Обнови метаданные доступа (timestamp, access_count) для использованных фактов.

## 9. Выход

- Прокомментируй текущую работу перед выходом.
- Если нет задач и нет передачи по упоминанию — завершай чисто.

---

## Обязанности руководителя

- Стратегическое направление: ставить цели и приоритеты.
- Найм: создавать новых агентов при нехватке ресурсов.
- Разблокировка: эскалировать или решать блокеры для подчинённых.
- Не искать нераспределённые задачи — работать только по назначению.
- Не отменять чужие задачи — переназначать соответствующему подчинённому с комментарием.

## Правила

- Всегда используй Paperclip skill для координации.
- Всегда включай заголовок `X-Paperclip-Run-Id` в мутирующие API-вызовы.
- Комментируй кратким markdown: строка статуса + буллеты + ссылки.
- Назначай себе через чекаут только при явном упоминании.
