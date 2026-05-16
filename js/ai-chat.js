// ============================================================
// BudgetWise — js/ai-chat.js
// Groq Llama 3.3 70B — expense-aware AI financial advisor
// ============================================================

import { store }                           from './store.js';
import { formatCurrency, formatDate,
         showToast, getCategoryData }       from './utils.js';

// ── Groq config ───────────────────────────────────────────────
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL   = 'llama-3.3-70b-versatile';

// ── Chat state ────────────────────────────────────────────────
let chatHistory  = [];   // { role, content }[]
let isProcessing = false;

// ── Get Groq key from localStorage ───────────────────────────
export const getGroqKey = () => localStorage.getItem('bw_groq_key') || '';
export const setGroqKey = (key) => localStorage.setItem('bw_groq_key', key);

// ── Build system prompt with expense context ──────────────────
const buildSystemPrompt = () => {
  const expenses  = store.getCurrentMonthExpenses();
  const total     = store.getTotalSpent(expenses);
  const catTotals = store.getCategoryTotals(expenses);
  const budget    = store.getTotalBudget();
  const recurring = store.getActiveRecurringTotal();
  const family    = store.household?.name || 'the family';
  const userName  = store.user?.name?.split(' ')[0] || 'there';

  // Top 5 expenses this month
  const top5 = [...expenses]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5)
    .map(e => `  - ${e.name}: ${formatCurrency(e.amount)} (${e.category})`)
    .join('\n');

  // Category breakdown
  const catBreakdown = Object.entries(catTotals)
    .sort((a, b) => b[1] - a[1])
    .map(([cat, amt]) => {
      const pct = total > 0 ? ((amt / total) * 100).toFixed(1) : 0;
      return `  - ${cat}: ${formatCurrency(amt)} (${pct}%)`;
    })
    .join('\n');

  return `You are BudgetWise AI, a friendly and knowledgeable personal finance advisor for ${family}.
You have access to their real expense data and provide personalized, actionable advice.

CURRENT FINANCIAL DATA (this month):
- Family: ${family}
- User speaking: ${userName}
- Total spent this month: ${formatCurrency(total)}
- Monthly budget: ${formatCurrency(budget)}
- Budget used: ${budget > 0 ? ((total / budget) * 100).toFixed(1) : 'N/A'}%
- Remaining budget: ${formatCurrency(Math.max(0, budget - total))}
- Active recurring/subscriptions: ${formatCurrency(recurring)}/month
- Total transactions: ${expenses.length}

SPENDING BY CATEGORY:
${catBreakdown || '  No data yet'}

TOP 5 EXPENSES THIS MONTH:
${top5 || '  No data yet'}

INSTRUCTIONS:
- Be conversational, warm, and helpful — like a trusted financial friend
- Give specific, actionable advice based on the REAL data above
- Use Indian Rupee (₹) for all amounts
- Keep responses concise but complete — use bullet points for lists
- When asked about categories, reference the actual amounts above
- Suggest realistic savings targets based on the data
- Never make up data — only use what's provided above
- If asked something outside finance, politely redirect to financial topics
- Address the user by their first name: ${userName}`;
};

// ── Send message to Groq ──────────────────────────────────────
export const sendMessage = async (userMessage) => {
  const key = getGroqKey();
  if (!key) {
    showToast('Please add your Groq API key in Settings ⚙️', 'warning');
    return null;
  }

  if (isProcessing) return null;
  isProcessing = true;

  // Add to history
  chatHistory.push({ role: 'user', content: userMessage });

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${key}`,
      },
      body: JSON.stringify({
        model:       GROQ_MODEL,
        max_tokens:  1024,
        temperature: 0.7,
        messages: [
          { role: 'system', content: buildSystemPrompt() },
          ...chatHistory.slice(-10), // keep last 10 for context
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      if (response.status === 401) throw new Error('Invalid Groq API key. Please check in Settings ⚙️');
      if (response.status === 429) throw new Error('Rate limit reached. Please wait a moment.');
      throw new Error(err.error?.message || 'Groq API error. Please try again.');
    }

    const data    = await response.json();
    const content = data.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';

    chatHistory.push({ role: 'assistant', content });
    isProcessing = false;
    return content;

  } catch (err) {
    isProcessing = false;
    chatHistory.push({ role: 'assistant', content: `❌ ${err.message}` });
    throw err;
  }
};

// ── Validate Groq key ─────────────────────────────────────────
export const validateGroqKey = async (key) => {
  try {
    const res = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${key}`,
      },
      body: JSON.stringify({
        model:      GROQ_MODEL,
        max_tokens: 5,
        messages:   [{ role: 'user', content: 'Hi' }],
      }),
    });
    return res.ok || res.status === 429; // 429 = valid key, just rate limited
  } catch {
    return false;
  }
};

