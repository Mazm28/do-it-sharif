// Run with: node --test
const test = require('node:test');
const assert = require('node:assert');
const { merge, submittedPast } = require('../sync.js');

const item = (id, extra = {}) => ({ extId: 'quera:' + id, courseExt: 'quera:9', courseName: 'ML', name: 'HW' + id, url: 'u', due: '2026-11-01', time: '23:59', ...extra });

test('deleted courses and tasks stay deleted', () => {
  const courses = [];
  assert.equal(merge(courses, [item(1), item(2)], new Set(['quera:9'])), 0);
  assert.equal(courses.length, 0);
  merge(courses, [item(1)], new Set());
  assert.equal(merge(courses, [item(5)], new Set(['quera:5'])), 0);
});

test('deleted courses the sites still list are remembered, and come back once restored', () => {
  const hidden = {}, courses = [];
  merge(courses, [item(1)], new Set(['quera:9']), hidden);
  assert.deepEqual(hidden, { 'quera:9': 'ML' });
  assert.equal(merge(courses, [item(1)], new Set(), {}), 1);
});

test('late tag is added, then removed when the window closes', () => {
  const courses = [];
  merge(courses, [item(1, { late: { due: '2026-11-03', time: '23:59' } })], new Set());
  assert.deepEqual(courses[0].tasks[0].late, { due: '2026-11-03', time: '23:59' });
  merge(courses, [item(1, { existingOnly: true, submitted: true })], new Set());
  assert.equal(courses[0].tasks[0].late, undefined);
  assert.equal(courses[0].tasks[0].done, true);
});

test('closed past assignments are never added as new tasks', () => {
  const courses = [];
  assert.equal(merge(courses, [item(7, { existingOnly: true, submitted: true })], new Set()), 0);
  assert.equal(courses.length, 0);
});

test('past-deadline CW assignments are checked on their own page', async () => {
  const pages = {
    'https://cw.sharif.ir/mod/assign/view.php?id=1': '<td class="submissionstatussubmitted cell">',
    'https://cw.sharif.ir/mod/assign/view.php?id=2': '<table class="submissionstatustable">',
  };
  const fetched = [];
  global.fetch = async url => { fetched.push(url); return { text: async () => pages[url] || '' }; };
  const now = new Date('2026-11-04T12:00').getTime();
  const t = (id, due, extra = {}) => ({ extId: 'cw:event:' + id, due, time: '23:59', done: false, url: 'https://cw.sharif.ir/mod/assign/view.php?id=' + id, ...extra });
  const courses = [{ tasks: [t(1, '2026-11-03'), t(2, '2026-11-03'), t(3, '2026-10-01'), t(4, '2026-11-10'),
    t(5, '2026-11-03', { done: true }), t(6, '2026-11-03', { url: 'https://cw.sharif.ir/calendar/view.php' })] }];
  const found = await submittedPast(courses, 'cw:event:', new Set(), now);
  assert.deepEqual([...found], ['cw:event:1']);
  assert.deepEqual(fetched, Object.keys(pages)); // only recent, open, assignment pages
});
