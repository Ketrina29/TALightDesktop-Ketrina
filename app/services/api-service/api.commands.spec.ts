import { Commands } from './api.commands';
import { Packets } from './api.packets';

describe('Commands.Command', () => {
  let command: Commands.Command;

  beforeEach(() => {
    command = new Commands.Command('ws://localhost');
    spyOn(console, 'log'); // suppress console logs
  });

  it('should call onClose when didClose is called', () => {
    const onCloseSpy = jasmine.createSpy('onClose');
    command.onClose = onCloseSpy;

    command.didClose();

    expect(onCloseSpy).toHaveBeenCalled();
  });

  it('should call onError when didError is called', () => {
    const onErrorSpy = jasmine.createSpy('onError');
    command.onError = onErrorSpy;

    const error = new Error('test error');
    command.didError(error);

    expect(onErrorSpy).toHaveBeenCalledWith(error);
  });

  it('should call onReciveBinary when didReciveBinary is called', () => {
    const spy = jasmine.createSpy('onReciveBinary');
    command.onReciveBinary = spy;

    command.didReciveBinary('data');

    expect(spy).toHaveBeenCalledWith('data');
  });

  it('should call onReciveUndecodedBinary when didReciveUndecodedBinary is called', () => {
    const spy = jasmine.createSpy('onReciveUndecodedBinary');
    command.onReciveUndecodedBinary = spy;
    const buffer = new ArrayBuffer(8);

    command.didReciveUndecodedBinary(buffer);

    expect(spy).toHaveBeenCalledWith(buffer);
  });

  it('should call onRecive when didRecive is called', async () => {
    const spy = jasmine.createSpy('onRecive');
    command.onRecive = spy;

    const payload = {
      getMessage: () => null
    } as any;

    await command.didRecive(payload);

    expect(spy).toHaveBeenCalledWith(payload);
  });

  it('should call onReciveHandshake when didRecive receives a handshake', async () => {
    const spy = jasmine.createSpy('onReciveHandshake');
    command.onReciveHandshake = spy;

    const handshake = {} as Packets.Reply.Handshake;
    const payload = {
      getMessage: (cls: any) => cls === Packets.Reply.Handshake ? handshake : null
    } as any;

    await command.didRecive(payload);

    expect(spy).toHaveBeenCalledWith(handshake);
  });
});

describe('Commands.ProblemList', () => {
  let problemList: Commands.ProblemList;

  beforeEach(() => {
    problemList = new Commands.ProblemList('ws://localhost');
    spyOn(console, 'log');
    spyOn(problemList, 'didReciveProblemList');
  });

  it('should send MetaList after handshake', () => {
    const sendSpy = spyOn(problemList.tal, 'send');
    const handshake = {} as Packets.Reply.Handshake;

    problemList.didReciveHandshake(handshake);

    expect(sendSpy).toHaveBeenCalledWith(jasmine.any(Packets.Request.MetaList));
  });

  it('should call didReciveProblemList when MetaList message is received', async () => {
    const metaListMsg = {} as Packets.Reply.MetaList;
    const payload = {
      getMessage_MetaList: (cls: any) => cls === Packets.Reply.MetaList ? metaListMsg : null,
      getMessage: () => null
    } as any;

    await problemList.didRecive(payload);

    expect(problemList.didReciveProblemList).toHaveBeenCalledWith(metaListMsg);
  });

  it('should not call didReciveProblemList when MetaList message is missing', async () => {
    const payload = {
      getMessage_MetaList: () => null,
      getMessage: () => null
    } as any;

    await problemList.didRecive(payload);

    expect(problemList.didReciveProblemList).not.toHaveBeenCalled();
  });
});
describe('Commands.Attchment', () => {
  let attchment: Commands.Attchment;

  beforeEach(() => {
    attchment = new Commands.Attchment('ws://localhost', 'sample-problem');
    spyOn(console, 'log');
  });

  it('should send Attachment message on handshake', () => {
    const sendSpy = spyOn(attchment.tal, 'send');
    attchment.didReciveHandshake({} as any);

    expect(sendSpy).toHaveBeenCalledWith(jasmine.any(Packets.Request.Attachment));
  });

  it('should call onReciveAttachment when receiving Attachment', async () => {
    const message = {} as Packets.Reply.Attachment;
    const spy = jasmine.createSpy('onReciveAttachment');
    attchment.onReciveAttachment = spy;

    const payload = {
      getMessage: (cls: any) => cls === Packets.Reply.Attachment ? message : null
    } as any;

    await attchment.didRecive(payload);

    expect(spy).toHaveBeenCalledWith(message);
  });

  it('should call onReciveAttachmentInfo when receiving BinaryDataHeader', async () => {
    const message = {} as Packets.Reply.BinaryDataHeader;
    const spy = jasmine.createSpy('onReciveAttachmentInfo');
    attchment.onReciveAttachmentInfo = spy;

    const payload = {
      getMessage: (cls: any) => cls === Packets.Reply.BinaryDataHeader ? message : null
    } as any;

    await attchment.didRecive(payload);

    expect(spy).toHaveBeenCalledWith(message);
  });
});

