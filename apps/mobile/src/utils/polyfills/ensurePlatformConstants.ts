type TurboModuleProxy = ((moduleName: string) => unknown) & {
  __agnosticPatched__?: boolean;
};

type GlobalWithTurboModules = typeof globalThis & {
  __turboModuleProxy?: TurboModuleProxy;
  __agnosticPlatformConstantsPatched__?: boolean;
};

const globalScope = globalThis as GlobalWithTurboModules;

const FALLBACK_CONSTANTS = {
  forceTouchAvailable: false,
  interfaceIdiom: 'unknown',
  isTesting: false,
  osVersion: null as string | null,
  reactNativeVersion: { major: 0, minor: 0, patch: 0, prerelease: null as number | null },
  systemName: 'unknown',
  isTV: false,
};

const fallbackModule = {
  getConstants: () => FALLBACK_CONSTANTS,
};

const ensurePlatformConstants = () => {
  if (globalScope.__agnosticPlatformConstantsPatched__) {
    return;
  }

  const proxy = globalScope.__turboModuleProxy;

  if (typeof proxy === 'function') {
    const originalProxy = proxy;

    if (!originalProxy.__agnosticPatched__) {
      const patchedProxy: TurboModuleProxy = (moduleName: string) => {
        const resolved = originalProxy(moduleName);

        if (resolved == null && moduleName === 'PlatformConstants') {
          return fallbackModule;
        }

        return resolved;
      };

      patchedProxy.__agnosticPatched__ = true;
      globalScope.__turboModuleProxy = patchedProxy;
    }
  }

  globalScope.__agnosticPlatformConstantsPatched__ = true;
};

ensurePlatformConstants();

export {};
