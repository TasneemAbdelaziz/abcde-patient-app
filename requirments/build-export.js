// Builds export.html by pulling the data arrays out of the three source pages
// and injecting them into export-template.html. Re-run after editing any source page.
const fs = require('fs');

function slice(file, startNeedle, endNeedle){
  const txt = fs.readFileSync(file, 'utf8');
  const a = txt.indexOf(startNeedle);
  if(a < 0) throw new Error('start not found in '+file+': '+startNeedle);
  const b = txt.indexOf(endNeedle, a);
  if(b < 0) throw new Error('end not found in '+file+': '+endNeedle);
  return txt.slice(a, b).trim();
}

// SRS: from "const CR=[" up to (but not including) the render comment
const srs = slice('SRS-requirements.html', 'const CR=[', '/* ---------- render');
// Architecture: the SUBSYS array up to the render comment
const arch = slice('system-architecture.html', 'const SUBSYS', '/* ---------- render');
// PCC: from "const PCC=[" up to the render comment
const pcc = slice('patient-stories-pcc.html', 'const PCC=[', '/* ---------- render');
// Mindmap: helpers + ROOT + SCENARIOS, up to the layout/render section
const mind = slice('user-mindmaps.html', 'const Lbl=', '/* ---------- layout / render');

const data = [
  '/* ===== data: SRS (CR, L, FR, NFR) ===== */', srs,
  '/* ===== data: Architecture (SUBSYS) ===== */', arch,
  '/* ===== data: PCC (PCC, PERSONAS, S, STORIES, A11Y, GAPS) ===== */', pcc,
  '/* ===== data: Mindmap (Lbl, T, IN, OUT, F, ROOT, SCENARIOS) ===== */', mind,
].join('\n\n');

const tpl = fs.readFileSync('export-template.html', 'utf8');
const out = tpl.replace('/*__DATA__*/', data);
fs.writeFileSync('export.html', out, 'utf8');
console.log('export.html written ('+out.length+' bytes). Data blocks: SRS '+srs.length+', ARCH '+arch.length+', PCC '+pcc.length);
