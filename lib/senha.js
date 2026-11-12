// Senha unica do painel: variavel PEDIDOS_SENHA na Vercel.
// Sem a variavel, ou com ela curta, nada abre (falha fechada).
const { createHash, timingSafeEqual } = require('node:crypto');

const DESAFIO = 'Basic realm="Pedidos Emporio", charset="UTF-8"';

function senhaConfere(cabecalho, senha) {
  if (typeof senha !== 'string' || senha.length < 16 || typeof cabecalho !== 'string') return false;
  const m = /^Basic ([A-Za-z0-9+/=]+)$/.exec(cabecalho.trim());
  if (!m) return false;
  const par = Buffer.from(m[1], 'base64').toString('utf8');
  if (!par.includes(':')) return false;
  const dada = par.slice(par.indexOf(':') + 1); // o usuario digitado nao importa
  const h = (s) => createHash('sha256').update(s, 'utf8').digest();
  return timingSafeEqual(h(dada), h(senha));
}

module.exports = { senhaConfere, DESAFIO };
