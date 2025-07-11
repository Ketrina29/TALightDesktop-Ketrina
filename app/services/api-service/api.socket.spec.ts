
import { Packets } from './api.packets';
import { TALightSocket } from './api.socket';
import { WebSocketFactory } from './web-socket-factory';
import { WebSocketSubject } from 'rxjs/webSocket';

describe('TALightSocket', () => {
  let mockWebSocket: jasmine.SpyObj<WebSocketSubject<any>>;

  beforeEach(() => {
    mockWebSocket = jasmine.createSpyObj<WebSocketSubject<any>>(
      'WebSocketSubject',
      ['subscribe', 'next', 'unsubscribe', 'complete'],
      { closed: false }
    );

    // Kjo është çelësi që TALightSocket të mos krijojë websocket real
   spyOn(WebSocketFactory, 'createWebSocket').and.returnValue(mockWebSocket);
  });
  it('should create websocket and be open', () => {
    const socket = new TALightSocket('ws://testserver');
    expect(WebSocketFactory.createWebSocket).toHaveBeenCalled();
    expect(socket.isOpen()).toBeTrue(); // sepse mockWebSocket.closed = false
  });
  it('should send packet when socket is open', () => {
    const socket = new TALightSocket('ws://testserver');
    const request = { toPacket: () => 'mock-packet' };

    const result = socket.send(request as any);

    expect(result).toBeTrue();
    expect(mockWebSocket.next).toHaveBeenCalledWith('mock-packet');
  });
it('should return false and call onError if socket is closed in sendBinary()', () => {
  Object.defineProperty(mockWebSocket, 'closed', { value: true });
  const socket = new TALightSocket('ws://mock');
  const errorSpy = jasmine.createSpy();
  socket.onError = errorSpy;

  const result = socket.sendBinary('data');

  expect(result).toBeFalse();
  expect(errorSpy).toHaveBeenCalledWith(
    'TALightSocket:sendBinary: unable to send, socket is null'
  );
});

it('should call onError and return false when send() fails due to closed ws', () => {
  // 👇 vendose mbylljen përpara krijimit
  Object.defineProperty(mockWebSocket, 'closed', { value: true });
  const socket = new TALightSocket('ws://mock');
  
  const errorSpy = jasmine.createSpy();
  socket.onError = errorSpy;

  const result = socket.send({ toPacket: () => 'packet' } as any);

  expect(result).toBeFalse();
  expect(errorSpy).toHaveBeenCalledWith(
    'TALightSocket:send: unable to send, socket is null'
  );
});

it('should do nothing when didRecieve receives empty ArrayBuffer', () => {
  const socket = new TALightSocket('ws://mock');
  const buffer = new ArrayBuffer(0);
  const spy = jasmine.createSpy();
  socket.onReciveBinary = spy;

  socket.didRecieve({ data: buffer } as MessageEvent);

  expect(spy).not.toHaveBeenCalled();
});
it('should call onError when didRecieve receives invalid JSON string', () => {
  const socket = new TALightSocket('ws://mock');
  const errorSpy = jasmine.createSpy();
  socket.onError = errorSpy;

  const invalidJson = "<<<@@@}}";

  socket.didRecieve({ data: invalidJson } as MessageEvent);

  expect(errorSpy).toHaveBeenCalled();
  const message = errorSpy.calls.mostRecent().args[0];
  expect(message).toContain('Invalid JSON'); // ose 'SyntaxError'
});



it('should decode ArrayBuffer and call onReciveBinary if decode = true', () => {
  const socket = new TALightSocket('ws://mock');
  const binarySpy = jasmine.createSpy();
  socket.onReciveBinary = binarySpy;

  const buffer = new TextEncoder().encode('hello world').buffer;
  socket.didRecieve({ data: buffer } as MessageEvent);

  expect(binarySpy).toHaveBeenCalledWith('hello world');
});

it('should call onReciveUndecodedBinary if decode = false', () => {
  const socket = new TALightSocket('ws://mock');
  socket.decode = false;

  const binarySpy = jasmine.createSpy();
  socket.onReciveUndecodedBinary = binarySpy;

  const buffer = new TextEncoder().encode('rawdata').buffer;
  socket.didRecieve({ data: buffer } as MessageEvent);

  expect(binarySpy).toHaveBeenCalledWith(buffer);
});
it('should call onError callback from didError()', () => {
  const socket = new TALightSocket('ws://mock');
  const errorSpy = jasmine.createSpy();
  socket.onError = errorSpy;

  socket.didError('test-error');

  expect(errorSpy).toHaveBeenCalledWith('test-error');
});
it('should call unsubscribe, complete, and onClose in didClose()', () => {
  const socket = new TALightSocket('ws://mock');
  const closeSpy = jasmine.createSpy();
  socket.onClose = closeSpy;

  socket.didClose();

  expect(mockWebSocket.unsubscribe).toHaveBeenCalled();
  expect(mockWebSocket.complete).toHaveBeenCalled();
  expect(closeSpy).toHaveBeenCalled();
});
it('should not throw error when didRecieve gets invalid JSON', () => {
  const socket = new TALightSocket('ws://mock');
  const spy = jasmine.createSpy();
  socket.onRecive = spy;

  const invalidJson = "<<<@@@}}";

  expect(() => socket.didRecieve({ data: invalidJson } as MessageEvent)).not.toThrow();
  expect(spy).not.toHaveBeenCalled(); 
});

it('should call ws.next with encoded buffer in sendBinary()', () => {
  const socket = new TALightSocket('ws://mock');
  const data = 'hello world';
  const encoded = new TextEncoder().encode(data);

  const result = socket.sendBinary(data);

  expect(result).toBeTrue();
  expect(mockWebSocket.next).toHaveBeenCalledWith(encoded.buffer);
});


});

