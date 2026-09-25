// Web Audio API Synthesizer for notifications
// Zero external asset downloads, zero network bandwidth, zero 404 risks.

const SOUND_STORAGE_KEY = 'iwillmedia_notification_sound_enabled'

let audioCtx: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
    if (AudioContextClass) {
      audioCtx = new AudioContextClass()
    }
  }
  return audioCtx
}

// Automatically unlock AudioContext on first user interaction (browser autoplay compliance)
if (typeof window !== 'undefined') {
  const unlockAudio = () => {
    const ctx = getAudioContext()
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {})
    }
    window.removeEventListener('click', unlockAudio)
    window.removeEventListener('keydown', unlockAudio)
    window.removeEventListener('touchstart', unlockAudio)
  }

  window.addEventListener('click', unlockAudio, { passive: true })
  window.addEventListener('keydown', unlockAudio, { passive: true })
  window.addEventListener('touchstart', unlockAudio, { passive: true })
}

/**
 * Check if notification sounds are enabled in user preferences
 */
export function isNotificationSoundEnabled(): boolean {
  if (typeof window === 'undefined') return true
  const saved = localStorage.getItem(SOUND_STORAGE_KEY)
  return saved === null ? true : saved === 'true'
}

/**
 * Toggle or set notification sound preference
 */
export function setNotificationSoundEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(SOUND_STORAGE_KEY, enabled ? 'true' : 'false')
  window.dispatchEvent(new CustomEvent('notification-sound-toggled', { detail: enabled }))
}

/**
 * Plays a pleasant, professional harmonic notification chime (D5 -> A5)
 * Synthesized completely client-side in ~350ms.
 */
export function playNotificationSound(): void {
  if (!isNotificationSoundEnabled()) return

  try {
    const ctx = getAudioContext()
    if (!ctx) return

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {})
    }

    const now = ctx.currentTime

    // --- Master Gain for volume envelope ---
    const masterGain = ctx.createGain()
    masterGain.gain.setValueAtTime(0.2, now)
    masterGain.connect(ctx.destination)

    // --- Note 1: D5 (587.33 Hz) ---
    const osc1 = ctx.createOscillator()
    const gain1 = ctx.createGain()
    osc1.type = 'sine'
    osc1.frequency.setValueAtTime(587.33, now)

    gain1.gain.setValueAtTime(0.3, now)
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.18)

    osc1.connect(gain1)
    gain1.connect(masterGain)

    osc1.start(now)
    osc1.stop(now + 0.2)

    // --- Note 2: A5 (880 Hz) - Higher harmonic note ---
    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()
    osc2.type = 'triangle' // warmer body
    osc2.frequency.setValueAtTime(880, now + 0.08)

    gain2.gain.setValueAtTime(0.001, now)
    gain2.gain.setValueAtTime(0.4, now + 0.08)
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.35)

    osc2.connect(gain2)
    gain2.connect(masterGain)

    osc2.start(now + 0.08)
    osc2.stop(now + 0.38)
  } catch (err) {
    console.warn('Audio notification playback notice:', err)
  }
}
