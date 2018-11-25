var kaiaJsServices = (function (exports) {
'use strict';

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
class Messaging {
    constructor() {
        this._resolveFunc = null;
        this._rejectFunc = null;
        this._initialized = false;
        this._closed = false;
        this._listener = null;
        this._messageId = 0;
        this._id = '';
        if (Messaging._created)
            throw ('Only one instance allowed');
        Messaging._created = true;
    }
    postEvent(opRes) {
        if (opRes.event === 'init') {
            if (opRes.err && (this._rejectFunc != null))
                this._rejectFunc(opRes.err);
            else if (!opRes.err && (this._resolveFunc != null))
                this._resolveFunc(opRes.event);
        }
        if (this._listener != null)
            this._listener(opRes.err, opRes);
    }
    parseQuery(queryString) {
        const query = {};
        const pairs = (queryString[0] === '?' ? queryString.substr(1) : queryString).split('&');
        for (var i = 0; i < pairs.length; i++) {
            let pair = pairs[i].split('=');
            query[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
        }
        return query;
    }
    init(params) {
        if (this._initialized)
            throw ('Already initialized');
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
        this._socket.on('connect', () => this._onConnect());
        this._socket.on('reconnect', (attemptNumber) => this._onReconnect(attemptNumber));
        this._socket.on('disconnect', (reason) => this._onDisconnect(reason));
        this._socket.on('connect_timeout', (timeout) => this._onConnectTimeout(timeout));
        this._socket.on('connect_error', (error) => this._onConnectError(error));
        this._socket.on('participants', (response) => this._onParticipants(response));
        this._socket.on('join', (response) => this._onJoin(response));
        this._socket.on('leave', (response) => this._onLeave(response));
        this._socket.on('message', (message) => this._onMessage(message));
        this._socket.on('authResult', (response) => this._onAuthResult(response));
        this._socket.on('reconnecting', (attemptNumber) => this._onReconnecting(attemptNumber));
        this._socket.on('reconnect_error', (error) => this._onReconnectError(error));
        this._socket.on('reconnect_failed', (error) => this._onReconnectFailed(error));
        this._socket.on('ping', () => this._onPing());
        this._socket.on('pong', (latencyMs) => this._onPong(latencyMs));
        this._socket.connect('/');
        const res = {};
        return this._makePromise(res);
    }
    _onConnect() {
        console.log('_onConnect()');
        // TODO parse token
        // TODO send token
    }
    _onReconnect(attemptNumber) {
        if (this._listener)
            this._listener(false, { event: 'reconnect', attemptNumber: attemptNumber, err: false });
    }
    _onDisconnect(reason) {
        if (this._listener)
            this._listener(false, { event: 'disconnect', reason: reason, err: false });
    }
    _onConnectTimeout(timeout) {
        if (this._listener)
            this._listener(false, { event: 'connectTimeout', timeout: timeout, err: false });
    }
    _onConnectError(error) {
        if (this._listener)
            this._listener(true, { event: 'connectError', error: error, err: true });
    }
    _onParticipants(response) {
        console.log('_onParticipants()');
        console.log(response);
    }
    _onJoin(response) {
        console.log('_onJoin()');
        console.log(response);
        // TODO resolve promise
    }
    _onLeave(response) {
        console.log('_onLeave()');
        console.log(response);
        // TODO resolve promise
    }
    _onMessage(response) {
        if (this._listener)
            this._listener(false, { event: 'message', message: response.payload, err: false });
        console.log('_onMessage()');
        console.log(response);
    }
    _onAuthResult(response) {
        console.log('_onAuthResult()');
        console.log(response);
        // TODO save new token
        // TODO resolve promise
    }
    _onReconnecting(attemptNumber) {
        if (this._listener)
            this._listener(false, { event: 'reconnecting', attemptNumber: attemptNumber, err: false });
    }
    _onReconnectError(error) {
        if (this._listener)
            this._listener(true, { event: 'reconnectErro', err: error });
    }
    _onReconnectFailed(error) {
        if (this._listener)
            this._listener(false, { event: 'reconenctFailed', err: error });
    }
    _onPing() {
    }
    _onPong(latencyMs) {
        //if (this._listener)
        //  this._listener(false, { event: 'pong', latency: latencyMs, err: false });
        this._latency = latencyMs;
    }
    _clearCallback() {
        this._resolveFunc = null;
        this._rejectFunc = null;
    }
    _resolve(res) {
        let cb = this._resolveFunc;
        this._clearCallback();
        if (cb !== null)
            cb(res);
    }
    _reject(err) {
        let cb = this._rejectFunc;
        this._clearCallback();
        if (cb !== null)
            cb(err);
    }
    join(params) {
        if (this.isClosed())
            throw ('Messaging instance has been closed');
        if (!params)
            throw ('Room name or array of room names required');
        if (typeof params === 'string')
            params = [params];
        this._rooms = params;
        // Send msg = {type:'join', roomIds:params}
        const res = {};
        return this._makePromise(res);
    }
    leave(params) {
        if (this.isClosed())
            throw ('Messaging instance has been closed');
        if (!params)
            throw ('Room ID or array of room IDs required');
        if (typeof params === 'string')
            params = [params];
        // Send msg = {type:'leave', roomIds:params}
        const res = {};
        return this._makePromise(res);
    }
    participants(params) {
        if (this.isClosed())
            throw ('Messaging instance has been closed');
        // List room(s) participants
        // Send msg = {type:'participants'}
        const res = {};
        return this._makePromise(res);
    }
    // TODO not implemented
    rooms(params) {
        if (this.isClosed())
            throw ('Messaging instance has been closed');
        // Send msg = {type:'listParticipants', roomIds:[]}}
        const res = {};
        return this._makePromise(res);
    }
    _send(msgType, msg) {
        // Increment message ID
        this._messageId = this._messageId + 1;
        msg.id = this._messageId;
        this._socket.emit(msgType, msg);
    }
    send(msg, rooms) {
        if (this.isClosed())
            throw ('Messaging instance has been closed');
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
    id() {
        if (this.isClosed())
            throw ('Messaging instance has been closed');
        return this._id;
    }
    latency() {
        if (this.isClosed())
            throw ('Messaging instance has been closed');
        return this._latency;
    }
    _makePromise(res) {
        if (res.err)
            throw (res.err);
        let promise = new Promise((resolve, reject) => {
            this._resolveFunc = resolve;
            this._rejectFunc = reject;
        });
        return promise;
    }
    isClosed() {
        return this._closed;
    }
    close() {
        this._closed = true;
        // work
        const res = { err: false };
        if (res.err)
            throw (res.err);
        this._clearCallback();
        this._listener = null;
    }
    setEventListener(listener) {
        this._listener = listener;
    }
}
Messaging._created = false;
async function createMessaging(params) {
    if (typeof params !== 'object')
        throw 'io() required';
    if (!params.io)
        params = { io: params };
    const messaging = new Messaging();
    const res = await messaging.init(params);
    if (typeof res === 'string')
        throw (res);
    // TODO send token
    // TODO wait authResponse
    return messaging;
}

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

exports.Messaging = Messaging;
exports.createMessaging = createMessaging;

return exports;

}({}));
