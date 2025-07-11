import { WebSocketSubject } from 'rxjs/webSocket';
import { Packets } from './api.packets';
import { WebSocketFactory } from './web-socket-factory';

export class TALightSocket{
  public url = 'ws://localhost:8008';
  public ws?:WebSocketSubject<any>;
  
  public decode = true;
  public binEncoder = new TextEncoder(); // always utf-8
  public binDecoder = new TextDecoder("utf-8");
  
  public onError?:(error:string)=>void;
  public onClose?:()=>void;
  public onRecive?:(payload: Packets.PacketsPayload) => void;
  public onReciveBinary?:(payload: string) => void;
  public onReciveUndecodedBinary?:(payload: ArrayBuffer) => void;
      
  constructor(url:string){
    this.url = url;

    if (!this.ws || this.ws.closed ){
      this.ws = WebSocketFactory.createWebSocket({
        url: this.url,
        binaryType: "arraybuffer",
        deserializer: msg => msg,
        serializer: msg => {
          if (msg instanceof ArrayBuffer)
            return msg;
          else if (typeof msg === "string")
            return msg;
          else
            return JSON.stringify(msg);
        }
      });
      this.ws.subscribe({
        next: (payload:any)=>{ this.didRecieve(payload) },
        error: (error:any)=>{ this.didError(error) },
        complete: ()=>{ this.didClose() },
      });

      console.log("Created new socket");
    }
  }

  public isOpen():boolean{
    return (!!this.ws) && !this.ws.closed;
  }

  public closeConnection(){
    this.ws!.unsubscribe();
    this.ws!.complete();
    console.log("TALightSocket:closeConnection");
  }
  
  public send(request: Packets.Request.Message){
    if (!this.isOpen()) {
      this.didError("TALightSocket:send: unable to send, socket is null")
      return false
    } 
    
    let packet = request.toPacket();
    this.ws!.next(packet);

    return true;
  }

  public sendBinary(data: string) {
    let payload = this.binEncoder.encode(data);
    if (!this.isOpen()) {
      this.didError("TALightSocket:sendBinary: unable to send, socket is null")
      return false
    } 
    console.log("TALightSocket:sendBinary: sending payload \n"+payload);
    this.ws!.next(payload.buffer);
    return true;
  }
  
  public didRecieve(payload: MessageEvent) {
  let data = payload.data;
  if (typeof data === "object" && data instanceof ArrayBuffer) {
    if (this.decode) {
      if (data.byteLength == 0) return;
      data = this.binDecoder.decode(data);
      if (this.onReciveBinary) this.onReciveBinary(data);
    } else {
      if (this.onReciveUndecodedBinary) this.onReciveUndecodedBinary(data);
    }
  } else {
    try {
      let packetsPayload = new Packets.PacketsPayload(data);
      if (this.onRecive) this.onRecive(packetsPayload);
    } catch (e) {
      this.didError?.(`TALightSocket: Invalid JSON - ${e}`);
    }
  }
}


  public didError(error:any) { 
    if (this.onError) { this.onError(error );}
  }

  public didClose() { 
    this.closeConnection();
    if (this.onClose) { this.onClose();}
  }
}
