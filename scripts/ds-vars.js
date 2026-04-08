// scripts/ds-vars.js — global cleanup of legacy CSS vars across .tsx files.
const fs = require('fs')
const path = require('path')

function walk(dir, list = []) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f)
    const stat = fs.statSync(p)
    if (stat.isDirectory()) walk(p, list)
    else if (/\.(tsx|ts)$/.test(f) && !p.includes('node_modules')) list.push(p)
  }
  return list
}

const reps = [
  // Text + colors
  ['var(--muted)',     'var(--ds-text-secondary)'],
  ['var(--text)',      'var(--ds-text-primary)'],
  ['var(--label)',     'var(--ds-text-label)'],
  ['var(--accent3)',   'var(--ds-color-success)'],
  ['var(--accent2)',   'var(--ds-color-primary)'],
  ['var(--accent)',    'var(--ds-color-primary)'],
  ['var(--warn)',      'var(--ds-color-warning)'],
  ['var(--danger)',    'var(--ds-color-danger)'],
  ['var(--teal)',      'var(--ds-color-primary)'],
  ['var(--purple)',    'var(--ds-color-primary)'],
  // Surfaces
  ['var(--surface3)',  'var(--ds-bg-elevated)'],
  ['var(--surface2)',  'var(--ds-bg-elevated)'],
  ['var(--surface)',   'var(--ds-card-bg)'],
  ['var(--bg2)',       'var(--ds-bg-surface)'],
  ['var(--bg)',        'var(--ds-bg-deep)'],
  ['var(--border2)',   'var(--ds-card-border)'],
  ['var(--border)',    'var(--ds-card-border)'],
  // Glow / shadow legacy
  ['var(--card-shadow)',     'var(--ds-shadow-md)'],
  ['var(--card-hover-shadow)','var(--ds-shadow-lg)'],
  ['var(--btn-glow-hover)',  'none'],
  ['var(--btn-glow)',        'none'],
  ['var(--glow-pink-ambient)','transparent'],
  ['var(--glow-pink-soft)',  'transparent'],
  ['var(--glow-pink)',       'transparent'],
  ['var(--glow-teal-soft)',  'transparent'],
  ['var(--glow-teal)',       'transparent'],
  ['var(--glow-white)',      'transparent'],
]

const files = walk('src')
let total = 0
let touched = 0
for (const f of files) {
  let c = fs.readFileSync(f, 'utf8')
  let n = 0
  for (const [from, to] of reps) {
    const b = c
    c = c.split(from).join(to)
    if (b !== c) n++
  }
  if (n > 0) {
    fs.writeFileSync(f, c)
    touched++
    total += n
  }
}
console.log('Files touched: ' + touched)
console.log('Pattern groups replaced: ' + total)
