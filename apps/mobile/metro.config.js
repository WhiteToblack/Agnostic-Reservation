const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');
const repoRoot = path.resolve(workspaceRoot, '..');

/**
 * Extend the default Expo Metro configuration so the mobile app can import
 * shared packages that live outside of the project root (e.g. ../../shared).
 * Without this Metro cannot resolve modules above the app directory which
 * causes bundling errors when importing shared localization utilities.
 */
const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot, repoRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
  path.resolve(repoRoot, 'node_modules'),
];
config.resolver.disableHierarchicalLookup = true;
config.resolver.unstable_enableSymlinks = true;

module.exports = config;
