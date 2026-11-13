import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { speakVoiceNotification } from '../../src/audio.js';

vi.mock('../../src/assets/komunikat-przerwa.mp3?inline', () => ({ default: 'data:audio/mpeg;base64,TEST' }));

describe('Polish voice notification', () => {
  let speak;
  let play;
  let voices;
  beforeEach(() => {
    vi.useFakeTimers();
    speak = vi.fn();
    play = vi.fn().mockRejectedValue(new Error('blocked'));
    vi.stubGlobal('Audio', vi.fn(function Audio(src) { this.src = src; this.play = play; }));
    voices = [];
    vi.stubGlobal('window', { speechSynthesis: { cancel: vi.fn(), resume: vi.fn(), getVoices: () => voices, speak } });
    vi.stubGlobal('SpeechSynthesisUtterance', class { constructor(text) { this.text = text; } });
  });
  afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });

  it('plays the supplied recording once instead of speech when the break finishes', async () => {
    play.mockResolvedValue();
    speakVoiceNotification({ soundEnabled: true }, 'Koniec przerwy! Czas na serię.');
    await vi.runAllTimersAsync();
    expect(Audio).toHaveBeenCalledWith('data:audio/mpeg;base64,TEST');
    expect(play).toHaveBeenCalledOnce();
    expect(speak).not.toHaveBeenCalled();
  });

  it('prefers an enhanced Polish device voice to a basic one', async () => {
    voices = [{ name: 'Basic', lang: 'pl-PL', localService: true }, { name: 'Polski (Enhanced)', lang: 'pl-PL', localService: true }, { name: 'Natural', lang: 'en-US', localService: true }];
    speakVoiceNotification({ soundEnabled: true }, 'Koniec przerwy! Czas na serię.');
    await vi.runAllTimersAsync();
    expect(speak).toHaveBeenCalledOnce();
    expect(speak.mock.calls[0][0].voice.name).toBe('Polski (Enhanced)');
    expect(speak.mock.calls[0][0].pitch).toBe(1);
  });

  it('falls back to a standard Polish voice', async () => {
    voices = [{ name: 'Basic', lang: 'pl-PL', localService: true }];
    speakVoiceNotification({ soundEnabled: true }, 'Koniec przerwy! Czas na serię.');
    await vi.runAllTimersAsync();
    expect(speak.mock.calls[0][0].voice.name).toBe('Basic');
  });

  it('does not speak if the sound setting is off', async () => {
    speakVoiceNotification({ soundEnabled: false }, 'Koniec przerwy! Czas na serię.');
    await vi.runAllTimersAsync();
    expect(play).not.toHaveBeenCalled();
    expect(speak).not.toHaveBeenCalled();
  });
});