// ── Clear chat history ────────────────────────────────────────
export const clearChat = () => { chatHistory = []; };

// ── Suggested prompts ─────────────────────────────────────────
export const SUGGESTED_PROMPTS = [
  'Where are we overspending this month?',
  'How can we save ₹5,000 this month?',
  'Review our spending this month',
  'Which category needs more budget?',
  'Tips to reduce food expenses',
  'Are our subscriptions worth it?',
];

// ── Render chat UI ────────────────────────────────────────────
export const renderAIChat = () => {
  const container = document.getElementById('aiChatView');
  if (!container) return;

  const key    = getGroqKey();
  const hasKey = Boolean(key);

  container.innerHTML = `
    <div class="ai-chat-page">

      <!-- Header -->
      <div class="ai-chat-header">
        <div class="ai-chat-header-left">
          <div class="ai-chat-title-row">
            <span class="ai-chat-title">AI Advisor</span>
            <span class="ai-beta-badge">Beta</span>
          </div>
          <span class="ai-chat-subtitle">Your smart financial companion for better decisions</span>
        </div>
        <div class="ai-chat-header-right">
          <div class="ai-powered-badge">
            Powered by <strong>Groq</strong>
          </div>
          <button class="ai-info-btn" title="About AI Advisor" onclick="showAIInfo()">ℹ️</button>
        </div>
      </div>

      <!-- No key banner -->
      ${!hasKey ? `
      <div class="ai-no-key-banner" id="noKeyBanner">
        <span class="ai-no-key-banner-icon">🔑</span>
        <div class="ai-no-key-banner-text">
          Add your <strong>free Groq API key</strong> to enable AI features
        </div>
        <button class="btn btn-primary btn-sm" onclick="openSettings()">Add Key ⚙️</button>
      </div>` : ''}

      <!-- Messages -->
      <div class="ai-messages" id="aiMessages">
        <!-- Welcome message -->
        <div class="ai-message-row ai">
          <div class="ai-avatar">🤖</div>
          <div>
            <div class="ai-bubble">
              ${getWelcomeMessage()}
            </div>
            <div class="ai-timestamp">${getCurrentTime()}</div>
          </div>
        </div>
      </div>

      <!-- Suggested prompts -->
      <div class="ai-suggestions" id="aiSuggestions">
        ${SUGGESTED_PROMPTS.map(p =>
          `<button class="ai-suggestion-chip" onclick="sendSuggestedPrompt('${p}')">${p}</button>`
        ).join('')}
      </div>

      <!-- Input bar -->
      <div class="ai-input-bar">
        <button class="ai-attach-btn" title="Attach receipt" onclick="attachReceiptToChat()" ${!hasKey ? 'disabled' : ''}>📎</button>
        <div class="ai-input-wrap">
          <textarea
            class="ai-input"
            id="aiInput"
            placeholder="Ask me anything about your finances..."
            rows="1"
            ${!hasKey ? 'disabled' : ''}
            onkeydown="handleAIInputKey(event)"
            oninput="autoResizeAIInput(this)"
          ></textarea>
        </div>
        <button class="ai-send-btn" id="aiSendBtn" onclick="handleAISend()" ${!hasKey ? 'disabled' : ''}>
          ➤
        </button>
      </div>

      <!-- Disclaimer -->
      <div class="ai-disclaimer">
        AI responses can make mistakes. Always verify important financial decisions.
      </div>

    </div>
  `;

  // Wire up global handlers needed by inline onclick
  window.handleAISend         = handleAISend;
  window.handleAIInputKey     = handleAIInputKey;
  window.autoResizeAIInput    = autoResizeAIInput;
  window.sendSuggestedPrompt  = sendSuggestedPrompt;
  window.attachReceiptToChat  = attachReceiptToChat;
  window.showAIInfo           = showAIInfo;

  // Re-render existing messages if any
  if (chatHistory.length > 1) reRenderMessages();
};

