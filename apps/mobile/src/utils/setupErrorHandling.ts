const globalScope = globalThis as typeof globalThis & {
  __AGNOSTIC_ERROR_HANDLER__?: boolean;
  ErrorUtils?: {
    setGlobalHandler?: (
      handler: (error: unknown, isFatal?: boolean) => void,
    ) => void;
    getGlobalHandler?: () => ((error: unknown, isFatal?: boolean) => void) | undefined;
  };
  process?: {
    on?: (event: string, listener: (reason: unknown) => void) => void;
  };
};

if (!globalScope.__AGNOSTIC_ERROR_HANDLER__) {
  globalScope.__AGNOSTIC_ERROR_HANDLER__ = true;

  const defaultHandler = globalScope.ErrorUtils?.getGlobalHandler?.();

  const logError = (source: string, error: unknown, isFatal?: boolean) => {
    const prefix = `${source}${isFatal ? ' (fatal)' : ''}`;

    if (error instanceof Error) {
      const stack = error.stack ?? `${error.name}: ${error.message}`;
      console.error(`${prefix}: ${error.message}`);
      console.error(stack);
    } else if (typeof error === 'string') {
      console.error(`${prefix}: ${error}`);
    } else {
      console.error(prefix, error);
    }
  };

  globalScope.ErrorUtils?.setGlobalHandler?.((error, isFatal) => {
    logError('Unhandled JS exception', error, isFatal);
    defaultHandler?.(error, isFatal);
  });

  const onUnhandledRejection = (reason: unknown) => {
    logError('Unhandled promise rejection', reason, false);
  };

  try {
    globalScope.process?.on?.('unhandledRejection', onUnhandledRejection);
  } catch (err) {
    console.warn('Failed to register unhandled rejection handler', err);
  }
}

export {};
