import { TestBed } from '@angular/core/testing';

import { FsService } from './fs.service';
import { IndexeddbFsDriver } from './fs.service.test';
import { FsNodeFolder, FsServiceDriver } from './fs.service.types';
import fs from 'indexeddb-fs';

describe('FsService', () => {
let fs:FsService;

 let service: FsService;

beforeEach(async () => {
  service = new FsService();
  const driver = service.getDriver('indexeddb');
  if (!driver) throw new Error('Driver not found');

  await driver.ready(); // 🔧 Sigurohu që është gati
});

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
it('DEBUG: create and read back', async () => {
  const dir = '/test-dir';
  const file = '/test-dir/test.txt';
  const content = 'Hello from test!';

  const created = await service.createDirectory(dir);
  console.log(`[DEBUG] createDirectory(${dir}) = ${created}`);
  expect(created).toBeTrue();

  const exists = await service.exists(dir);
  console.log(`[DEBUG] exists(${dir}) = ${exists}`);
  expect(exists).toBeTrue();

  const written = await service.writeFile(file, content);
  console.log(`[DEBUG] writeFile(${file}) = ${written}`);
  expect(written).toBeGreaterThan(0);

  const read = await service.readFile(file);
  console.log(`[DEBUG] readFile(${file}) =`, read);
  expect(read).toEqual(content);
});
it('should create a directory and verify existence', async () => {
  const path = '/dir';
  const created = await service.createDirectory(path);
  expect(created).toBeTrue();

  const exists = await service.exists(path);
  expect(exists).toBeTrue();
});
it('should write a file and read the same content back', async () => {
  const path = '/file.txt';
  const content = 'Hello World';
  await service.writeFile(path, content);

  const result = await service.readFile(path);
  expect(result).toEqual(content);
});
it('should delegate readDirectory to driver if registered', async () => {
  const mockDriver = {
    readDirectory: jasmine.createSpy().and.resolveTo({ name: 'test', path: '/', files: [], folders: [] }),
  } as any;

  const fsService = new FsService();
  fsService.registerDriver('indexeddb', mockDriver);

  const result = await fsService.readDirectory('/');
  expect(mockDriver.readDirectory).toHaveBeenCalledWith('/');
  expect(result).toEqual({ name: 'test', path: '/', files: [], folders: [] });
});

  it('should return undefined for unknown driver and trigger warning', () => {
    spyOn(console, 'warn');
    const driver = service.getDriver('nonexistent');
    expect(driver).toBeUndefined();
    expect(console.warn).toHaveBeenCalledWith(
      'nonexistent NOT found in: ' + service.getDriverNames() + " | getDriver: undefined !!!"
    );
  });

 
  it('treeToList should return flat list of all files and folders', () => {
    const root = {
      name: 'root',
      path: '/',
      files: [{ name: 'file1.txt', path: '/file1.txt', content: 'Hello' }],
      folders: [
        {
          name: 'sub/',
          path: '/sub',
          files: [{ name: 'file2.txt', path: '/sub/file2.txt', content: 'World' }],
          folders: [],
        }
      ]
    };

    const result = service.treeToList(root);
    expect(result.length).toBe(3);
    expect(result.some(i => i.path === '/file1.txt')).toBeTrue();
    expect(result.some(i => i.path === '/sub/file2.txt')).toBeTrue();
    expect(result.some(i => i.path === '/sub')).toBeTrue();
  });

  it('treeToList should return empty list for empty folder', () => {
    const root = { name: '', path: '/', files: [], folders: [] };
    const result = service.treeToList(root);
    expect(result.length).toBe(0);
  });
  it('should register a driver and retrieve it by name', () => {
    const mockDriver: FsServiceDriver = {
      driverName: 'mock',
      mountPoint: '/',
      fsRoot: { name: '', path: '/', files: [], folders: [] },
      ready: async () => true,
      createDirectory: async () => true,
      writeFile: async () => 0,
      readFile: async () => '',
      readDirectory: async () => null,
      delete: async () => true,
      mount: async () => true,
      unmount: async () => true,
      scanDirectory: async () => ({ name: '', path: '/', files: [], folders: [] }),
     
      exists: async () => true,
      renameItem: async () => true,
    };

    const result = service.registerDriver('mock', mockDriver);
    expect(result).toBeTrue();

    const driver = service.getDriver('mock');
    expect(driver).toBe(mockDriver);
  });

  it('should return undefined for unknown driver and trigger warning', () => {
    spyOn(console, 'warn');
    const driver = service.getDriver('nonexistent');
    expect(driver).toBeUndefined();
    expect(console.warn).toHaveBeenCalledWith(
      'nonexistent NOT found in: ' + service.getDriverNames() + " | getDriver: undefined !!!"
    );
  });

  it('should list registered driver names', () => {
    service.registerDriver('driver1', {} as FsServiceDriver);
    service.registerDriver('driver2', {} as FsServiceDriver);
    const names = service.getDriverNames();
    expect(names).toContain('driver1');
    expect(names).toContain('driver2');
  });
  it('should return list of registered driver names', () => {
  const fsService = new FsService();
  const names = fsService.getDriverNames();
  expect(names).toContain('indexeddb');
});
it('should return undefined for non-existent driver', () => {
  const fsService = new FsService();
  const driver = fsService.getDriver('nonexistent');
  expect(driver).toBeUndefined();
});
it('treeToList should return empty list for empty folder', () => {
  const fsService = new FsService();
  const emptyFolder = { name: '', path: '/', files: [], folders: [] };
  const result = fsService.treeToList(emptyFolder);
  expect(result.length).toBe(0);
});
it('should throw error when no driver is registered for readDirectory', async () => {
  const fsService = new FsService();
  fsService.drivers.clear(); // heq driverin ekzistues
  await expectAsync(fsService.readDirectory('/')).toBeRejectedWithError('No file system driver registered.');
});
it('should throw error when no driver is registered for writeFile', async () => {
  const fsService = new FsService();
  fsService.drivers.clear();
  await expectAsync(fsService.writeFile('/file.txt', 'hello')).toBeRejectedWithError('No file system driver registered.');
});
it('should be created and register default driver', () => {
  const fsService = new FsService();
  expect(fsService.getDriver('indexeddb')).toBeDefined();
});
it('should throw error when no driver is registered for createDirectory', async () => {
  const fsService = new FsService();
  fsService.drivers.clear(); // hiq të gjithë driverët
  await expectAsync(fsService.createDirectory('/path')).toBeRejectedWithError('No file system driver registered.');
});
it('should throw error when no driver is registered for exists', async () => {
  const fsService = new FsService();
  fsService.drivers.clear(); // hiq të gjithë driverët
  await expectAsync(fsService.exists('/path')).toBeRejectedWithError('No file system driver registered.');
});
it('should throw error when no driver is registered for readFile', async () => {
  const fs = new FsService();
  fs.drivers.clear(); // simulate no driver
  await expectAsync(fs.readFile('/some.txt')).toBeRejectedWithError('No file system driver registered.');
});
it('should return undefined for unregistered driver', () => {
  const fs = new FsService();
  const result = fs.getDriver('nonexistent');
  expect(result).toBeUndefined();
});


});