// ── Handle send ───────────────────────────────────────────────
const handleAISend = async () => {
  const input = document.getElementById('aiInput');
  const msg   = input?.value.trim();
  if (!msg || isProcessing) return;

  input.value = '';
  autoResizeAIInput(input);

  // Hide suggestions after first message
  const suggestions = document.getElementById('aiSuggestions');
  if (suggestions) suggestions.style.display = 'none';

  appendMessage('user', msg);
  appendTyping();

  try {
    const reply = await sendMessage(msg);
    removeTyping();
    if (reply) appendMessage('ai', reply);
  } catch (err) {
    removeTyping();
    appendMessage('ai', `❌ ${err.message}`);
  }
};

const handleAIInputKey = (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleAISend();
  }
};

const autoResizeAIInput = (el) => {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 120) + 'px';
};

const sendSuggestedPrompt = (prompt) => {
  const input = document.getElementById('aiInput');
  if (input) { input.value = prompt; handleAISend(); }
};

const attachReceiptToChat = () => {
  showToast('Use the Receipt Scanner in Add Expense to scan receipts 📷', 'info');
};

const showAIInfo = () => {
  showToast('AI Advisor uses Groq Llama 3.3 70B with your real expense data as context.', 'info', 4000);
};

// ── Append message to chat ────────────────────────────────────
const appendMessage = (role, content) => {
  const container = document.getElementById('aiMessages');
  if (!container) return;

  const isUser = role === 'user';
  const html   = `
    <div class="ai-message-row ${isUser ? 'user' : 'ai'}" style="animation:fadeIn 0.2s ease;">
      ${!isUser ? '<div class="ai-avatar">🤖</div>' : ''}
      <div>
        <div class="ai-bubble">${formatAIMessage(content)}</div>
        <div class="ai-timestamp">
          ${getCurrentTime()}
          ${isUser ? '<span class="ai-read-tick">✓✓</span>' : ''}
        </div>
      </div>
    </div>
  `;
  container.insertAdjacentHTML('beforeend', html);
  container.scrollTop = container.scrollHeight;
};

// ── Typing indicator ──────────────────────────────────────────
const appendTyping = () => {
  const container = document.getElementById('aiMessages');
  if (!container) return;
  container.insertAdjacentHTML('beforeend', `
    <div class="ai-typing" id="aiTyping">
      <div class="ai-avatar">🤖</div>
      <div class="ai-typing-bubble">
        <div class="ai-typing-dot"></div>
        <div class="ai-typing-dot"></div>
        <div class="ai-typing-dot"></div>
      </div>
    </div>
  `);
  container.scrollTop = container.scrollHeight;
};

const removeTyping = () => {
  document.getElementById('aiTyping')?.remove();
};

// ── Re-render existing messages ───────────────────────────────
const reRenderMessages = () => {
  chatHistory.slice(1).forEach(msg => {
    appendMessage(msg.role === 'user' ? 'user' : 'ai', msg.content);
  });
};

// ── Format AI message (markdown-lite) ────────────────────────
const formatAIMessage = (text) => {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code style="background:rgba(0,0,0,0.08);padding:1px 4px;border-radius:3px;font-size:0.85em;">$1</code>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')
    .replace(/^(?!<)(.+)$/gm, '<p>$1</p>')
    .replace(/<p><\/p>/g, '');
};

// ── Welcome message ───────────────────────────────────────────
const getWelcomeMessage = () => {
  const name    = store.user?.name?.split(' ')[0] || 'there';
  const total   = store.getTotalSpent();
  const hasData = store.expenses.length > 0;

  if (!hasData) {
    return `<p>Hi ${name}! 👋 I'm your AI financial advisor.</p>
            <p>Start adding expenses and I'll help you analyze your spending patterns and save money!</p>`;
  }

  return `<p>Hi ${name}! 👋 I've reviewed your spending data.</p>
          <ul>
            <li>Total spent this month: <strong>${formatCurrency(total)}</strong></li>
            <li>${store.expenses.length} transactions recorded</li>
            <li>Budget used: <strong>${store.getTotalBudget() > 0
              ? ((total / store.getTotalBudget()) * 100).toFixed(0) + '%'
              : 'No budget set'}</strong></li>
          </ul>
          <p>What would you like to know about your finances?</p>`;
};

const getCurrentTime = () => {
  return new Date().toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit', hour12: true
  });
};