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
    _promises: any;
    static _created: boolean;
    static _id: string;
    _listener: Function | null;
    _messageId: number;
    _id: string | undefined;
    _socket: any;
    _latency: number | undefined;
    _token: string;
    _rooms: any;
    _debug: boolean;
    constructor();
    parseQuery(queryString: string): any;
    init(params: any): Promise<any>;
    debug(enable: any): boolean;
    _onConnect(): void;
    _onReconnect(attemptNumber: number): void;
    _onDisconnect(reason: any): void;
    _onConnectTimeout(timeout: any): void;
    _onConnectError(error: any): void;
    _checkAndReject(response: any): boolean;
    _resolveOrReject(response: any): void;
    _onParticipants(response: any): void;
    _onRooms(response: any): void;
    _callListener(event: string, response: any): void;
    _onJoined(response: any): void;
    _onLeft(response: any): void;
    _onMessage(response: any): void;
    _onAuthResult(response: any): void;
    _onReconnecting(attemptNumber: number): void;
    _onReconnectError(error: any): void;
    _onReconnectFailed(error: any): void;
    _onPong(latencyMs: number): void;
    _resolve(id: number, result: any): boolean;
    _reject(id: string, result: any): boolean;
    _rejectAll(result: any): void;
    join(rooms: any): Promise<any>;
    leave(rooms: any): Promise<any>;
    participants(rooms: any): Promise<any>;
    rooms(): Promise<any>;
    _send(msgType: string, msg: any): number;
    send(msg: any, rooms: any): void;
    id(): string | undefined;
    token(newToken: any): string;
    latency(): number | undefined;
    disconnected(): boolean;
    _makePromise(id: number): Promise<any>;
    disconnect(): void;
    setEventListener(listener: Function | null): void;
}
export declare function createMessaging(params: any): Promise<any>;
