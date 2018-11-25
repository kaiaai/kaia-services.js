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
export declare class Messaging {
    _resolveFunc: Function | null;
    _rejectFunc: Function | null;
    _initialized: boolean;
    static _created: boolean;
    static _id: string;
    _closed: boolean;
    _listener: Function | null;
    _messageId: number;
    _id: string;
    _socket: any;
    _rooms: any;
    _latency: number | undefined;
    constructor();
    postEvent(opRes: any): void;
    parseQuery(queryString: string): any;
    init(params: any): Promise<any>;
    _onConnect(): void;
    _onReconnect(attemptNumber: number): void;
    _onDisconnect(reason: any): void;
    _onConnectTimeout(timeout: any): void;
    _onConnectError(error: any): void;
    _onParticipants(response: object): void;
    _onJoin(response: object): void;
    _onLeave(response: object): void;
    _onMessage(response: any): void;
    _onAuthResult(response: object): void;
    _onReconnecting(attemptNumber: number): void;
    _onReconnectError(error: any): void;
    _onReconnectFailed(error: any): void;
    _onPing(): void;
    _onPong(latencyMs: number): void;
    _clearCallback(): void;
    _resolve(res: any): void;
    _reject(err: any): void;
    join(params: any): Promise<any>;
    leave(params: any): Promise<any>;
    participants(params: any): Promise<any>;
    rooms(params: any): Promise<any>;
    _send(msgType: string, msg: any): void;
    send(msg: any, rooms: any): void;
    id(): string;
    latency(): number | undefined;
    _makePromise(res: any): Promise<any>;
    isClosed(): boolean;
    close(): void;
    setEventListener(listener: Function | null): void;
}
export declare function createMessaging(params: any): Promise<Messaging>;
