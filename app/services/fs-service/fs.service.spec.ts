import { FsService } from './fs.service';
import { FsServiceDriver, FsNodeFolder, FsNodeFile } from './fs.service.types';
import { EventEmitter } from '@angular/core';
import { Tar } from './fs.service';
import { xxhash } from './fs.service';
describe('FsService', () => {
  let service: FsService;
  let mockDriver: jasmine.SpyObj<FsServiceDriver>;

  beforeEach(() => {
    service = new FsService();

    mockDriver = jasmine.createSpyObj<FsServiceDriver>('FsServiceDriver', [
      'readDirectory', 'delete', 'readFile', 'writeFile', 'createDirectory', 'exists'
    ]);
    service.registerDriver('indexeddb', mockDriver);
  });

  it('should create service instance', () => {
    expect(service).toBeTruthy();
  });

  describe('Driver registration and retrieval', () => {
    it('should register and retrieve driver', () => {
      expect(service.getDriver('indexeddb')).toBe(mockDriver);
    });

    it('should return undefined for unknown driver and warn', () => {
      spyOn(console, 'warn');
      const driver = service.getDriver('nonexistent');
      expect(driver).toBeUndefined();
      expect(console.warn).toHaveBeenCalled();
    });

    it('should list registered driver names', () => {
      service.registerDriver('mockDriver', {} as FsServiceDriver);
      const names = service.getDriverNames();
      expect(names).toContain('indexeddb');
      expect(names).toContain('mockDriver');
    });
  });

  describe('File system operations delegated to driver', () => {
    it('should create directory and check existence', async () => {
      mockDriver.createDirectory.and.resolveTo(true);
      mockDriver.exists.and.resolveTo(true);

      const created = await service.createDirectory('/dir');
      expect(created).toBeTrue();

      const exists = await service.exists('/dir');
      expect(exists).toBeTrue();
    });

    it('should write and read a file', async () => {
      const content = 'Hello World';
      mockDriver.writeFile.and.resolveTo(content.length);
      mockDriver.readFile.and.resolveTo(content);

      const written = await service.writeFile('/file.txt', content);
      expect(written).toBe(content.length);

      const read = await service.readFile('/file.txt');
      expect(read).toBe(content);
    });

    it('should delete a file', async () => {
      mockDriver.delete.and.resolveTo(true);
      const deleted = await service.delete('/file.txt');
      expect(deleted).toBeTrue();
    });
  });

  describe('Error handling when no drivers registered', () => {
    beforeEach(() => {
      service.drivers.clear();
    });

    it('should throw error on readDirectory', async () => {
      await expectAsync(service.readDirectory('/')).toBeRejectedWithError('No file system driver registered.');
    });

    it('should throw error on writeFile', async () => {
      await expectAsync(service.writeFile('/file.txt', 'content')).toBeRejectedWithError('No file system driver registered.');
    });

    it('should throw error on createDirectory', async () => {
      await expectAsync(service.createDirectory('/dir')).toBeRejectedWithError('No file system driver registered.');
    });

    it('should throw error on exists', async () => {
      await expectAsync(service.exists('/file.txt')).toBeRejectedWithError('No file system driver registered.');
    });
  });

  describe('treeToList utility', () => {
  it('treeToList utility should flatten folder tree into list of files and folders', () => {
  const file1: FsNodeFile = { name: 'file1.txt', path: '/file1.txt', content: 'data1' };
  const file2: FsNodeFile = { name: 'file2.txt', path: '/folder/file2.txt', content: 'data2' };
  const folder1: FsNodeFolder = {
    name: 'folder',
    path: '/folder',
    files: [file2],
    folders: []
  };
  const root: FsNodeFolder = {
    name: 'root',
    path: '/',
    files: [file1],
    folders: [folder1]
  };

  const result = service.treeToList(root);

  // Aspetto che contenga file1, folder1, file2
  expect(result.length).toBe(3);
  expect(result).toContain(file1);
  expect(result).toContain(folder1);
  expect(result).toContain(file2);
});

    it('should return empty list for empty folder', () => {
      const emptyFolder: FsNodeFolder = { name: '', path: '/', files: [], folders: [] };
      const list = service.treeToList(emptyFolder);
      expect(list.length).toBe(0);
    });
  });

});
describe('Tar.unpack', () => {
  it('should correctly unpack files and folders from tarball', (done) => {
    const tarball = new ArrayBuffer(0);

    interface StreamMock {
      on: jasmine.Spy<(event: string, cb: (...args: any[]) => void) => any>;
      resume: jasmine.Spy<() => void>;
    }

    interface ExtractMock {
      on: jasmine.Spy<(event: string, cb: (...args: any[]) => void) => any>;
      write: jasmine.Spy<(data: Uint8Array, cb: (err: any) => void) => void>;
      end: jasmine.Spy<() => void>;
    }

    const mockExtract: ExtractMock = {
      on: jasmine.createSpy('on').and.callFake(function(event: string, cb: (...args: any[]) => void) {
        if (event === 'entry') {
          setTimeout(() => {
            const streamMock: StreamMock = {
              on: jasmine.createSpy('stream.on').and.callFake((e: string, fn: (data?: any) => void) => {
                if (e === 'data') fn(new Uint8Array([1, 2, 3]));
                if (e === 'end') fn();
                return streamMock;
              }),
              resume: jasmine.createSpy('stream.resume')
            };
            cb({ name: 'folder/', type: 'directory' }, streamMock, () => {});
            cb({ name: 'folder/file.txt', type: 'file' }, streamMock, () => {});
          }, 0);
        }
        if (event === 'finish') {
          setTimeout(() => cb(), 10);
        }
        return mockExtract;  // per chaining
      }),
      write: jasmine.createSpy('write').and.callFake((data: Uint8Array, cb: (err: any) => void) => cb(null)),
      end: jasmine.createSpy('end')
    };

    // Mock del getter tarstream
    const originalTarstream = Object.getOwnPropertyDescriptor(Tar, 'tarstream')!.get;
    Object.defineProperty(Tar, 'tarstream', {
      get: () => ({ extract: () => mockExtract }),
      configurable: true
    });

    Tar.unpack(tarball, (files, folders) => {
      expect(folders.length).toBe(1);
      expect(folders[0].name).toBe('folder');
      expect(files.length).toBe(1);
      expect(files[0].path).toBe('folder/file.txt');

      // Ripristina il getter originale
      Object.defineProperty(Tar, 'tarstream', {
        get: originalTarstream,
        configurable: true
      });

      done();
    });
  });
});
describe('Tar.pack', () => {
  it('should correctly pack files and folders into a tarball', (done) => {
    let mockPack: any = null;
    mockPack = {
      on: jasmine.createSpy('on').and.callFake((event: string, cb: (...args: any[]) => void) => {
        if (event === 'data') {
          setTimeout(() => cb(new Uint8Array([1, 2, 3]).buffer), 10);
        }
        if (event === 'end') {
          setTimeout(cb, 20);
        }
        return mockPack;
      }),
      entry: jasmine.createSpy('entry').and.callFake((header: any, content: any, cb: (err: any) => void) => {
        cb(null);
      }),
      finalize: jasmine.createSpy('finalize'),
    };

    const originalTarstream = Object.getOwnPropertyDescriptor(Tar, 'tarstream')!.get;
    Object.defineProperty(Tar, 'tarstream', {
      get: () => ({ pack: () => mockPack }),
      configurable: true,
    });

    const file: FsNodeFile = {
      path: '/file.txt',
      name: 'file.txt',
      content: 'Hello world'
    };

    const folder: FsNodeFolder = {
      path: '/folder',
      name: 'folder',
      files: [],
      folders: []
    };

    Tar.pack([file, folder], (tarball) => {
      expect(mockPack.entry).toHaveBeenCalledTimes(2);
      expect(mockPack.finalize).toHaveBeenCalled();
      expect(tarball).toBeInstanceOf(ArrayBuffer);

      // Ripristina getter originale
      Object.defineProperty(Tar, 'tarstream', {
        get: originalTarstream,
        configurable: true,
      });

      done();
    });
  });
});
describe('xxhash', () => {
  beforeEach(() => {
    spyOn(window, 'fetch').and.returnValue(Promise.resolve(new Response(new ArrayBuffer(8))));

    (window as any).WebAssembly = {
      instantiate: jasmine.createSpy('instantiate').and.returnValue(
        Promise.resolve({
          instance: {
            exports: {
              XXH128: jasmine.createSpy('XXH128'),
            },
          },
        })
      ),
    };
  });

  it('should load wasm and set sharedInstance', async () => {
    await xxhash.load();
    expect(window.fetch).toHaveBeenCalledWith('/assets/xxhsum.wasm');
    expect((window as any).WebAssembly.instantiate).toHaveBeenCalled();
    expect(xxhash.sharedInstance).toBeDefined();
  });

  it('should call XXH128 with correct arguments', async () => {
    xxhash.sharedInstance = {
      XXH128: jasmine.createSpy('XXH128').and.returnValue('hashvalue'),
    };
    const result = await xxhash.xxh128('testdata');
    expect(xxhash.sharedInstance.XXH128).toHaveBeenCalledWith('testdata', 'testdata'.length);
    expect(result).toBe('hashvalue');
  });
});


