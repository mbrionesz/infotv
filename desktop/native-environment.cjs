'use strict';
const path=require('node:path');
function nativeEnvironment(executable,source=process.env){const env={...source};for(const key of Object.keys(env))if(/^(OPENSSL_(?:CONF|CONF_INCLUDE|MODULES|ENGINES|ia32cap)|SSL_CERT_FILE|SSL_CERT_DIR)$/i.test(key))delete env[key];
 // The decoder receives loopback HTTP only. Remote TLS is verified by Node.
 // Do not load a global/provider configuration for another OpenSSL architecture.
 env.OPENSSL_CONF=path.join(path.dirname(executable),'xuperwindows-openssl.cnf');return env;
}
module.exports={nativeEnvironment};
