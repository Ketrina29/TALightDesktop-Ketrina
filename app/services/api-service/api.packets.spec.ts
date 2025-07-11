import { Packets } from './api.packets';

describe('Packets.PacketsPayload', () => {
  it('should parse valid JSON data into packets and types', () => {
    const json = JSON.stringify({ MetaList: { meta: {} }, AnotherPacket: {} });
    const payload = new Packets.PacketsPayload(json);

    expect(payload.packetTypes).toContain('MetaList');
    expect(payload.packetTypes).toContain('AnotherPacket');
    expect(payload.packets.MetaList).toBeDefined();
  });

  it('should return message from getMessage if type matches', () => {
    class DummyMessage extends Packets.Message {
  value: string = '';
  override fromPacket(packet: any) {
    this.value = packet.value;
    return true;
  }
}

    const json = JSON.stringify({ DummyMessage: { value: 'hello' } });
    const payload = new Packets.PacketsPayload(json);
    const msg = payload.getMessage(DummyMessage);

    expect(msg).toBeTruthy();
    expect(msg?.value).toBe('hello');
  });

  it('should return null from getMessage if type not present', () => {
    class NotPresent extends Packets.Message {}
    const json = JSON.stringify({ SomethingElse: {} });
    const payload = new Packets.PacketsPayload(json);
    const msg = payload.getMessage(NotPresent);

    expect(msg).toBeNull();
  });
});

describe('Packets.Meta', () => {
  it('should construct Meta with nested services', () => {
    const data = {
      public_folder: 'public/',
      services: {
        echo: {
          evaluator: ['bash'],
          files: ['a.txt'],
          args: { input: { regex: /.*/, default: 'test' } }
        }
      }
    };
    const meta = new Packets.Meta(data);
    expect(meta.public_folder).toBe('public/');
    expect(meta.services.get('echo')).toBeDefined();
  });
});

describe('Packets.Service', () => {
  it('should construct with files and args', () => {
    const data = {
      evaluator: ['sh'],
      files: ['script.sh'],
      args: { name: { regex: /^[a-z]+$/, default: 'test' } }
    };
    const service = new Packets.Service(data);
    expect(service.files).toContain('script.sh');
    expect(service.args?.get('name')).toBeDefined();
  });
});

describe('Packets.Arg', () => {
  it('should store regex and default', () => {
    const arg = new Packets.Arg({ regex: /\d+/, default: '123' });
    expect(arg.regex.test('456')).toBeTrue();
    expect(arg.default).toBe('123');
  });
});

describe('Packets.Message.fromPacket', () => {
  it('should copy primitive values from packet', () => {
    class TestMessage extends Packets.Message {
      a: string = '';
      b: number = 0;
    }

    const msg = new TestMessage();
    msg.fromPacket({ a: 'hello', b: 42 });
    expect(msg.a).toBe('hello');
    expect(msg.b).toBe(42);
  });

  it('should ignore unknown fields in packet', () => {
    class TestMessage extends Packets.Message {
      known: string = '';
    }

    const msg = new TestMessage();
    msg.fromPacket({ known: 'yes', unknown: 'nope' });
    expect(msg.known).toBe('yes');
    expect((msg as any).unknown).toBeUndefined();
  });
});
describe('Packets.PacketsPayload', () => {
  it('should parse valid JSON data into packets and types', () => {
    const json = JSON.stringify({ MetaList: { meta: {} }, AnotherPacket: {} });
    const payload = new Packets.PacketsPayload(json);

    expect(payload.packetTypes).toContain('MetaList');
    expect(payload.packetTypes).toContain('AnotherPacket');
    expect(payload.packets.MetaList).toBeDefined();
  });

  it('should return message from getMessage if type matches', () => {
    class DummyMessage extends Packets.Message {
      value: string = '';
      override fromPacket(packet: any) { this.value = packet.value; return true; }
    }

    const json = JSON.stringify({ DummyMessage: { value: 'hello' } });
    const payload = new Packets.PacketsPayload(json);
    const msg = payload.getMessage(DummyMessage);

    expect(msg).toBeTruthy();
    expect(msg?.value).toBe('hello');
  });

  it('should return null from getMessage if type not present', () => {
    class NotPresent extends Packets.Message {}
    const json = JSON.stringify({ SomethingElse: {} });
    const payload = new Packets.PacketsPayload(json);
    const msg = payload.getMessage(NotPresent);

    expect(msg).toBeNull();
  });
});

describe('Packets.Meta', () => {
  it('should construct Meta with nested services', () => {
    const data = {
      public_folder: 'public/',
      services: {
        echo: {
          evaluator: ['bash'],
          files: ['a.txt'],
          args: { input: { regex: /.*/, default: 'test' } }
        }
      }
    };
    const meta = new Packets.Meta(data);
    expect(meta.public_folder).toBe('public/');
    expect(meta.services.get('echo')).toBeDefined();
  });
});

describe('Packets.Service', () => {
  it('should construct with files and args', () => {
    const data = {
      evaluator: ['sh'],
      files: ['script.sh'],
      args: { name: { regex: /^[a-z]+$/, default: 'test' } }
    };
    const service = new Packets.Service(data);
    expect(service.files).toContain('script.sh');
    expect(service.args?.get('name')).toBeDefined();
  });
});

describe('Packets.Arg', () => {
  it('should store regex and default', () => {
    const arg = new Packets.Arg({ regex: /\d+/, default: '123' });
    expect(arg.regex.test('456')).toBeTrue();
    expect(arg.default).toBe('123');
  });
});

describe('Packets.Message.fromPacket', () => {
  it('should copy primitive values from packet', () => {
    class TestMessage extends Packets.Message {
      a: string = '';
      b: number = 0;
    }

    const msg = new TestMessage();
    msg.fromPacket({ a: 'hello', b: 42 });
    expect(msg.a).toBe('hello');
    expect(msg.b).toBe(42);
  });

  it('should ignore unknown fields in packet', () => {
    class TestMessage extends Packets.Message {
      known: string = '';
    }

    const msg = new TestMessage();
    msg.fromPacket({ known: 'yes', unknown: 'nope' });
    expect(msg.known).toBe('yes');
    expect((msg as any).unknown).toBeUndefined();
  });
});

describe('Packets.Reply.MetaList', () => {
  it('should construct with meta map', () => {
    const input = {
      meta: {
        ex1: {
          public_folder: 'p/',
          services: {
            compile: {
              evaluator: ['gcc'],
              files: ['main.c'],
              args: {
                flag: { regex: /-O.*/, default: '-O2' }
              }
            }
          }
        }
      }
    };

    const metaList = new Packets.Reply.MetaList(input);
    expect(metaList.meta.get('ex1')).toBeDefined();
    expect(metaList.meta.get('ex1')?.services.get('compile')).toBeDefined();
  });
});

describe('Packets.Reply.Result', () => {
it('should handle Result with Ok', () => {
  const result = new Packets.Reply.Result({ Ok: ['done'] });
expect(result.Ok).toEqual(['done']);            // ✅
expect(result.Err).toBeNull();                  // ✅
expect(result.success()).toBeTrue()     // dështoi: ishte false
});


  it('should handle Result with Err', () => {
    const result = new Packets.Reply.Result({ Err: 'fail' });
expect(result.Err).toBe('fail');                // ✅
expect(result.Ok).toBeNull();                   // ✅
expect(result.success()).toBeFalse();  
  });

  it('should return true when no error in result', () => {
    const result = new Packets.Reply.Result({});
    expect(result.success()).toBeTrue();
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
