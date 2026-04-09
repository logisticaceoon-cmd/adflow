// src/app/dashboard/automation/page.tsx
// Automation control room: pending executions + rule list + history.
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SectionHeader from '@/components/ui/SectionHeader'
import Badge from '@/components/ui/Badge'
import { RuleToggle, ApproveRejectBtns } from '@/components/dashboard/AutomationControls'
import { createDefaultRules } from '@/lib/automation-engine'
import { DIAGNOSTIC_RULES, type DiagnosticType } from '@/lib/diagnostic-rules'

// Helpers to pretty-print rule conditions
function formatConditionValue(metric: string, value: number): string {
  if (metric === 'roas') return `${value}x`
  if (metric === 'ctr') return `${value}%`
  if (metric === 'cpa' || metric === 'spend') return `$${value.toLocaleString('es')}`
  return String(value)
}

function formatCondition(cond: any): string {
  if (!cond || !cond.metric) return ''
  const op: Record<string, string> = { gt: '>', lt: '<', gte: '≥', lte: '≤', eq: '=' }
  const periodLabel: Record<string, string> = { last_1d: '1 día', last_3d: '3 días', last_7d: '7 días' }
  return `${cond.metric.toUpperCase()} ${op[cond.operator] || cond.operator} ${formatConditionValue(cond.metric, cond.value)} en los últimos ${periodLabel[cond.period] || cond.period}`
}

function formatAction(action: any): string {
  if (!action || !action.type) return ''
  if (action.type === 'scale_budget_pct') return `Escalar presupuesto ${action.value >= 0 ? '+' : ''}${action.value}%`
  if (action.type === 'scale_budget_abs') return `Ajustar presupuesto a $${action.value}`
  if (action.type === 'pause_campaign') return 'Pausar campaña'
  if (action.type === 'send_alert') return 'Enviar alerta'
  if (action.type === 'suggest_action') return 'Sugerir acción'
  return action.type
}

function statusMeta(status: string): { label: string; variant: 'success' | 'warning' | 'danger' | 'info' | 'default' } {
  switch (status) {
    case 'pending':  return { label: 'Pendiente', variant: 'info' }
    case 'executed': return { label: 'Ejecutada', variant: 'success' }
    case 'failed':   return { label: 'Falló',     variant: 'danger' }
    case 'rejected': return { label: 'Rechazada', variant: 'default' }
    case 'expired':  return { label: 'Expirada',  variant: 'default' }
    case 'approved': return { label: 'Aprobada',  variant: 'success' }
    default:         return { label: status,      variant: 'default' }
  }
}

