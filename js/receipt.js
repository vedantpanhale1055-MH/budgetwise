// ============================================================
// BudgetWise — js/receipt.js
// Groq Vision (llama-4-scout) — receipt photo → form autofill
// ============================================================

import { getGroqKey } from './ai-chat.js';
import { showToast, CATEGORIES } from './utils.js';

const GROQ_VISION_URL = 'https://api.groq.com/openai/v1/chat/completions';
const VISION_MODEL    = 'meta-llama/llama-4-scout-17b-16e-instruct';

// ── Convert file to base64 ────────────────────────────────────
const fileToBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload  = () => resolve(reader.result.split(',')[1]);
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

// ── Scan receipt image ────────────────────────────────────────
export const scanReceipt = async (file) => {
  const key = getGroqKey();
  if (!key) {
    showToast('Please add your Groq API key in Settings ⚙️', 'warning');
    return null;
  }

  // Validate file
  if (!file.type.startsWith('image/')) {
    showToast('Please upload an image file (JPG, PNG, WEBP)', 'error');
    return null;
  }

  if (file.size > 10 * 1024 * 1024) {
    showToast('Image too large. Please use an image under 10MB.', 'error');
    return null;
  }

  showToast('Scanning receipt... 📷', 'info', 8000);

  try {
    const base64    = await fileToBase64(file);
    const mediaType = file.type;

    const response = await fetch(GROQ_VISION_URL, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${key}`,
      },
      body: JSON.stringify({
        model:      VISION_MODEL,
        max_tokens: 512,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:${mediaType};base64,${base64}`,
              },
            },
            {
              type: 'text',
              text: `Analyze this receipt image and extract the following information.
Respond ONLY with a valid JSON object, no markdown, no explanation.

{
  "name": "merchant or store name (short, e.g. 'BigBasket Order' or 'Uber Ride')",
  "amount": 0.00,
  "date": "YYYY-MM-DD",
  "category": "one of: Food, Transport, Health, Utilities, Entertainment, Shopping, Education, Travel, Other",
  "notes": "brief description of items if visible, else empty string"
}

Rules:
- amount must be a number (the TOTAL amount paid, not subtotal before tax)
- date must be in YYYY-MM-DD format. If no date visible, use today: ${new Date().toISOString().split('T')[0]}
- category must be exactly one of the options listed
- name should be concise and descriptive
- If you cannot read the receipt clearly, make your best guess
- Return ONLY the JSON, nothing else`,
            },
          ],
        }],
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      if (response.status === 401) throw new Error('Invalid Groq API key');
      if (response.status === 400) throw new Error('Image format not supported. Try JPG or PNG.');
      throw new Error(err.error?.message || 'Receipt scan failed');
    }

    const data    = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    // Parse JSON from response
    const parsed = parseReceiptJSON(content);
    if (!parsed) throw new Error('Could not parse receipt data');

    // Validate category
    const validCategories = Object.keys(CATEGORIES);
    if (!validCategories.includes(parsed.category)) {
      parsed.category = 'Other';
    }

    // Validate amount
    parsed.amount = Math.abs(Number(parsed.amount) || 0);
    if (parsed.amount === 0) {
      showToast('Could not read amount. Please enter manually.', 'warning');
    }

    showToast('Receipt scanned! Form auto-filled ✅', 'success');
    return parsed;

  } catch (err) {
    showToast(`Receipt scan failed: ${err.message}`, 'error');
    return null;
  }
};

// ── Parse JSON from Groq response ────────────────────────────
const parseReceiptJSON = (text) => {
  try {
    // Direct parse
    return JSON.parse(text.trim());
  } catch {
    // Extract JSON from markdown code block
    const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (match) {
      try { return JSON.parse(match[1].trim()); } catch {}
    }
    // Extract raw JSON object
    const objMatch = text.match(/\{[\s\S]*\}/);
    if (objMatch) {
      try { return JSON.parse(objMatch[0]); } catch {}
    }
    return null;
  }
};

// ── Open file picker for receipt ──────────────────────────────
export const openReceiptPicker = (onResult) => {
  const input = document.createElement('input');
  input.type  = 'file';
  input.accept = 'image/*';

  // On mobile, open camera directly
  if (/Android|iPhone|iPad/i.test(navigator.userAgent)) {
    input.capture = 'environment'; // rear camera
  }

  input.onchange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const result = await scanReceipt(file);
    if (result) onResult(result, file);
  };

  input.click();
};

// ── Generate receipt thumbnail preview ────────────────────────
export const createReceiptPreview = (file) => new Promise((resolve) => {
  const reader  = new FileReader();
  reader.onload = (e) => resolve(e.target.result);
  reader.readAsDataURL(file);
});