import { PyodideProjectEnvironment } from './python-compiler.types';
import { ProjectDriver } from '../project-manager-service/project-manager.types';

describe('PyodideProjectEnvironment', () => {
  let env: PyodideProjectEnvironment;
  let mockDriver: jasmine.SpyObj<ProjectDriver>;

  beforeEach(() => {
    env = new PyodideProjectEnvironment();
    mockDriver = jasmine.createSpyObj<ProjectDriver>('ProjectDriver', [
      'createDirectory',
      'writeFile',
      'exists'
    ]);

    mockDriver.createDirectory.and.resolveTo(true);
    mockDriver.writeFile.and.resolveTo();
    mockDriver.exists.and.resolveTo(false); // Default: file doesn't exist
  });

  it('should create basic files and folders when CREATE_EXAMPLES is false', async () => {
    env.config.CREATE_EXAMPLES = false;

    const result = await env['createExample'](mockDriver);

    expect(result).toBeTrue();
    expect(mockDriver.createDirectory).toHaveBeenCalledWith(env.config.DIR_PROJECT);
    expect(mockDriver.writeFile).toHaveBeenCalledWith(env.config.CONFIG_PATH, jasmine.any(String));
    expect(mockDriver.writeFile).toHaveBeenCalledWith(env.config.RUN, jasmine.any(String));
  });

  it('should skip writing files that already exist', async () => {
    mockDriver.exists.and.callFake(async (path: string) => path === env.config.RUN);

    await env['createExample'](mockDriver);

    expect(mockDriver.writeFile).not.toHaveBeenCalledWith(env.config.RUN, jasmine.anything());
  });

  it('should create examples if CREATE_EXAMPLES is true', async () => {
    env.config.CREATE_EXAMPLES = true;

    const result = await env['createExample'](mockDriver);

    expect(result).toBeTrue();
    expect(mockDriver.createDirectory).toHaveBeenCalledWith(env.config.DIR_EXAMPLES);
  });
});
