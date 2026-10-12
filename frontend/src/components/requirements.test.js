import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import api from '../services/api';
import AdvancedAITools, { TOOLS, advancedToolPresets } from './AdvancedAITools';
import AIInsights, { patientPresetChoices } from './AIInsights';
import AIReport from './AIReport';
import Login from './Login';
import { workspaceFields, workspacePresets } from './AIWorkspace';
import features from './aiWorkspaceFeatures.json';

jest.mock('../services/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

global.IS_REACT_ACT_ENVIRONMENT = true;

const patients = [
  { id: 101, name: 'Fixture Patient A' },
  { id: 202, name: 'Fixture Patient B' },
  { id: 303, name: 'Fixture Patient C' },
];

let container;
let root;

async function render(element) {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => {
    root.render(element);
    await Promise.resolve();
  });
}

async function click(element) {
  await act(async () => {
    element.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await Promise.resolve();
  });
}

beforeEach(() => {
  api.get.mockReset();
  api.post.mockReset();
  api.get.mockResolvedValue({ data: { data: patients } });
  localStorage.clear();
  global.fetch = jest.fn();
});

afterEach(async () => {
  if (root) await act(async () => root.unmount());
  container?.remove();
  root = null;
  container = null;
  jest.restoreAllMocks();
});

test('every report-workspace preset fills all required and optional fields', () => {
  expect(features).toHaveLength(15);
  features.forEach((feature) => {
    const presets = workspacePresets(feature);
    expect(presets).toHaveLength(3);
    presets.forEach((preset) => {
      expect(Object.keys(preset.values).sort()).toEqual(workspaceFields.map((field) => field.key).sort());
      workspaceFields.forEach((field) => expect(String(preset.values[field.key]).trim()).not.toBe(''));
    });
  });
});

test('advanced AI preset buttons fill every visible field with valid fixture records', async () => {
  TOOLS.forEach((tool) => {
    const presets = advancedToolPresets(tool, patients);
    expect(presets).toHaveLength(3);
    presets.forEach((preset) => tool.fields.forEach((field) => expect(String(preset.values[field.name]).trim()).not.toBe('')));
  });

  await render(<AdvancedAITools />);
  await act(async () => { await Promise.resolve(); });
  let buttons = [...container.querySelectorAll('.native-ai-control-buttons button')];
  expect(buttons).toHaveLength(3);
  for (const button of buttons) {
    await click(button);
    [...container.querySelectorAll('[data-ai-field]')].forEach((field) => expect(field.value.trim()).not.toBe(''));
  }

  const tabs = [...container.querySelectorAll('button')];
  await click(tabs.find((button) => button.textContent.includes('ICU Step-Down Recommendation')));
  buttons = [...container.querySelectorAll('.native-ai-control-buttons button')];
  for (const button of buttons) {
    await click(button);
    [...container.querySelectorAll('[data-ai-field]')].forEach((field) => expect(field.value.trim()).not.toBe(''));
  }
});

test('AI insight preset buttons select existing patients for both patient tools', async () => {
  patientPresetChoices(patients).forEach((preset) => expect(['101', '202', '303']).toContain(preset.values.patient_id));
  await render(<AIInsights />);
  await act(async () => { await Promise.resolve(); });
  const bars = [...container.querySelectorAll('.ai-preset-bar')];
  expect(bars).toHaveLength(2);
  for (const bar of bars) {
    const select = bar.parentElement.querySelector('select[data-ai-field="patient_id"]');
    const buttons = [...bar.querySelectorAll('button')];
    expect(buttons).toHaveLength(3);
    for (const button of buttons) {
      await click(button);
      expect(['101', '202', '303']).toContain(select.value);
    }
  }
});

test('live and saved structured JSON use labeled cards, lists, and tables', async () => {
  const structured = {
    executive_summary: { status: 'Review required', available_beds: 12 },
    priorities: ['Confirm staffing', 'Open flex capacity'],
    unit_plan: [
      { unit: 'ICU', action: 'Hold one monitored bed', owner: 'Command center' },
      { unit: 'Medical', action: 'Review expected discharges', owner: 'Flow team' },
    ],
  };
  await render(<div><AIReport response={structured} title="Live result" /><AIReport response={{ id: 9, result_json: structured, model: 'fixture-model' }} title="Saved result" /></div>);
  expect(container.querySelectorAll('.ai-report')).toHaveLength(2);
  expect(container.querySelectorAll('.ai-report-sections').length).toBeGreaterThanOrEqual(2);
  expect(container.querySelectorAll('.ai-report-facts').length).toBeGreaterThanOrEqual(2);
  expect(container.querySelectorAll('table')).toHaveLength(2);
  expect(container.textContent).toContain('Executive summary');
  expect(container.textContent).toContain('Confirm staffing');
  expect(container.textContent).toContain('Command center');
});

test('demo login button submits configured demo credentials', async () => {
  process.env.REACT_APP_DEMO_EMAIL = 'demo.fixture@hospital.test';
  process.env.REACT_APP_DEMO_PASSWORD = 'fixture-password-not-a-real-secret';
  global.fetch.mockResolvedValue({
    ok: true,
    json: async () => ({ token: 'fixture-token', user: { id: 1, name: 'Demo Fixture', email: 'demo.fixture@hospital.test' } }),
  });
  await render(<MemoryRouter><Login /></MemoryRouter>);
  const button = [...container.querySelectorAll('button')].find((candidate) => candidate.textContent.includes('Log In as Demo'));
  expect(button).toBeTruthy();
  expect(button.disabled).toBe(false);
  await click(button);
  expect(global.fetch).toHaveBeenCalledWith('/api/auth/login', expect.objectContaining({
    method: 'POST',
    body: JSON.stringify({ email: 'demo.fixture@hospital.test', password: 'fixture-password-not-a-real-secret' }),
  }));
  expect(localStorage.getItem('token')).toBe('fixture-token');
});
