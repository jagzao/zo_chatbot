import { logger, LogLevel, createLogger } from '../logger';

describe('Logger', () => {
  // Mock console methods
  const originalConsole = {
    debug: console.debug,
    info: console.info,
    warn: console.warn,
    error: console.error,
  };

  beforeEach(() => {
    console.debug = jest.fn();
    console.info = jest.fn();
    console.warn = jest.fn();
    console.error = jest.fn();
  });

  afterEach(() => {
    console.debug = originalConsole.debug;
    console.info = originalConsole.info;
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;
  });

  describe('Basic logging', () => {
    it('should log info messages', () => {
      logger.info('Test message');
      expect(console.info).toHaveBeenCalled();
    });

    it('should log with context', () => {
      logger.info('Test message', { userId: '123' });
      expect(console.info).toHaveBeenCalled();
      const loggedData = JSON.parse((console.info as jest.Mock).mock.calls[0][0]);
      expect(loggedData.context.userId).toBe('123');
    });

    it('should log errors with stack trace', () => {
      const error = new Error('Test error');
      logger.error('Error occurred', {}, error);
      expect(console.error).toHaveBeenCalled();
      const loggedData = JSON.parse((console.error as jest.Mock).mock.calls[0][0]);
      expect(loggedData.error.message).toBe('Test error');
      expect(loggedData.error.stack).toBeDefined();
    });
  });

  describe('Child logger', () => {
    it('should create child logger with default context', () => {
      const childLogger = createLogger({ organizationId: 'org-123' });
      childLogger.info('Test message');

      expect(console.info).toHaveBeenCalled();
      const loggedData = JSON.parse((console.info as jest.Mock).mock.calls[0][0]);
      expect(loggedData.context.organizationId).toBe('org-123');
    });

    it('should merge child context with additional context', () => {
      const childLogger = createLogger({ organizationId: 'org-123' });
      childLogger.info('Test message', { userId: 'user-456' });

      const loggedData = JSON.parse((console.info as jest.Mock).mock.calls[0][0]);
      expect(loggedData.context.organizationId).toBe('org-123');
      expect(loggedData.context.userId).toBe('user-456');
    });
  });

  describe('Log levels', () => {
    it('should include timestamp', () => {
      logger.info('Test message');
      const loggedData = JSON.parse((console.info as jest.Mock).mock.calls[0][0]);
      expect(loggedData.timestamp).toBeDefined();
      expect(new Date(loggedData.timestamp)).toBeInstanceOf(Date);
    });

    it('should include log level', () => {
      logger.info('Test message');
      const loggedData = JSON.parse((console.info as jest.Mock).mock.calls[0][0]);
      expect(loggedData.level).toBe(LogLevel.INFO);
    });

    it('should include message', () => {
      logger.info('Test message');
      const loggedData = JSON.parse((console.info as jest.Mock).mock.calls[0][0]);
      expect(loggedData.message).toBe('Test message');
    });
  });
});
