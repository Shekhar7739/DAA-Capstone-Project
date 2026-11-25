import { spawn } from 'node:child_process'
import assert from 'node:assert/strict'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const PORT = 9333
const BASE = 'http://127.0.0.1:4173'
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const chrome = spawn(CHROME, [
  '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=C:\\Users\\codew\\AppData\\Local\\Temp\\opencode\\chrome-cdp-${Date.now()}`,
  'about:blank',
], { stdio: 'ignore' })

async function connect() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${PORT}/json/list`)
      const targets = await response.json()
      const page = targets.find((target) => target.type === 'page')
      if (page) return page.webSocketDebuggerUrl
    } catch { /* browser starting */ }
    await sleep(250)
  }
  throw new Error('Chrome DevTools endpoint unavailable')
}

const wsUrl = await connect()
const socket = new WebSocket(wsUrl)
await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject })

let nextId = 1
const pending = new Map()
const consoleErrors = []
const exceptions = []

socket.onmessage = (event) => {
  const message = JSON.parse(event.data)
  if (message.id && pending.has(message.id)) {
    const { resolve, reject } = pending.get(message.id)
    pending.delete(message.id)
    if (message.error) reject(new Error(JSON.stringify(message.error)))
    else resolve(message.result)
  }
  if (message.method === 'Runtime.exceptionThrown') exceptions.push(message.params.exceptionDetails.text)
  if (message.method === 'Runtime.consoleAPICalled' && ['error', 'warning'].includes(message.params.type)) {
    consoleErrors.push(message.params.args.map((arg) => arg.value || arg.description || '').join(' '))
  }
  if (message.method === 'Log.entryAdded' && message.params.entry.level === 'error') consoleErrors.push(message.params.entry.text)
}

function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = nextId++
    pending.set(id, { resolve, reject })
    socket.send(JSON.stringify({ id, method, params }))
  })
}

async function evaluate(expression) {
  const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text)
  return result.result.value
}

async function goto(path) {
  await send('Page.navigate', { url: BASE + path })
  for (let attempt = 0; attempt < 40; attempt += 1) {
    await sleep(100)
    if (await evaluate('document.readyState === "complete" && !!document.querySelector("main h1")')) return
  }
  throw new Error(`Route ${path} did not render`)
}

const text = async () => evaluate('document.body.innerText')
const clickByText = async (label) => evaluate(`(() => { const el = [...document.querySelectorAll('button, a')].find(e => e.textContent.trim().includes(${JSON.stringify(label)})); if (!el) return false; el.click(); return true; })()`)

const report = {}
try {
  await send('Runtime.enable')
  await send('Log.enable')
  await send('Page.enable')

  for (const [path, marker] of [
    ['/', 'Total Subjects'], ['/subjects', 'All departments'], ['/students', 'Enrolled subjects'],
    ['/conflict-graph', 'Conflicting subject pairs'], ['/generate', 'Examination configuration'],
    ['/timetable', 'No timetable generated yet'], ['/analysis', 'Simulation laboratory'], ['/settings', 'Application information'],
  ]) {
    await goto(path)
    assert.ok((await text()).toLowerCase().includes(marker.toLowerCase()), `Missing marker "${marker}" on ${path}`)
    report[path] = 'rendered'
  }

  // Subject CRUD: add, rename, delete.
  await goto('/subjects')
  const beforeSubjects = await evaluate('JSON.parse(localStorage.getItem("exam-scheduler:v1:subjects")).length')
  assert.equal(await clickByText('Add subject'), true)
  await sleep(200)
  await evaluate(`(() => {
    const set = (el, value) => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, value);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    };
    const inputs = [...document.querySelectorAll('#subject-form input')];
    set(inputs[0], 'Software Engineering');
    set(inputs[1], 'CS999');
    set(inputs[2], 'Computer Science');
    return inputs.length;
  })()`)
  await sleep(100)
  const formFilled = await evaluate(`(() => { const f = document.querySelector('#subject-form'); return [...f.querySelectorAll('input')].map(e => e.value) })()`)
  report.subjectFormValues = formFilled
  assert.equal(await evaluate(`(() => { const button = document.querySelector('button[form="subject-form"]'); if (!button) return false; button.click(); return true; })()`), true)
  await sleep(400)
  const afterSubjects = await evaluate('JSON.parse(localStorage.getItem("exam-scheduler:v1:subjects")).length')
  report.subjectCRUD = { beforeSubjects, afterSubjects }
  assert.equal(afterSubjects, beforeSubjects + 1, 'subject was added')

  // Generation.
  await goto('/generate')
  assert.equal(await clickByText('Generate timetable'), true)
  await sleep(1200)
  const saved = await evaluate('JSON.parse(localStorage.getItem("exam-scheduler:v1:timetable"))')
  assert.ok(saved && saved.entries.length === 11, 'timetable saved with all subjects')
  const conflictCheck = await evaluate(`(() => {
    const tt = JSON.parse(localStorage.getItem('exam-scheduler:v1:timetable'));
    const students = JSON.parse(localStorage.getItem('exam-scheduler:v1:students'));
    const slot = {};
    tt.entries.forEach(e => slot[e.subjectId] = e.date + '|' + e.session);
    let violations = 0;
    students.forEach(s => { for (let i=0;i<s.subjectIds.length;i++) for (let j=i+1;j<s.subjectIds.length;j++)
      if (slot[s.subjectIds[i]] && slot[s.subjectIds[i]] === slot[s.subjectIds[j]]) violations++; });
    return violations;
  })()`)
  assert.equal(conflictCheck, 0, 'no conflicting exams share a slot')
  report.generation = { entries: saved.entries.length, colors: saved.metrics.colorsUsed, conflicts: conflictCheck }

  await goto('/timetable')
  assert.ok((await text()).includes('Conflict-free'), 'timetable validation badge visible')

  await goto('/analysis')
  assert.equal(await clickByText('Run custom graph'), true)
  await sleep(700)
  assert.ok((await text()).includes('Simulation results'), 'simulation panel visible')
  assert.ok((await evaluate('document.body.innerText')).includes('Run 1'), 'simulation recorded')

  await goto('/settings')
  assert.equal(await clickByText('Teal'), true)
  await sleep(200)
  assert.equal(await evaluate('document.documentElement.dataset.accent'), 'teal')

  // Persistence across reload.
  await goto('/subjects')
  const persisted = await evaluate('JSON.parse(localStorage.getItem("exam-scheduler:v1:subjects")).length')
  assert.equal(persisted, beforeSubjects + 1, 'data persisted after navigation')

  // Student CRUD.
  await goto('/students')
  const beforeStudents = await evaluate('JSON.parse(localStorage.getItem("exam-scheduler:v1:students")).length')
  assert.equal(await clickByText('Add student'), true)
  await sleep(200)
  await evaluate(`(() => {
    const set = (el, value) => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, value);
      el.dispatchEvent(new Event('input', { bubbles: true }));
    };
    const inputs = [...document.querySelectorAll('#student-form input')];
    set(inputs[0], 'STU999');
    set(inputs[1], 'Test Student');
    set(inputs[2], 'test.student@university.edu');
    set(inputs[3], 'Computer Science');
    document.querySelector('#student-form input[type="checkbox"]').click();
  })()`)
  assert.equal(await evaluate(`(() => { const button = document.querySelector('button[form="student-form"]'); if (!button) return false; button.click(); return true; })()`), true)
  await sleep(400)
  const afterAddStudent = await evaluate('JSON.parse(localStorage.getItem("exam-scheduler:v1:students")).length')
  assert.equal(afterAddStudent, beforeStudents + 1, 'student added')
  await evaluate(`(() => {
    const row = [...document.querySelectorAll('tbody tr')].find(tr => tr.innerText.includes('STU999'));
    row.querySelectorAll('button')[1].click();
  })()`)
  await sleep(150)
  assert.equal(await clickByText('Delete student'), true)
  await sleep(400)
  const afterDeleteStudent = await evaluate('JSON.parse(localStorage.getItem("exam-scheduler:v1:students")).length')
  assert.equal(afterDeleteStudent, beforeStudents, 'student deleted')
  report.studentCRUD = { beforeStudents, afterAddStudent, afterDeleteStudent }

  // Regenerate after CRUD cleared the old timetable, then test export and print.
  await goto('/generate')
  assert.equal(await clickByText('Generate timetable'), true)
  await sleep(1000)
  await goto('/timetable')
  await evaluate(`(() => {
    window.__printed = false;
    window.print = () => { window.__printed = true };
    window.__csv = null;
    const original = URL.createObjectURL;
    URL.createObjectURL = (blob) => { blob.text().then(text => { window.__csv = text }); return original(blob) };
    HTMLAnchorElement.prototype.click = function () { if (this.download) window.__csvName = this.download };
  })()`)
  assert.equal(await clickByText('Export CSV'), true)
  assert.equal(await clickByText('Print'), true)
  await sleep(300)
  const csv = await evaluate('window.__csv')
  report.export = {
    filename: await evaluate('window.__csvName'),
    hasHeader: !!csv && csv.includes('Subject'),
    hasData: !!csv && csv.includes('CS301'),
    printed: await evaluate('window.__printed'),
  }
  assert.ok(report.export.hasHeader && report.export.hasData && report.export.printed, 'CSV and print work')

  // Reset and clear with confirmations.
  await goto('/settings')
  assert.equal(await clickByText('Reset to Sample Data'), true)
  await sleep(150)
  assert.equal(await clickByText('Reset data'), true)
  await sleep(300)
  const afterReset = await evaluate('[JSON.parse(localStorage.getItem("exam-scheduler:v1:subjects")).length, JSON.parse(localStorage.getItem("exam-scheduler:v1:students")).length]')
  assert.deepEqual(afterReset, [10, 20], 'reset restored sample data')
  assert.equal(await clickByText('Clear All Data'), true)
  await sleep(150)
  assert.equal(await clickByText('Clear everything'), true)
  await sleep(300)
  const afterClear = await evaluate('[JSON.parse(localStorage.getItem("exam-scheduler:v1:subjects")).length, JSON.parse(localStorage.getItem("exam-scheduler:v1:students")).length]')
  assert.deepEqual(afterClear, [0, 0], 'clear removed all data')
  await clickByText('Reset to Sample Data')
  await sleep(150)
  await clickByText('Reset data')
  await sleep(300)
  report.dataManagement = { afterReset, afterClear }

  // Responsive navigation.
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true })
  await goto('/')
  const menuVisible = await evaluate('getComputedStyle(document.querySelector("button[aria-label=\\"Open navigation\\"]")).display !== "none"')
  assert.equal(menuVisible, true, 'mobile menu button visible')
  assert.equal(await evaluate(`(() => { document.querySelector('button[aria-label="Open navigation"]').click(); return true })()`), true)
  await sleep(350)
  const drawerOpen = await evaluate('document.querySelector("aside").className.includes("translate-x-0")')
  assert.equal(drawerOpen, true, 'mobile drawer opens')
  await send('Emulation.clearDeviceMetricsOverride')
  report.responsive = { menuVisible, drawerOpen }

  report.consoleErrors = consoleErrors.filter((message) => !message.includes('favicon'))
  report.exceptions = exceptions
  assert.equal(report.exceptions.length, 0, `JS exceptions: ${report.exceptions.join(' | ')}`)
  assert.equal(report.consoleErrors.length, 0, `Console errors: ${report.consoleErrors.join(' | ')}`)
  console.log(JSON.stringify(report, null, 2))
} finally {
  socket.close()
  chrome.kill('SIGKILL')
}
