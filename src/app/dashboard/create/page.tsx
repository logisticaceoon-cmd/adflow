'use client'
// src/app/dashboard/create/page.tsx — Simplified wizard: AI-powered agency experience
import { useCampaignWizard } from '@/hooks/useCampaignWizard'
import StepBusiness    from '@/components/campaign/StepBusiness'
import StepCampaign    from '@/components/campaign/StepCampaign'
import StepMedia       from '@/components/campaign/StepMedia'
import StepGenerating  from '@/components/campaign/StepGenerating'
import StepPublish     from '@/components/campaign/StepPublish'
import StepDone        from '@/components/campaign/StepDone'
import NoCreditsModal  from '@/components/campaign/NoCreditsModal'

const STEPS = ['Negocio', 'Campaña', 'Material', 'IA', 'Publicar']

export default function CreateCampaignPage() {
  const w = useCampaignWizard()

  // Map effective step to display index (0-based)
  // If business profile exists, step 0 is skipped → display shifts
  const displayStepIdx = w.hasBusinessProfile ? w.step - 1 : w.step
  const displaySteps = w.hasBusinessProfile ? STEPS.slice(1) : STEPS

  // Step 3 (generating) is fullscreen — no header/stepper
  if (w.step === 3) {
    return (
      <div className="max-w-3xl mx-auto">
        <StepGenerating genStep={w.genStep} businessName={w.businessName} />
      </div>
    )
  }

  // Steps 0-2: narrow layout. Step 4 (review): full width for 4 ad cards per row
  const isWide = w.step === 4

  return (
    <div className={isWide ? 'mx-auto' : 'max-w-3xl mx-auto'}>
      {/* Header */}
      <div className="mb-8">
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ds-color-primary)', marginBottom: 8 }}>
          Tu agencia de IA · AdFlow
        </p>
        <h1 style={{ fontFamily: 'var(--font-display), Space Grotesk, sans-serif', fontSize: 32, fontWeight: 800, color: '#fff', marginBottom: 8, letterSpacing: '-0.03em', lineHeight: 1.1 }}>
          Creá tu campaña ✨
        </h1>
        <p style={{ fontSize: 14, color: 'var(--ds-text-secondary)', maxWidth: 500, lineHeight: 1.55 }}>
          Vos ponés lo mínimo, la IA hace el resto. Estrategia, targeting, copies, presupuesto — todo resuelto.
        </p>
      </div>

      {/* Steps indicator — only show for steps 0-2 and 4-5 */}
      {w.step !== 3 && w.step <= 4 && (
        <div className="flex items-center mb-10">
          {displaySteps.map((label, i) => {
            const done   = i < displayStepIdx
            const active = i === displayStepIdx
            return (
              <div key={i} className="flex items-center flex-1">
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                    style={{
                      background: done
                        ? 'var(--ds-color-success-soft)'
                        : active
                          ? 'var(--ds-color-primary-soft)'
                          : 'var(--ds-bg-elevated)',
                      border: done
                        ? '1px solid var(--ds-color-success-border)'
                        : active
                          ? '1px solid var(--ds-color-primary-border)'
                          : '1px solid var(--ds-card-border)',
                      color: done
                        ? 'var(--ds-color-success)'
                        : active
                          ? 'var(--ds-color-primary)'
                          : 'var(--ds-text-muted)',
                      fontSize: 11,
                    }}
                  >
                    {done ? '✓' : i + 1}
                  </div>
                  <span style={{
                    fontSize: 11,
                    color: active ? 'var(--ds-text-primary)' : done ? 'var(--ds-text-secondary)' : 'var(--ds-text-muted)',
                    fontWeight: active ? 600 : 500,
                  }}>
                    {label}
                  </span>
                </div>
                {i < displaySteps.length - 1 && (
                  <div className="flex-1 mx-2 h-px" style={{
                    background: i < displayStepIdx ? 'var(--ds-color-success)' : 'var(--ds-card-border)',
                  }} />
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Step 0: Business */}
      {w.step === 0 && (
        <StepBusiness
          form={w.form}
          setField={w.setField}
          error={w.error}
          onNext={w.nextFromBusiness}
        />
      )}

      {/* Step 1: Campaign (promo + objective + budget + duration) */}
      {w.step === 1 && (
        <StepCampaign
          form={w.form}
          setField={w.setField}
          currSymbol={w.currSymbol}
          budgetUSD={w.budgetUSD}
          error={w.error}
          onNext={w.nextFromCampaign}
        />
      )}

      {/* Step 2: Media */}
      {w.step === 2 && (
        <StepMedia
          mediaFiles={w.form.mediaFiles}
          mediaPreviews={w.form.mediaPreviews}
          onFilesAdded={w.processFiles}
          onRemoveMedia={w.removeMedia}
          error={w.error}
          onBack={() => w.setStep(1)}
          onGenerate={w.nextFromMedia}
        />
      )}

      {/* Step 4: Review & Publish */}
      {w.step === 4 && (
        <StepPublish
          aiStrategy={w.aiStrategy}
          currSymbol={w.currSymbol}
          dailyBudget={w.form.daily_budget}
          mediaPreviews={w.form.mediaPreviews}
          editedCopies={w.editedCopies}
          onPatchAd={w.patchAd}
          isPublishing={w.isPublishing}
          publishError={w.publishError}
          savingDraft={w.savingDraft}
          onAdjust={() => w.setStep(2)}
          onSaveDraft={w.handleSaveDraft}
          onPublish={w.handlePublishToMeta}
        />
      )}

      {/* Step 5: Done */}
      {w.step === 5 && (
        <StepDone
          publishedOk={w.publishedOk}
          metaCampaignId={w.metaCampaignId}
          savedCampaignId={w.savedCampaignId}
          onViewCampaign={() => w.router.push(`/dashboard/campaigns/${w.savedCampaignId}`)}
          onViewAll={() => w.router.push('/dashboard/campaigns')}
          onCreateAnother={w.resetWizard}
        />
      )}

      {/* No credits modal */}
      <NoCreditsModal
        open={w.noCreditsModal}
        onClose={() => w.setNoCreditsModal(false)}
        onUpgrade={() => w.router.push('/dashboard/settings')}
      />
    </div>
  )
}
