// Sound, speech, vibration and system notifications, ported from the legacy script.
// Every function that makes noise takes the settings object so the sound/vibration toggles apply.

let audioCtx = null;
let activeUtterance = null;
let audioUnlocked = false;

export function getAudioContext() {
  try {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) audioCtx = new AudioContextClass();
    }
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  } catch {
    return null;
  }
}

// Must run from a user gesture (iOS). Opens AudioContext and the speech queue.
export function unlockAudioAndSpeech() {
  try {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') ctx.resume();
    if ('speechSynthesis' in window && window.speechSynthesis.paused) window.speechSynthesis.resume();
    if (!audioUnlocked) {
      audioUnlocked = true;
      try {
        const buf = ctx ? ctx.createBuffer(1, 1, 22050) : null;
        if (buf && ctx) {
          const src = ctx.createBufferSource();
          src.buffer = buf;
          src.connect(ctx.destination);
          src.start(0);
        }
      } catch {
        // ignore: best-effort unlock
      }
      if ('speechSynthesis' in window) {
        const dummy = new SpeechSynthesisUtterance('​');
        dummy.volume = 0;
        dummy.lang = 'pl-PL';
        window.speechSynthesis.speak(dummy);
      }
    }
  } catch {
    // ignore
  }
}

export function playTone(settings, freq, duration, type = 'sine', gainVal = 0.35) {
  if (!settings.soundEnabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const executeTone = () => {
      try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(gainVal, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + duration);
      } catch {
        // ignore
      }
    };
    if (ctx.state === 'suspended') ctx.resume().then(executeTone).catch(() => {});
    else executeTone();
  } catch {
    // ignore
  }
}

export function vibrate(settings, pattern) {
  if (settings.vibrateEnabled && navigator.vibrate) {
    try {
      navigator.vibrate(pattern);
    } catch {
      // ignore
    }
  }
}

export function soundSetLogged(settings) {
  playTone(settings, 587.33, 0.08, 'triangle', 0.25);
  setTimeout(() => playTone(settings, 880, 0.12, 'sine', 0.25), 60);
  vibrate(settings, [40]);
}

export function soundTimerFinished(settings) {
  playTone(settings, 523.25, 0.2, 'sine', 0.35);
  setTimeout(() => playTone(settings, 659.25, 0.2, 'sine', 0.35), 180);
  setTimeout(() => playTone(settings, 783.99, 0.4, 'triangle', 0.4), 360);
  vibrate(settings, [300, 150, 300, 150, 450]);
}

export function speakVoiceNotification(settings, text = 'Koniec przerwy!') {
  if (!settings.soundEnabled) return;
  try {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    setTimeout(() => {
      try {
        window.speechSynthesis.resume();
        const utterance = new SpeechSynthesisUtterance(text);
        activeUtterance = utterance;
        utterance.lang = 'pl-PL';
        utterance.rate = 0.88;
        utterance.pitch = 1.08;
        utterance.volume = 1.0;
        const voices = window.speechSynthesis.getVoices();
        if (voices && voices.length > 0) {
          const voice = voices.find(v => v.localService && v.lang && v.lang.startsWith('pl'))
            || voices.find(v => v.lang && v.lang.startsWith('pl'));
          if (voice) utterance.voice = voice;
        }
        utterance.onend = () => {
          activeUtterance = null;
        };
        utterance.onerror = () => {
          activeUtterance = null;
        };
        window.speechSynthesis.speak(utterance);
        setTimeout(() => {
          if (window.speechSynthesis && window.speechSynthesis.paused) window.speechSynthesis.resume();
        }, 80);
      } catch (error) {
        console.warn('SpeechSynthesis inner error:', error);
      }
    }, 50);
  } catch (error) {
    console.warn('SpeechSynthesis error:', error);
  }
}

export function testAudioAndSpeech(settings) {
  unlockAudioAndSpeech();
  soundTimerFinished(settings);
  setTimeout(() => speakVoiceNotification(settings, 'Koniec przerwy! Czas na serię.'), 420);
}

export function requestNotificationPermissionIfNeeded() {
  try {
    if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission();
  } catch {
    // ignore
  }
}

export function sendSystemNotification(title, body) {
  try {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    // System banners deliberately ignore the in-app audio mute setting. On phones,
    // showNotification() is the persistent notification API; it also works before
    // a newly registered worker has taken control of this page.
    const options = { body, icon: 'icon-192.png' };
    const persistentOptions = { ...options, badge: 'icon-192.png', vibrate: [200, 100, 200], tag: 'workout-timer', renotify: false };
    const showFallback = () => {
      try { new Notification(title, options); } catch { /* mobile fallback unavailable */ }
    };
    const serviceWorker = navigator.serviceWorker;
    if (serviceWorker) {
      const registration = typeof serviceWorker.getRegistration === 'function'
        ? serviceWorker.getRegistration()
        : serviceWorker.ready;
      registration
        .then(reg => {
          if (!reg || typeof reg.showNotification !== 'function') {
            showFallback();
            return undefined;
          }
          return reg.showNotification(title, persistentOptions);
        })
        .catch(showFallback);
      return;
    }
    showFallback();
  } catch {
    // ignore
  }
}
