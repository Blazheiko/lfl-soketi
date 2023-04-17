
import {Server} from "../server";
import {Log} from "../log";
import {WebSocket} from "uWebSockets.js";
import * as prom from "prom-client";
import {DebuggerInterface} from "./debugger-interface";
import {WebsocketDebuggerDriver} from "./websocket-debugger-driver";

export class Debugger implements DebuggerInterface {
    /**
     * The Metrics driver.
     */
    public driver: DebuggerInterface;

    /**
     * Initialize the Prometheus exporter.
     */
    constructor(protected server: Server) {
        if (server.options.debugger.driver === 'websocket') {
            this.driver = new WebsocketDebuggerDriver(server);
        }else {
            Log.error('No metrics driver specified.');
        }

    }

    /**
     * Handle a new connection.
     */
    markNewConnection(ws: WebSocket): void {
        if (this.server.options.debugger.enabled) {
            this.driver.markNewConnection(ws);
        }
    }

    /**
     * Handle a disconnection.
     */
    markDisconnection(ws: WebSocket): void {
        if (this.server.options.debugger.enabled) {
            this.driver.markDisconnection(ws);
        }
    }

    /**
     * Handle a new API message event being received and sent out.
     */
    markApiMessage(appId: string, incomingMessage: any, sentMessage: any): void {
        if (this.server.options.debugger.enabled) {
            this.driver.markApiMessage(appId, incomingMessage, sentMessage);
        }
    }

    /**
     * Handle a new WS client message event being sent.
     */
    markWsMessageSent(appId: string, sentMessage: any): void {
        if (this.server.options.debugger.enabled) {
            this.driver.markWsMessageSent(appId, sentMessage);
        }
    }

    /**
     * Handle a new WS client message being received.
     */
    markWsMessageReceived(appId: string, message: any): void {
        if (this.server.options.debugger.enabled) {
            this.driver.markWsMessageReceived(appId, message);
        }
    }

    /**
     * Track the time in which horizontal adapter resolves requests from other nodes.
     */
    trackHorizontalAdapterResolveTime(appId: string, time: number): void {
        this.driver.trackHorizontalAdapterResolveTime(appId, time);
    }

    /**
     * Track the fulfillings in which horizontal adapter resolves requests from other nodes.
     */
    trackHorizontalAdapterResolvedPromises(appId: string, resolved = true): void {
        this.driver.trackHorizontalAdapterResolvedPromises(appId, resolved);
    }

    /**
     * Handle a new horizontal adapter request sent.
     */
    markHorizontalAdapterRequestSent(appId: string): void {
        this.driver.markHorizontalAdapterRequestSent(appId);
    }

    /**
     * Handle a new horizontal adapter request that was marked as received.
     */
    markHorizontalAdapterRequestReceived(appId: string): void {
        this.driver.markHorizontalAdapterRequestReceived(appId);
    }

    /**
     * Handle a new horizontal adapter response from other node.
     */
    markHorizontalAdapterResponseReceived(appId: string): void {
        this.driver.markHorizontalAdapterResponseReceived(appId);
    }

    /**
     * Get the stored debugger as plain text, if possible.
     */
    getDebuggerAsPlaintext(): Promise<string> {
        if (!this.server.options.debugger.enabled) {
            return Promise.resolve('');
        }

        return this.driver.getDebuggerAsPlaintext();
    }

    /**
     * Get the stored debugger as JSON.
     */
    getDebuggerAsJson(): Promise<prom.metric[]|void> {
        if (!this.server.options.debugger.enabled) {
            return Promise.resolve();
        }

        return this.driver.getDebuggerAsJson();
    }

    /**
     * Reset the debugger at the server level.
     */
    clear(): Promise<void> {
        return this.driver.clear();
    }
}
