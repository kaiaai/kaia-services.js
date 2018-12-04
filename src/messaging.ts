/**
 * @license
 * Copyright 2018 OOMWOO LLC. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */
export class Messaging {
  _promises: any = {};
  static _created: boolean = false;
  static _id: string;
  //_closed: boolean = false;
  _listener: Function | null = null;
  _messageId: number = 0;
  _id: string | undefined = undefined;
  _socket: any;
  _latency: number | undefined;
  _token: string = '';
  _rooms: any;
  _debug: boolean = true;

  constructor() {
  }

  parseQuery(queryString: string) {
    const query: any = {};
    const pairs = (queryString[0] === '?' ? queryString.substr(1) : queryString).split('&');
    for (var i = 0; i < pairs.length; i++) {
      let pair = pairs[i].split('=');
      query[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
    }
    return query;
  }

  async init(params: any): Promise<any> {
    if (Messaging._created)
      return Promise.reject('Only one instance allowed');

    if (typeof params !== 'object')
      return Promise.reject('io() required');
    if (!params.io)
      params = { io: params };
    if (typeof params.eventListener === 'function')
      this.setEventListener(params.eventListener);
    this.debug(params.debug);

    this._socket = params.io;

    if (params.token)
      this._token = params.token;
    else {
      const queryString = window.location.search.substring(1);
      const parsedQuery = this.parseQuery(queryString);
      this._token = parsedQuery.token;
    }

    if (!this._token)
      return Promise.reject('Missing token');
    if (typeof params.rooms === 'string')
      params.rooms = [params.rooms];

    Messaging._created = true;
    this._rooms = params.rooms ? params.rooms : undefined;

    this._socket.on('connect', () => this._onConnect() );
    this._socket.on('reconnect', (attemptNumber: number) => this._onReconnect(attemptNumber) );
    this._socket.on('disconnect', (reason: any) => this._onDisconnect(reason) );
    this._socket.on('connect_timeout', (timeout: any) => this._onConnectTimeout(timeout) );
    this._socket.on('connect_error', (error: any) => this._onConnectError(error) );
    this._socket.on('participants', (response: object) => this._onParticipants(response) );
    this._socket.on('rooms', (response: object) => this._onRooms(response) );
    this._socket.on('joined', (response: object) => this._onJoined(response) );
    this._socket.on('left', (response: object) => this._onLeft(response) );
    this._socket.on('message', (message: object) => this._onMessage(message) );
    this._socket.on('authResult', (response: object) => this._onAuthResult(response) );
    this._socket.on('reconnecting', (attemptNumber: number) => this._onReconnecting(attemptNumber) );
    this._socket.on('reconnect_error', (error: any) => this._onReconnectError(error) );
    this._socket.on('reconnect_failed', (error: any) => this._onReconnectFailed(error) );
    //this._socket.on('ping', () => this._onPing() );
    this._socket.on('pong', (latencyMs: number) => this._onPong(latencyMs) );

    this._socket.connect('/');
    this._rejectAll('Initializing');
    return this._makePromise(-1);
  }

  debug(enable: any) {
    if (typeof enable === 'boolean')
      this._debug = enable;
    return this._debug;
  }

  _onConnect() {
    if (this._debug)
      console.log('_onConnect()');
    const message: any = { token: this._token };
    if (this._rooms)
      message.rooms = this._rooms;
    const id = this._send('authToken', message);
    this._promises[id] = this._promises[-1];
    delete this._promises[-1];
    this._callListener('connect', { err: false });
  }

  _onReconnect(attemptNumber: number) {
    if (this._debug)
      console.log('_onReconnect() attemptNumber=' + attemptNumber);
    this._callListener('reconnect', { attemptNumber: attemptNumber, err: false });
  }

  _onDisconnect(reason: any) {
    if (this._debug)
      console.log('_onDisconnect() reason=' + reason);
    this._rejectAll(reason);
    this._callListener('disconnect', { reason: reason, err: false });
  }

  _onConnectTimeout(timeout: any) {
    if (this._debug)
      console.log('_onConnectTimeout() timeout=' + timeout);
    this._callListener('connectTimeout', { timeout: timeout, err: false });
  }

  _onConnectError(error: any) {
    if (this._debug)
      console.log('_onConnectError() error=' + error);
    this._rejectAll('Connect error');
    this._callListener('connectError', { err: error });
  }

  _checkAndReject(response: any): boolean {
    if (response.err) {
      this._reject(response.id, response.err);
      return false;
    }
    return true;
  }

  _resolveOrReject(response: any) {
    if (this._checkAndReject(response))
      this._resolve(response.id, response);
  }

  _onParticipants(response: any) {
    if (this._debug) {
      console.log('_onParticipants()');
      console.log(response);
    }
    this._resolveOrReject(response);
    this._callListener('participants', response);
  }

  _onRooms(response: any) {
    if (this._debug) {
      console.log('_onRooms()');
      console.log(response);
    }
    this._resolveOrReject(response);
    this._callListener('rooms', response);
  }

  _callListener(event: string, response: any) {
    if (!this._listener)
      return;
    response.event = event;
    this._listener(response.err, response);
   }

  _onJoined(response: any) {
    if (this._debug) {
      console.log('_onJoined()');
      console.log(response);
    }
    // TODO wait resolving until joining all requested rooms
    this._resolveOrReject(response);
    this._callListener('joined', response);
  }

  _onLeft(response: any) {
    if (this._debug) {
      console.log('_onLeft()');
      console.log(response);
    }
    this._resolveOrReject(response);
    this._callListener('left', response);
  }

  _onMessage(response: any) {
    if (this._debug) {
      console.log('_onMessage()');
      console.log(response);
    }
    response.err = false;
    this._callListener('message', response);
  }

  _onAuthResult(response: any) {
    if (this._debug) {
      console.log('_onAuthResult()');
      console.log(response);
    }

    if (response.err) {
      this._id = undefined;
      this._rooms = undefined;
    } else {
      this._id = response.clientId;
      if (response.token)
        this._token = response.token;
    }

    if (this._checkAndReject(response))
      this._resolve(response.id, this);
    this._callListener('authResult', response);
  }

  _onReconnecting(attemptNumber: number) {
    if (this._debug)
      console.log('_onReconnecting() attemptNumber=' + attemptNumber);
    this._callListener('reconnecting', { attemptNumber: attemptNumber, err: false });
  }

  _onReconnectError(error: any) {
    if (this._debug)
      console.log('_onReconnectError() error=' + error);
    this._callListener('reconnectError', { err: error });
  }

  _onReconnectFailed(error: any) {
    if (this._debug)
      console.log('_onReconnectFailed() error=' + error);
    this._callListener('reconnectFailed', { err: error });
  }

  //_onPing() {
  //}

  _onPong(latencyMs: number) {
    if (this._debug)
      console.log('_onPong() latencyMs=' + latencyMs);
    this._latency = latencyMs;
    this._callListener('pong', { latency: latencyMs, err: false });
  }

  _resolve(id: number, result: any): boolean {
    const promise = this._promises[id];
    if (!promise)
      return false;
    delete this._promises[id];
    promise.resolve(result);
    return true;
  }

  _reject(id: string, result: any): boolean {
    const promise = this._promises[id];
    if (!promise)
      return false;
    delete this._promises[id];
    promise.reject(result);
    return true;
  }

  _rejectAll(result: any) {
    const ids = Object.keys(this._promises);
    ids.map(id => this._reject(id, result));
  }

  async join(rooms: any): Promise<any> {
    if (this.disconnected())
      throw 'Disconnected';
    if (!rooms)
      throw 'Room name(s) required';
    if (typeof rooms === 'string')
      rooms = [rooms];
    const message: any = { rooms: rooms };

    const id = this._send('rooms', message);
    return this._makePromise(id);
  }

  async leave(rooms: any): Promise<any> {
    if (this.disconnected())
      throw 'Disconnected';

    const message: any = {};
    if (typeof rooms === 'string')
      rooms = [rooms];
    if (rooms)
      message.rooms = rooms;

    const id = this._send('leave', message);
    return this._makePromise(id);
  }

  async participants(rooms: any): Promise<any> {
    if (this.disconnected())
      throw 'Disconnected';

    // List rooms client is connected to and their participants

    const message: any = {};
    if (typeof rooms === 'string')
      rooms = [rooms];
    if (rooms)
      message.rooms = rooms;

    const id = this._send('participants', message);
    return this._makePromise(id);
  }

  async rooms(): Promise<any> {
    if (this.disconnected())
      throw 'Disconnected';

    // List rooms client is connected to

    const message: any = {};
    const id = this._send('rooms', message);
    return this._makePromise(id);
  }

  _send(msgType: string, msg: any): number {
    // Increment message ID
    this._messageId = this._messageId + 1;
    msg.id = this._messageId;
    this._socket.emit(msgType, msg);
    return msg.id;
  }

  send(msg: any, rooms: any) {
    if (this.disconnected())
      throw 'Disconnected';

    if (typeof msg === 'undefined')
      throw 'Message required';
    if (typeof rooms === 'string')
      rooms = [rooms];
    const message: any = { message: msg };
    if (rooms)
      message.rooms = rooms;

    this._send('message', message);
  }

  id(): string | undefined {
    return this._id;
  }

  token(newToken: any): string {
    let oldToken = this._token;
    if (newToken)
      this._token = newToken;
    return oldToken;
  }

  latency(): number | undefined {
   if (this.disconnected())
     throw 'Disconnected';

    return this._latency;
  }

  disconnected(): boolean {
    return this._socket._disconnected;
  }

  _makePromise(id: number): Promise<any> {
    let promise = new Promise<any>((resolve, reject) => {
      const funcs: any = { resolve: resolve, reject: reject };
      this._promises[id] = funcs;
    });
    return promise;
  }

  disconnect(): void {
    this._socket.disconnect();
  }

  setEventListener(listener: Function | null): void {
    if (!(listener instanceof Function))
      throw 'Function required';
    this._listener = listener;
  }
}

export async function createMessaging(params: any) {
  const messaging = new Messaging();
  return messaging.init(params);
}
