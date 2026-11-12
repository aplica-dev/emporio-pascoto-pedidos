// Rodar: node lib/senha.test.js
const assert = require('node:assert');
const { senhaConfere } = require('./senha');

const S = 'senha-de-teste-bem-longa';
const basic = (u, p) => 'Basic ' + Buffer.from(`${u}:${p}`).toString('base64');

assert.ok(senhaConfere(basic('emporio', S), S));
assert.ok(senhaConfere(basic('', S), S), 'usuario nao importa');
assert.ok(senhaConfere(basic('a', 'com:dois:pontos-e-longa'), 'com:dois:pontos-e-longa'));
assert.ok(!senhaConfere(basic('emporio', S + 'x'), S));
assert.ok(!senhaConfere(basic('emporio', ''), S));
assert.ok(!senhaConfere(undefined, S));
assert.ok(!senhaConfere(null, S));
assert.ok(!senhaConfere('Bearer ' + S, S));
assert.ok(!senhaConfere(basic('a', 'curta'), 'curta'), 'senha curta na Vercel nao abre');
assert.ok(!senhaConfere(basic('a', 'x'), undefined), 'sem variavel fica tudo trancado');

async function api() {
  const handler = require('../api/index.js');
  const chamar = async (req) => {
    const res = { code: 200, h: {}, body: null };
    res.status = (c) => { res.code = c; return res; };
    res.json = (b) => { res.body = b; return res; };
    res.setHeader = (k, v) => { res.h[k] = v; };
    res.end = () => res;
    await handler({ query: {}, body: {}, ...req }, res);
    return res;
  };
  process.env.PEDIDOS_SENHA = S;
  delete process.env.TURSO_DATABASE_URL;

  let r = await chamar({ method: 'GET', url: '/api/clients', headers: {} });
  assert.strictEqual(r.code, 401);
  assert.match(r.h['WWW-Authenticate'], /^Basic /);

  r = await chamar({ method: 'POST', url: '/api/import', headers: { authorization: basic('x', 'errada-mas-bem-longa') } });
  assert.strictEqual(r.code, 401);

  r = await chamar({ method: 'POST', url: '/api/import', headers: { authorization: basic('x', S), 'sec-fetch-site': 'cross-site' } });
  assert.strictEqual(r.code, 403, 'outro site nao muda dado');

  r = await chamar({ method: 'GET', url: '/api', headers: { authorization: basic('x', S) } });
  assert.strictEqual(r.code, 200, 'com a senha passa');

  r = await chamar({ method: 'POST', url: '/api/import', headers: { authorization: basic('x', S), 'sec-fetch-site': 'same-origin' }, body: { clients: [], orders: [] } });
  assert.notStrictEqual(r.code, 401);

  delete process.env.PEDIDOS_SENHA;
  r = await chamar({ method: 'GET', url: '/api', headers: { authorization: basic('x', S) } });
  assert.strictEqual(r.code, 401, 'sem variavel na Vercel ninguem entra');

  const mw = (await import('../middleware.js')).default;
  process.env.PEDIDOS_SENHA = S;
  const sem = mw(new Request('https://x/'));
  assert.strictEqual(sem.status, 401);
  const com = mw(new Request('https://x/', { headers: { authorization: basic('x', S) } }));
  assert.strictEqual(com.headers.get('x-middleware-next'), '1');
}

api().then(() => console.log('ok: senha, API e middleware'), (e) => { console.error(e); process.exit(1); });
