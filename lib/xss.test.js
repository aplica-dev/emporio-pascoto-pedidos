// Rodar: node lib/xss.test.js
// Nome de cliente com aspa nao pode virar codigo no painel (12/11/2026).
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '../public/index.html'), 'utf8');
const fn = nome => html.match(new RegExp(`function ${nome}\\(s\\)\\{.*\\}`))[0];
const { esc, jsq } = new Function(`${fn('esc')}\n${fn('jsq')}\nreturn { esc, jsq };`)();
// o navegador desfaz as entidades do atributo antes de rodar o JS do onclick
const desfaz = s => s.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

for (const nome of ["x');alert(1);//", 'a"b', '\\\'); fetch(1); //', '</script><img src=x onerror=alert(1)>', 'Maria D\'Ávila', '', null]) {
  const atributo = jsq(nome);
  assert.ok(!atributo.includes('"') && !atributo.includes("'"), 'nada fecha o atributo nem a string');
  assert.strictEqual(JSON.parse(desfaz(atributo)), nome == null ? '' : String(nome), 'o JS recebe o texto igual');
}

// nenhum handler inline sobrou com a forma antiga
assert.ok(!/on[a-z]+="[^"]*'\$\{/.test(html), 'handler inline com aspa simples em volta de variavel');
console.log('ok: xss');
