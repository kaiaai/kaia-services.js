'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

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
        this._promises = {};
        //_closed: boolean = false;
        this._listener = null;
        this._messageId = 0;
        this._id = undefined;
        this._token = '';
        this._debug = true;
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
    async init(params) {
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
        this._socket.on('connect', () => this._onConnect());
        this._socket.on('reconnect', (attemptNumber) => this._onReconnect(attemptNumber));
        this._socket.on('disconnect', (reason) => this._onDisconnect(reason));
        this._socket.on('connect_timeout', (timeout) => this._onConnectTimeout(timeout));
        this._socket.on('connect_error', (error) => this._onConnectError(error));
        this._socket.on('participants', (response) => this._onParticipants(response));
        this._socket.on('rooms', (response) => this._onRooms(response));
        this._socket.on('joined', (response) => this._onJoined(response));
        this._socket.on('left', (response) => this._onLeft(response));
        this._socket.on('message', (message) => this._onMessage(message));
        this._socket.on('authResult', (response) => this._onAuthResult(response));
        this._socket.on('reconnecting', (attemptNumber) => this._onReconnecting(attemptNumber));
        this._socket.on('reconnect_error', (error) => this._onReconnectError(error));
        this._socket.on('reconnect_failed', (error) => this._onReconnectFailed(error));
        //this._socket.on('ping', () => this._onPing() );
        this._socket.on('pong', (latencyMs) => this._onPong(latencyMs));
        this._socket.connect('/');
        this._rejectAll('Initializing');
        return this._makePromise(-1);
    }
    debug(enable) {
        if (typeof enable === 'boolean')
            this._debug = enable;
        return this._debug;
    }
    _onConnect() {
        if (this._debug)
            console.log('_onConnect()');
        const message = { token: this._token };
        if (this._rooms)
            message.rooms = this._rooms;
        const id = this._send('authToken', message);
        this._promises[id] = this._promises[-1];
        delete this._promises[-1];
        this._callListener('connect', {});
    }
    _onReconnect(attemptNumber) {
        if (this._debug)
            console.log('_onReconnect() attemptNumber=' + attemptNumber);
        this._callListener('reconnect', { attemptNumber: attemptNumber, err: false });
    }
    _onDisconnect(reason) {
        if (this._debug)
            console.log('_onDisconnect() reason=' + reason);
        this._rejectAll(reason);
        this._callListener('disconnect', { reason: reason, err: false });
    }
    _onConnectTimeout(timeout) {
        if (this._debug)
            console.log('_onConnectTimeout() timeout=' + timeout);
        this._callListener('connectTimeout', { timeout: timeout, err: false });
    }
    _onConnectError(error) {
        if (this._debug)
            console.log('_onConnectError() error=' + error);
        this._rejectAll('Connect error');
        this._callListener('connectError', { err: error });
    }
    _checkAndReject(response) {
        if (response.err) {
            this._reject(response.id, response.err);
            return false;
        }
        return true;
    }
    _resolveOrReject(response) {
        if (this._checkAndReject(response))
            this._resolve(response.id, response);
    }
    _onParticipants(response) {
        if (this._debug) {
            console.log('_onParticipants()');
            console.log(response);
        }
        this._resolveOrReject(response);
        this._callListener('participants', response);
    }
    _onRooms(response) {
        if (this._debug) {
            console.log('_onRooms()');
            console.log(response);
        }
        this._resolveOrReject(response);
        this._callListener('rooms', response);
    }
    _callListener(event, response) {
        if (!this._listener)
            return;
        response.event = event;
        this._listener(response.err, response);
    }
    _onJoined(response) {
        if (this._debug) {
            console.log('_onJoined()');
            console.log(response);
        }
        // TODO wait resolving until joining all requested rooms
        this._resolveOrReject(response);
        this._callListener('joined', response);
    }
    _onLeft(response) {
        if (this._debug) {
            console.log('_onLeft()');
            console.log(response);
        }
        this._resolveOrReject(response);
        this._callListener('left', response);
    }
    _onMessage(response) {
        if (this._debug) {
            console.log('_onMessage()');
            console.log(response);
        }
        response.err = false;
        this._callListener('message', response);
    }
    _onAuthResult(response) {
        if (this._debug) {
            console.log('_onAuthResult()');
            console.log(response);
        }
        if (response.err) {
            this._id = undefined;
            this._rooms = undefined;
        }
        else {
            this._id = response.clientId;
            if (response.token)
                this._token = response.token;
        }
        if (this._checkAndReject(response))
            this._resolve(response.id, this);
        this._callListener('authResult', response);
    }
    _onReconnecting(attemptNumber) {
        if (this._debug)
            console.log('_onReconnecting() attemptNumber=' + attemptNumber);
        this._callListener('reconnecting', { attemptNumber: attemptNumber, err: false });
    }
    _onReconnectError(error) {
        if (this._debug)
            console.log('_onReconnectError() error=' + error);
        this._callListener('reconnectError', { err: error });
    }
    _onReconnectFailed(error) {
        if (this._debug)
            console.log('_onReconnectFailed() error=' + error);
        this._callListener('reconnectFailed', { err: error });
    }
    //_onPing() {
    //}
    _onPong(latencyMs) {
        if (this._debug)
            console.log('_onPong() latencyMs=' + latencyMs);
        this._latency = latencyMs;
        this._callListener('pong', { latency: latencyMs, err: false });
    }
    _resolve(id, result) {
        const promise = this._promises[id];
        if (!promise)
            return false;
        delete this._promises[id];
        promise.resolve(result);
        return true;
    }
    _reject(id, result) {
        const promise = this._promises[id];
        if (!promise)
            return false;
        delete this._promises[id];
        promise.reject(result);
        return true;
    }
    _rejectAll(result) {
        const ids = Object.keys(this._promises);
        ids.map(id => this._reject(id, result));
    }
    async join(rooms) {
        if (this.disconnected())
            throw 'Disconnected';
        if (!rooms)
            throw 'Room name(s) required';
        if (typeof rooms === 'string')
            rooms = [rooms];
        const message = { rooms: rooms };
        const id = this._send('rooms', message);
        return this._makePromise(id);
    }
    async leave(rooms) {
        if (this.disconnected())
            throw 'Disconnected';
        const message = {};
        if (typeof rooms === 'string')
            rooms = [rooms];
        if (rooms)
            message.rooms = rooms;
        const id = this._send('leave', message);
        return this._makePromise(id);
    }
    async participants(rooms) {
        if (this.disconnected())
            throw 'Disconnected';
        // List rooms client is connected to and their participants
        const message = {};
        if (typeof rooms === 'string')
            rooms = [rooms];
        if (rooms)
            message.rooms = rooms;
        const id = this._send('participants', message);
        return this._makePromise(id);
    }
    async rooms() {
        if (this.disconnected())
            throw 'Disconnected';
        // List rooms client is connected to
        const message = {};
        const id = this._send('rooms', message);
        return this._makePromise(id);
    }
    _send(msgType, msg) {
        // Increment message ID
        this._messageId = this._messageId + 1;
        msg.id = this._messageId;
        this._socket.emit(msgType, msg);
        return msg.id;
    }
    send(msg, rooms) {
        if (this.disconnected())
            throw 'Disconnected';
        if (typeof msg === 'undefined')
            throw 'Message required';
        if (typeof rooms === 'string')
            rooms = [rooms];
        const message = { message: msg };
        if (rooms)
            message.rooms = rooms;
        this._send('message', message);
    }
    id() {
        return this._id;
    }
    token(newToken) {
        let oldToken = this._token;
        if (newToken)
            this._token = newToken;
        return oldToken;
    }
    latency() {
        if (this.disconnected())
            throw 'Disconnected';
        return this._latency;
    }
    disconnected() {
        return this._socket._disconnected;
    }
    _makePromise(id) {
        let promise = new Promise((resolve, reject) => {
            const funcs = { resolve: resolve, reject: reject };
            this._promises[id] = funcs;
        });
        return promise;
    }
    disconnect() {
        this._socket.disconnect();
    }
    setEventListener(listener) {
        if (!(listener instanceof Function))
            throw 'Function required';
        this._listener = listener;
    }
}
Messaging._created = false;
async function createMessaging(params) {
    const messaging = new Messaging();
    return messaging.init(params);
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
