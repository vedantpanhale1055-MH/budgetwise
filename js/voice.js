// ============================================================
// BudgetWise — js/voice.js
// Web Speech API — navigate tabs by voice commands
// ============================================================

import { navigateTo } from './router.js';
import { showToast }  from './utils.js';

let recognition  = null;
let isListening  = false;

// ── Voice command map ─────────────────────────────────────────
const COMMANDS = {
  'dashboard':      'dashboard',
  'home':           'dashboard',
  'expenses':       'expenses',
  'spending':       'expenses',
  'transactions':   'expenses',
  'calendar':       'calendar',
  'schedule':       'calendar',
  'analytics':      'analytics',
  'charts':         'analytics',
  'reports':        'analytics',
  'budget':         'budget',
  'budgets':        'budget',
  'recurring':      'recurring',
  'subscriptions':  'recurring',
  'bills':          'recurring',
  'ai':             'ai-advisor',
  'advisor':        'ai-advisor',
  'assistant':      'ai-advisor',
  'chat':           'ai-advisor',
  'add expense':    '__add_expense',
  'new expense':    '__add_expense',
};

// ── Check support ─────────────────────────────────────────────
export const isVoiceSupported = () =>
  'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;

// ── Init ──────────────────────────────────────────────────────
export const initVoice = () => {
  if (!isVoiceSupported()) return false;

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  recognition.continuous  = false;
  recognition.lang        = 'en-IN';
  recognition.interimResults = false;
  recognition.maxAlternatives = 3;

  recognition.onstart = () => {
    isListening = true;
    updateVoiceBtn(true);
  };

  recognition.onend = () => {
    isListening = false;
    updateVoiceBtn(false);
  };

  recognition.onerror = (e) => {
    isListening = false;
    updateVoiceBtn(false);
    if (e.error !== 'no-speech') {
      showToast('Voice recognition error. Please try again.', 'error');
    }
  };

  recognition.onresult = (event) => {
    const results = Array.from(event.results[0]).map(r => r.transcript.toLowerCase().trim());
    handleVoiceResult(results);
  };

  // Wire up voice button
  const btn = document.getElementById('voiceBtn');
  if (btn) btn.addEventListener('click', toggleVoice);

  return true;
};

// ── Toggle listening ──────────────────────────────────────────
export const toggleVoice = () => {
  if (!recognition) return;
  if (isListening) {
    recognition.stop();
  } else {
    try {
      recognition.start();
      showToast('Listening... say a tab name', 'info', 2500);
    } catch (e) {
      showToast('Could not start voice. Please try again.', 'error');
    }
  }
};

// ── Handle result ─────────────────────────────────────────────
const handleVoiceResult = (transcripts) => {
  for (const transcript of transcripts) {
    // Check multi-word commands first
    for (const [phrase, action] of Object.entries(COMMANDS)) {
      if (transcript.includes(phrase)) {
        executeCommand(action, transcript);
        return;
      }
    }
  }
  showToast(`Didn't understand. Try: "dashboard", "expenses", "budget"`, 'warning');
};

const executeCommand = (action, transcript) => {
  if (action === '__add_expense') {
    document.getElementById('addExpenseBtn')?.click();
    showToast(`Voice: Opening Add Expense`, 'success', 2000);
    return;
  }
  navigateTo(action);
  showToast(`Voice: Navigating to ${action}`, 'success', 2000);
};

// ── Update voice button state ─────────────────────────────────
const updateVoiceBtn = (listening) => {
  const btn = document.getElementById('voiceBtn');
  if (!btn) return;
  btn.classList.toggle('listening', listening);
  btn.title = listening ? 'Listening... click to stop' : 'Voice commands';
  btn.innerHTML = listening ? '🔴' : '🎤';
};