export default async function AutomationPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Seed default rules on first visit
  try { await createDefaultRules(user.id) } catch { /* ignore */ }

  const [rulesRes, pendingRes, historyRes] = await Promise.all([
    supabase
      .from('automation_rules')
      .select('*')
      .eq('user_id', user.id)
      .order('priority', { ascending: true })
      .order('created_at', { ascending: false }),
    supabase
      .from('automation_executions')
      .select('*, automation_rules(name, rule_type, conditions, actions)')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .order('triggered_at', { ascending: false }),
    supabase
      .from('automation_executions')
      .select('*, automation_rules(name, rule_type)')
      .eq('user_id', user.id)
      .in('status', ['executed', 'failed', 'rejected', 'expired'])
      .order('triggered_at', { ascending: false })
      .limit(10),
  ])

  const rules = (rulesRes.data || []) as Array<any>
  const pending = (pendingRes.data || []) as Array<any>
  const history = (historyRes.data || []) as Array<any>

  return (
    <div>
      {/* Header */}
      <div className="module-enter module-enter-1" style={{ marginBottom: 32 }}>
        <p style={{
          fontSize: 10, fontWeight: 600, letterSpacing: '0.12em',
          textTransform: 'uppercase', color: 'var(--ds-text-label)',
          marginBottom: 10,
        }}>
          Control · AdFlow
        </p>
        <h1 style={{
          fontFamily: 'Syne, system-ui, sans-serif',
          fontSize: 28, fontWeight: 600, letterSpacing: '-0.02em',
          color: 'var(--ds-text-primary)', marginBottom: 10,
        }}>
          ⚡ Automatización
        </h1>
        <p style={{ fontSize: 14, color: 'var(--ds-text-secondary)', maxWidth: 680, lineHeight: 1.55 }}>
          Reglas que el sistema evalúa todos los días contra las métricas reales de tus campañas.
          Cuando se cumplen las condiciones, el sistema genera una sugerencia que vos aprobás o rechazás.
        </p>
      </div>

      {/* ─── PENDING EXECUTIONS ─────────────────────────────────── */}
      {pending.length > 0 && (
        <div className="module-enter module-enter-2" style={{ marginBottom: 40 }}>
          <SectionHeader
            title={`Pendientes de aprobación (${pending.length})`}
            subtitle="El sistema detectó oportunidades en tus campañas. Revisá cada una."
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {pending.map((e: any) => {
              const rule = e.automation_rules
              const snapshot = (e.decision_snapshot || {}) as Record<string, number>
              return (
                <div key={e.id} style={{
                  padding: 'var(--ds-space-lg)',
                  borderRadius: 'var(--ds-card-radius)',
                  background: 'var(--ds-card-bg)',
                  border: '1px solid var(--ds-color-primary-border)',
                  borderLeft: '3px solid var(--ds-color-primary)',
                  backdropFilter: 'blur(var(--ds-card-blur)) saturate(1.2)',
                  WebkitBackdropFilter: 'blur(var(--ds-card-blur)) saturate(1.2)',
                  boxShadow: 'var(--ds-shadow-md)',
                }}>
                  <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 280 }}>
                      <p style={{
                        fontSize: 10, fontWeight: 600, color: 'var(--ds-color-primary)',
                        textTransform: 'uppercase', letterSpacing: '0.10em', marginBottom: 6,
                      }}>
                        💡 Sugerencia automática
                      </p>
                      <h3 style={{
                        fontFamily: 'Syne, sans-serif',
                        fontSize: 16, fontWeight: 600,
                        color: 'var(--ds-text-primary)', marginBottom: 4,
                      }}>
                        {rule?.name || 'Regla'}
                      </h3>
                      <p style={{ fontSize: 13, color: 'var(--ds-text-secondary)', lineHeight: 1.5, marginBottom: 10 }}>
                        Campaña afectada: <strong style={{ color: 'var(--ds-text-primary)' }}>{e.entity_name}</strong>
                      </p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginBottom: 10 }}>
                        <div>
                          <p style={{ fontSize: 9, color: 'var(--ds-text-label)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>Condición</p>
                          <p style={{ fontSize: 12, color: 'var(--ds-text-primary)' }}>{formatCondition(rule?.conditions)}</p>
                        </div>
                        <div>
                          <p style={{ fontSize: 9, color: 'var(--ds-text-label)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>Acción propuesta</p>
                          <p style={{ fontSize: 12, color: 'var(--ds-color-primary)', fontWeight: 600 }}>{formatAction(rule?.actions)}</p>
                        </div>
                      </div>
                      {/* Snapshot of metrics that triggered the rule */}
                      <div style={{
                        padding: '10px 12px', borderRadius: 10,
                        background: 'var(--ds-bg-elevated)',
                        border: '1px solid var(--ds-card-border)',
                        display: 'flex', gap: 14, flexWrap: 'wrap',
                      }}>
                        {[
                          { l: 'Spend',     v: `$${(snapshot.spend || 0).toFixed(0)}` },
                          { l: 'ROAS',      v: (snapshot.roas ?? 0) > 0 ? `${(snapshot.roas ?? 0).toFixed(1)}x` : '—' },
                          { l: 'Compras',   v: String(snapshot.purchases || 0) },
                          { l: 'CPA',       v: (snapshot.cpa ?? 0) > 0 ? `$${(snapshot.cpa ?? 0).toFixed(0)}` : '—' },
                          { l: 'CTR',       v: (snapshot.ctr ?? 0) > 0 ? `${(snapshot.ctr ?? 0).toFixed(2)}%` : '—' },
                        ].map(m => (
                          <div key={m.l}>
                            <p style={{ fontSize: 9, color: 'var(--ds-text-label)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{m.l}</p>
                            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--ds-text-primary)' }}>{m.v}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div style={{ flexShrink: 0, alignSelf: 'center' }}>
                      <ApproveRejectBtns executionId={e.id} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ─── USER RULES ─────────────────────────────────────────── */}
      <div className="module-enter module-enter-3" style={{ marginBottom: 40 }}>
        <SectionHeader
          title="Tus reglas de automatización"
          subtitle="Activá o desactivá las reglas que querés que el sistema evalúe todos los días"
        />
        {rules.length === 0 ? (
          <div style={{
            padding: 32,
            borderRadius: 'var(--ds-card-radius)',
            background: 'var(--ds-card-bg)',
            border: '1px dashed var(--ds-card-border)',
            textAlign: 'center',
            color: 'var(--ds-text-secondary)',
            fontSize: 13,
          }}>
            El sistema creará reglas sugeridas automáticamente la próxima vez que se sincronicen tus campañas.
          </div>
        ) : (
          <div className="ds-grid-2">
            {rules.map((rule: any) => (
              <div key={rule.id} style={{
                padding: 'var(--ds-space-lg)',
                borderRadius: 'var(--ds-card-radius)',
                background: 'var(--ds-card-bg)',
                border: '1px solid var(--ds-card-border)',
                backdropFilter: 'blur(var(--ds-card-blur)) saturate(1.2)',
                WebkitBackdropFilter: 'blur(var(--ds-card-blur)) saturate(1.2)',
                boxShadow: 'var(--ds-shadow-sm)',
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                      <h3 style={{
                        fontFamily: 'Syne, sans-serif',
                        fontSize: 14, fontWeight: 600,
                        color: 'var(--ds-text-primary)',
                      }}>
                        {rule.name}
                      </h3>
                      <Badge variant={rule.source === 'system' ? 'info' : 'default'} size="sm">
                        {rule.source === 'system' ? 'Sistema' : 'Manual'}
                      </Badge>
                    </div>
                    {rule.description && (
                      <p style={{ fontSize: 12, color: 'var(--ds-text-secondary)', lineHeight: 1.5, marginBottom: 10 }}>
                        {rule.description}
                      </p>
                    )}
                  </div>
                  <RuleToggle ruleId={rule.id} initialEnabled={rule.is_enabled} />
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr',
                  gap: 8,
                  padding: 12,
                  borderRadius: 'var(--ds-card-radius-sm)',
                  background: 'var(--ds-bg-elevated)',
                  border: '1px solid var(--ds-card-border)',
                }}>
                  <div>
                    <p style={{ fontSize: 9, fontWeight: 600, color: 'var(--ds-text-label)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>Si</p>
                    <p style={{ fontSize: 11, color: 'var(--ds-text-primary)' }}>{formatCondition(rule.conditions)}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: 9, fontWeight: 600, color: 'var(--ds-text-label)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>Entonces</p>
                    <p style={{ fontSize: 11, color: 'var(--ds-color-primary)', fontWeight: 600 }}>{formatAction(rule.actions)}</p>
                  </div>
                </div>

                <div style={{
                  marginTop: 10,
                  fontSize: 10,
                  color: 'var(--ds-text-muted)',
                  display: 'flex', gap: 14, flexWrap: 'wrap',
                }}>
                  <span>Cooldown: {rule.cooldown_hours}h</span>
                  {rule.trigger_count > 0 && <span>Disparada {rule.trigger_count} veces</span>}
                  {rule.last_triggered_at && (
                    <span>Última: {new Date(rule.last_triggered_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── HISTORY ─────────────────────────────────────────────── */}
      <div className="module-enter module-enter-4">
        <SectionHeader
          title="Historial de ejecuciones"
          subtitle="Últimas 10 ejecuciones de automatizaciones"
        />
        {history.length === 0 ? (
          <p style={{ fontSize: 12, color: 'var(--ds-text-muted)' }}>
            Todavía no hay ejecuciones. Se irán registrando aquí a medida que las reglas activas se disparen.
          </p>
        ) : (
          <div style={{
            padding: 'var(--ds-space-lg)',
            borderRadius: 'var(--ds-card-radius)',
            background: 'var(--ds-card-bg)',
            border: '1px solid var(--ds-card-border)',
            backdropFilter: 'blur(var(--ds-card-blur)) saturate(1.2)',
            WebkitBackdropFilter: 'blur(var(--ds-card-blur)) saturate(1.2)',
            boxShadow: 'var(--ds-shadow-sm)',
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {history.map((e: any, i: number) => {
                const meta = statusMeta(e.status)
                return (
                  <div key={e.id} style={{
                    display: 'flex', gap: 14, alignItems: 'flex-start',
                    paddingBottom: i < history.length - 1 ? 12 : 0,
                    borderBottom: i < history.length - 1 ? '1px solid var(--ds-card-border)' : 'none',
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ds-text-primary)' }}>
                          {e.automation_rules?.name || 'Regla'}
                        </span>
                        <Badge variant={meta.variant} size="sm">{meta.label}</Badge>
                      </div>
                      <p style={{ fontSize: 11, color: 'var(--ds-text-secondary)', marginBottom: 2 }}>
                        {e.entity_name}
                      </p>
                      {e.result_message && (
                        <p style={{ fontSize: 11, color: 'var(--ds-text-muted)', fontStyle: 'italic' }}>
                          {e.result_message}
                        </p>
                      )}
                    </div>
                    <p style={{ fontSize: 10, color: 'var(--ds-text-muted)', flexShrink: 0 }}>
                      {new Date(e.triggered_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* ─── EXPERT RULES — the 17 rules from the V1.0 workbook ─── */}
      <div className="module-enter module-enter-5" style={{ marginTop: 40 }}>
        <SectionHeader
          title="Reglas expertas del sistema"
          subtitle="17 reglas basadas en el workbook de evaluación. El sistema las usa automáticamente para diagnosticar tus campañas."
        />

        <div className="ds-grid-2">
          {DIAGNOSTIC_RULES.map(r => {
            const typeConfig: Record<DiagnosticType, { badge: 'success' | 'warning' | 'danger' | 'info'; icon: string; label: string }> = {
              Escalar:   { badge: 'success', icon: '📈', label: 'Escalar' },
              Optimizar: { badge: 'warning', icon: '🔧', label: 'Optimizar' },
              Pausar:    { badge: 'danger',  icon: '⏸',  label: 'Pausar' },
              Observar:  { badge: 'info',    icon: '👁', label: 'Observar' },
            }
            const cfg = typeConfig[r.type]
            return (
              <div key={r.id} style={{
                padding: 'var(--ds-space-lg)',
                borderRadius: 'var(--ds-card-radius)',
                background: 'var(--ds-card-bg)',
                border: '1px solid var(--ds-card-border)',
                backdropFilter: 'blur(var(--ds-card-blur)) saturate(1.2)',
                WebkitBackdropFilter: 'blur(var(--ds-card-blur)) saturate(1.2)',
                boxShadow: 'var(--ds-shadow-sm)',
              }}>
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  marginBottom: 10, gap: 10, flexWrap: 'wrap',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <code style={{
                      fontSize: 11, fontWeight: 700,
                      padding: '3px 10px', borderRadius: 'var(--ds-card-radius-sm)',
                      background: 'var(--ds-bg-elevated)',
                      color: 'var(--ds-color-primary)',
                      border: '1px solid var(--ds-card-border)',
                    }}>
                      {r.id}
                    </code>
                    <span style={{
                      fontSize: 10, fontWeight: 600, color: 'var(--ds-text-muted)',
                      textTransform: 'uppercase', letterSpacing: '0.08em',
                    }}>
                      Prioridad {r.priority}
                    </span>
                  </div>
                  <Badge variant={cfg.badge} size="sm">
                    {cfg.icon} {cfg.label}
                  </Badge>
                </div>

                <p style={{
                  fontFamily: 'Syne, sans-serif',
                  fontSize: 13, fontWeight: 600,
                  color: 'var(--ds-text-primary)',
                  marginBottom: 8, lineHeight: 1.4,
                }}>
                  {r.label}
                </p>

                <div style={{
                  padding: 10,
                  background: 'var(--ds-bg-elevated)',
                  border: '1px solid var(--ds-card-border)',
                  borderRadius: 'var(--ds-card-radius-sm)',
                  fontSize: 10,
                  color: 'var(--ds-text-muted)',
                  display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
                }}>
                  <span style={{ fontWeight: 600, color: 'var(--ds-text-secondary)' }}>Template:</span>
                  <code style={{ color: 'var(--ds-color-primary)' }}>{r.templateId}</code>
                </div>
              </div>
            )
          })}
        </div>

        <p style={{
          fontSize: 11, color: 'var(--ds-text-muted)',
          marginTop: 14, fontStyle: 'italic', textAlign: 'center',
        }}>
          Estas reglas son read-only — el sistema las ejecuta automáticamente en cada análisis de campaña.
          Las reglas configurables (con toggles de ejecución) están arriba.
        </p>
      </div>
    </div>
  )
}