describe('Packets.Request.Handshake', () => {
  it('should have default magic and version', () => {
    const hs = new Packets.Request.Handshake();
    expect(hs.magic).toBe('rtal');
    expect(hs.version).toBe(4);
  });
});

describe('Packets.Request.MetaList', () => {
  it('should instantiate without error', () => {
    const metaList = new Packets.Request.MetaList();
    expect(metaList instanceof Packets.Request.MetaList).toBeTrue();
  });
});

describe('Packets.Request.Attachment', () => {
  it('should store problem name correctly', () => {
    const att = new Packets.Request.Attachment('prob1');
    expect(att.problem).toBe('prob1');
  });
});

describe('Packets.Request.ConnectBegin', () => {
  it('should initialize with all values', () => {
    const args = { input: 'data' };
    const cb = new Packets.Request.ConnectBegin('probX', 'svcY', args, true, 'tok', ['f1']);
    expect(cb.problem).toBe('probX');
    expect(cb.service).toBe('svcY');
    expect(cb.args).toEqual(args);
    expect(cb.tty).toBeTrue();
    expect(cb.token).toBe('tok');
    expect(cb.files).toContain('f1');
  });
});

describe('Packets.Request.BinaryDataHeader', () => {
  it('should initialize with name, size, hash', () => {
    const bdh = new Packets.Request.BinaryDataHeader('file.txt', 123, [1, 2, 3]);
    expect(bdh.name).toBe('file.txt');
    expect(bdh.size).toBe(123);
    expect(bdh.hash).toEqual([1, 2, 3]);
  });
});

describe('Packets.Request.ConnectStop', () => {
  it('should instantiate without error', () => {
    const stop = new Packets.Request.ConnectStop();
    expect(stop instanceof Packets.Request.ConnectStop).toBeTrue();
  });
});

// Testimi për klasat Reply

describe('Packets.Reply.Attachment', () => {
  it('should initialize with default status', () => {
    const att = new Packets.Reply.Attachment();
    expect(att.status).toEqual({ Ok: undefined, Err: '' });
  });
});

describe('Packets.Reply.ConnectBegin', () => {
  it('should initialize with default status', () => {
    const cb = new Packets.Reply.ConnectBegin();
    expect(cb.status).toEqual({ Ok: [''], Err: '' });
  });
});

describe('Packets.Reply.ConnectStart', () => {
  it('should initialize with default status', () => {
    const cs = new Packets.Reply.ConnectStart();
    expect(cs.status).toEqual({ Ok: undefined, Err: '' });
  });
});

describe('Packets.Reply.ConnectStop', () => {
  it('should initialize with default status', () => {
    const stop = new Packets.Reply.ConnectStop();
    expect(stop.status).toEqual({ Ok: [''], Err: '' });
  });
});

describe('Packets.Reply.BinaryDataHeader', () => {
  it('should initialize with empty values', () => {
    const bdh = new Packets.Reply.BinaryDataHeader();
    expect(bdh.name).toBe('');
    expect(bdh.size).toBe('');
    expect(bdh.hash).toBe('');
  });
});

