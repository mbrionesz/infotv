export const fs = {
  readFileSync(file) {
    if (/seeds-fallback\.json$/.test(file)) return '[]';
    const value = localStorage.getItem('infotv.cache.' + file);
    if (value === null) throw new Error('ENOENT'); return value;
  },
  writeFileSync(file, value) { try { localStorage.setItem('infotv.cache.' + file, String(value)); } catch (_) {} }
};
export const path = { join: (...parts) => parts.join('/').replace(/\/+/g, '/') };
export const os = { tmpdir: () => '/widget' };
export const url = {
  parse(value) {
    const parsed = new URL(value);
    return { href: parsed.href, hostname: parsed.hostname, host: parsed.host, protocol: parsed.protocol,
      port: parsed.port, path: parsed.pathname + parsed.search, pathname: parsed.pathname, search: parsed.search };
  },
  resolve: (base, relative) => new URL(relative, base).href
};
// Widget networking uses the TV's configured resolver and certificate store.
export const dnsx = { prepare: (options, callback) => callback(null, options) };
export const upstream = { agentFor: () => undefined };
