import { senhaConfere, DESAFIO } from './lib/senha.js';

export const config = { runtime: 'nodejs' }; // node:crypto na checagem

// Tranca o site inteiro (pagina e API): o navegador pede a senha uma vez.
export default function middleware(request) {
  if (senhaConfere(request.headers.get('authorization'), process.env.PEDIDOS_SENHA)) {
    // mesmo retorno do next() de @vercel/functions, sem puxar 25 pacotes por uma linha
    return new Response(null, { headers: { 'x-middleware-next': '1' } });
  }
  return new Response('Acesso restrito.', {
    status: 401,
    headers: { 'WWW-Authenticate': DESAFIO, 'Cache-Control': 'no-store' },
  });
}
