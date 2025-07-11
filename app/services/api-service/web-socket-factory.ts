// web-socket-factory.ts
import { webSocket, WebSocketSubject, WebSocketSubjectConfig } from 'rxjs/webSocket';

export const WebSocketFactory = {
  createWebSocket<T>(urlConfigOrSource: string | WebSocketSubjectConfig<T>): WebSocketSubject<T> {
    return webSocket(urlConfigOrSource);
  }
};

