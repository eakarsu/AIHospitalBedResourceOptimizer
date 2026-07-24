const fetch = require('node-fetch');
require('dotenv').config({ path: '../.env' });

const OPENROUTER_API_URL = `${(process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1').replace(/\/$/, '')}/chat/completions`;

async function queryAI(prompt, systemPrompt = 'You are an expert hospital operations AI assistant. Provide detailed, actionable insights for hospital bed and resource optimization. Always respond with structured, professional analysis.') {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022';

  if (!apiKey || apiKey === 'your_openrouter_api_key_here') {
    return {
      success: false,
      error: 'OpenRouter API key not configured. Please set OPENROUTER_API_KEY in .env file.',
      data: null
    };
  }

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'Hospital Bed & Resource Optimizer'
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    const data = await response.json();

    if (data.error) {
      return { success: false, error: data.error.message || 'AI request failed', data: null };
    }

    const content = data.choices?.[0]?.message?.content || 'No response generated';
    return {
      success: true,
      data: {
        content: content,
        model: data.model || model,
        usage: data.usage || {},
        timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    return { success: false, error: error.message, data: null };
  }
}

module.exports = { queryAI };
