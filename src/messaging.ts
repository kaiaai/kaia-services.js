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
  _resolveFunc: Function | null = null;
  _rejectFunc: Function | null = null;
  _initialized: boolean = false;
  static _created: boolean = false;
  static _id: string;
  _closed: boolean = false;
  _listener: Function | null = null;
  _messageId: number = 0;
  _id: string = '';
  _socket: any;
  _rooms: any;
  _latency: number | undefined;

  constructor() {

    if (Messaging._created)
      throw('Only one instance allowed');

    Messaging._created = true;
  }

  postEvent(opRes: any): void {
    if (opRes.event === 'init') {
      if (opRes.err && (this._rejectFunc != null))
        this._rejectFunc(opRes.err);
      else if (!opRes.err && (this._resolveFunc != null))
        this._resolveFunc(opRes.event);
    }
    if (this._listener != null)
      this._listener(opRes.err, opRes);
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

  init(params: any): Promise<any> {
    if (this._initialized)
      throw('Already initialized');
    this._initialized = true;

    if (typeof params === 'undefined')
      throw 'io() required';

    if (params.io)
      this._socket = params.socket;
    else
      this._socket = params;

    if (params.eventListener)
      this._listener = params.eventListener;

    let token;
    if (params.token)
      token = params.token;
    else {
      const queryString = window.location.search.substring(1);
      const parsedQuery = this.parseQuery(queryString);
      token = parsedQuery.token;
    }

    if (!token)
      throw 'Missing token';
    if (!this._socket)
      throw 'Missing io()';

    // TODO pass this?
    this._socket.on('connect', () => this._onConnect() );
    this._socket.on('reconnect', (attemptNumber: number) => this._onReconnect(attemptNumber) );
    this._socket.on('disconnect', (reason: any) => this._onDisconnect(reason) );
    this._socket.on('connect_timeout', (timeout: any) => this._onConnectTimeout(timeout) );
    this._socket.on('connect_error', (error: any) => this._onConnectError(error) );
    this._socket.on('participants', (response: object) => this._onParticipants(response) );
    this._socket.on('join', (response: object) => this._onJoin(response) );
    this._socket.on('leave', (response: object) => this._onLeave(response) );
    this._socket.on('message', (message: object) => this._onMessage(message) );
    this._socket.on('authResult', (response: object) => this._onAuthResult(response) );
    this._socket.on('reconnecting', (attemptNumber: number) => this._onReconnecting(attemptNumber) );
    this._socket.on('reconnect_error', (error: any) => this._onReconnectError(error) );
    this._socket.on('reconnect_failed', (error: any) => this._onReconnectFailed(error) );
    this._socket.on('ping', () => this._onPing() );
    this._socket.on('pong', (latencyMs: number) => this._onPong(latencyMs) );

    this._socket.connect('/');

    const res = {};
    return this._makePromise(res);
  }

  _onConnect() {
    console.log('_onConnect()');
    // TODO parse token
    // TODO send token
  }

  _onReconnect(attemptNumber: number) {
    if (this._listener)
      this._listener(false, { event: 'reconnect', attemptNumber: attemptNumber, err: false });
  }

  _onDisconnect(reason: any) {
    if (this._listener)
      this._listener(false, { event: 'disconnect', reason: reason, err: false });
  }

  _onConnectTimeout(timeout: any) {
    if (this._listener)
      this._listener(false, { event: 'connectTimeout', timeout: timeout, err: false });
  }

  _onConnectError(error: any) {
    if (this._listener)
      this._listener(true, { event: 'connectError', error: error, err: true });
  }

  _onParticipants(response: object) {
    console.log('_onParticipants()');
    console.log(response);
  }

  _onJoin(response: object) {
    console.log('_onJoin()');
    console.log(response);
    // TODO resolve promise
  }

  _onLeave(response: object) {
    console.log('_onLeave()');
    console.log(response);
    // TODO resolve promise
  }

  _onMessage(response: any) {
    if (this._listener)
      this._listener(false, { event: 'message', message: response.payload, err: false });
    console.log('_onMessage()');
    console.log(response);
  }

  _onAuthResult(response: object) {
    console.log('_onAuthResult()');
    console.log(response);
    // TODO save new token
    // TODO resolve promise
  }

  _onReconnecting(attemptNumber: number) {
    if (this._listener)
      this._listener(false, { event: 'reconnecting', attemptNumber: attemptNumber, err: false });
  }

  _onReconnectError(error: any) {
    if (this._listener)
      this._listener(true, { event: 'reconnectErro', err: error });
  }

  _onReconnectFailed(error: any) {
    if (this._listener)
      this._listener(false, { event: 'reconenctFailed', err: error });
  }

  _onPing() {
  }

  _onPong(latencyMs: number) {
    //if (this._listener)
    //  this._listener(false, { event: 'pong', latency: latencyMs, err: false });
    this._latency = latencyMs;
  }

  _clearCallback(): void {
    this._resolveFunc = null;
    this._rejectFunc = null;
  }

  _resolve(res: any): void {
    let cb = this._resolveFunc;
    this._clearCallback();
    if (cb !== null)
      cb(res);
  }

  _reject(err: any): void {
    let cb = this._rejectFunc;
    this._clearCallback();
    if (cb !== null)
      cb(err);
  }

  join(params: any): Promise<any> {
    if (this.isClosed())
      throw('Messaging instance has been closed');
    if (!params)
      throw('Room name or array of room names required');
    if (typeof params === 'string' )
      params = [params];

    this._rooms = params;

    // Send msg = {type:'join', roomIds:params}
    const res = {};
    return this._makePromise(res);
  }

  leave(params: any): Promise<any> {
    if (this.isClosed())
      throw('Messaging instance has been closed');
    if (!params)
      throw('Room ID or array of room IDs required');
    if (typeof params === 'string' )
      params = [params];

    // Send msg = {type:'leave', roomIds:params}
    const res = {};
    return this._makePromise(res);
  }

  participants(params: any): Promise<any> {
    if (this.isClosed())
      throw('Messaging instance has been closed');

    // List room(s) participants

    // Send msg = {type:'participants'}
    const res = {};
    return this._makePromise(res);
  }

  // TODO not implemented
  rooms(params: any): Promise<any> {
    if (this.isClosed())
      throw('Messaging instance has been closed');


    // Send msg = {type:'listParticipants', roomIds:[]}}
    const res = {};
    return this._makePromise(res);
  }

  _send(msgType: string, msg: any) {
    // Increment message ID
    this._messageId = this._messageId + 1;
    msg.id = this._messageId;
    this._socket.emit(msgType, msg);
  }

  send(msg: any, rooms: any) {
    if (this.isClosed())
      throw('Messaging instance has been closed');

    if (typeof msg === 'undefined')
      throw 'Message required';
    if (typeof rooms === 'undefined')
     rooms = this._rooms;
    if (typeof rooms === 'string')
      rooms = [rooms];
    if (!Array.isArray(rooms))
      throw 'Rooms array required';

    this._send(msg, rooms);
  }

  id(): string {
    if (this.isClosed())
      throw('Messaging instance has been closed');
    return this._id;
  }

  latency(): number | undefined {
    if (this.isClosed())
      throw('Messaging instance has been closed');
    return this._latency;
  }

  _makePromise(res: any): Promise<any> {
    if (res.err)
      throw(res.err);

    let promise = new Promise<any>((resolve, reject) => {
      this._resolveFunc = resolve;
      this._rejectFunc = reject;
    });
    return promise;
  }

  isClosed(): boolean {
    return this._closed;
  }

  close(): void {
    this._closed = true;

    // work
    const res = { err: false };
    if (res.err)
      throw(res.err);
    this._clearCallback();
    this._listener = null;
  }

  setEventListener(listener: Function | null): void {
    this._listener = listener;
  }
}

export async function createMessaging(params: any) {
  if (typeof params !== 'object')
    throw 'io() required';
  if (!params.io)
    params = { io: params };
  const messaging = new Messaging();
  const res = await messaging.init(params);
  if (typeof res === 'string')
    throw(res);

  // TODO send token
  // TODO wait authResponse

  return messaging;
}
