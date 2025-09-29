'use strict';

const path = require.resolve('react-scripts/config/webpackDevServer.config');
const createDevServerConfig = require(path);

require.cache[path].exports = (proxy, allowedHost) => {
  const config = createDevServerConfig(proxy, allowedHost);

  if (Array.isArray(config.allowedHosts)) {
    config.allowedHosts = config.allowedHosts.filter(
      (host) => typeof host === 'string' && host.trim().length > 0,
    );

    if (config.allowedHosts.length === 0) {
      config.allowedHosts = 'auto';
    }
  }

  return config;
};

require('react-scripts/scripts/start');