describe('Commands.CloseConnection', () => {
  let closeConn: Commands.CloseConnection;

  beforeEach(() => {
    closeConn = new Commands.CloseConnection('ws://localhost');
    spyOn(console, 'log');
  });

  it('should send ConnectStop after handshake', () => {
    const sendSpy = spyOn(closeConn.tal, 'send');
    closeConn.didReciveHandshake({} as any);

    expect(sendSpy).toHaveBeenCalledWith(jasmine.any(Packets.Request.ConnectStop));
  });

  it('should call onReciveConnectStop when receiving ConnectStop', async () => {
    const message = {} as Packets.Reply.ConnectStop;
    const spy = jasmine.createSpy('onReciveConnectStop');
    closeConn.onReciveConnectStop = spy;

    const payload = {
      getMessage: (cls: any) => cls === Packets.Reply.ConnectStop ? message : null
    } as any;

    await closeConn.didRecive(payload);

    expect(spy).toHaveBeenCalledWith(message);
  });
});describe('Commands.Connect', () => {
  let connect: Commands.Connect;

  beforeEach(() => {
    const files = new Map<string, string>();
    files.set('file1.txt', 'content1');
    connect = new Commands.Connect('ws://localhost', 'problem1', 'service1', {}, false, 'token', files);
    spyOn(console, 'log');
  });

  it('should send ConnectBegin message after handshake', () => {
    const sendSpy = spyOn(connect.tal, 'send');
    connect.didReciveHandshake({} as any);
    expect(sendSpy).toHaveBeenCalledWith(jasmine.any(Packets.Request.ConnectBegin));
  });

  it('should call onReciveConnectBegin and send files if status Ok is valid', async () => {
    const message = { status: { Ok: ['accepted'], Err: '' } } as Packets.Reply.ConnectBegin;
    const payload = {
      getMessage: (cls: any) => cls === Packets.Reply.ConnectBegin ? message : null
    } as any;

    const spy = jasmine.createSpy('onReciveConnectBegin');
    connect.onReciveConnectBegin = spy;

    spyOn(connect.tal, 'send');
    spyOn(connect.tal, 'sendBinary');

    await connect.didRecive(payload);

    expect(spy).toHaveBeenCalledWith(message);
    expect(connect.tal.send).toHaveBeenCalled();
    expect(connect.tal.sendBinary).toHaveBeenCalled();
  });

  it('should call onReciveConnectStart', async () => {
    const message = { status: { Ok: '', Err: '' } } as unknown as Packets.Reply.ConnectStart;
    const spy = jasmine.createSpy('onReciveConnectStart');
    connect.onReciveConnectStart = spy;

    const payload = {
      getMessage: (cls: any) => cls === Packets.Reply.ConnectStart ? message : null
    } as any;

    await connect.didRecive(payload);
    expect(spy).toHaveBeenCalledWith(message);
  });

  it('should call onReciveConnectStop and send stop packet if open', async () => {
    const message = { status: { Ok: ['done'], Err: '' } } as Packets.Reply.ConnectStop;
    const spy = jasmine.createSpy('onReciveConnectStop');
    connect.onReciveConnectStop = spy;

    spyOn(connect.tal, 'isOpen').and.returnValue(true);
    const sendSpy = spyOn(connect.tal, 'send');

    const payload = {
      getMessage: (cls: any) => cls === Packets.Reply.ConnectStop ? message : null
    } as any;

    await connect.didRecive(payload);
    expect(spy).toHaveBeenCalledWith(message);
    expect(sendSpy).toHaveBeenCalledWith(jasmine.any(Packets.Request.ConnectStop));
  });

  it('should call onReciveBinaryHeader', async () => {
    const message = {} as Packets.Reply.BinaryDataHeader;
    const spy = jasmine.createSpy('onReciveBinaryHeader');
    connect.onReciveBinaryHeader = spy;

    const payload = {
      getMessage: (cls: any) => cls === Packets.Reply.BinaryDataHeader ? message : null
    } as any;

    await connect.didRecive(payload);
    expect(spy).toHaveBeenCalledWith(message);
  });
  it('should skip sending files if Ok[0] is empty', async () => {
  const message = { status: { Ok: [''], Err: '' } } as Packets.Reply.ConnectBegin;
  const payload = {
    getMessage: (cls: any) => cls === Packets.Reply.ConnectBegin ? message : null
  } as any;

  spyOn(connect.tal, 'send');
  spyOn(connect.tal, 'sendBinary');

  await connect.didRecive(payload);

  expect(connect.tal.sendBinary).not.toHaveBeenCalled();
});

});
