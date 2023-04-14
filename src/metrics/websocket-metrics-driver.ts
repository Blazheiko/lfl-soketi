import {MetricsInterface} from "./metrics-interface";
import { WebSocket } from 'uWebSockets.js';
import {metric} from "prom-client";
import {Server} from "../server";
import * as prom from "prom-client";
import {Log} from "../log";

export class WebsocketMetricsDriver implements MetricsInterface {
    driver: MetricsInterface;
    constructor(protected server: Server) {


    }

    protected metrics = {
        // TODO: Metrics for subscribes/unsubscribes/client events?
    };

    clear(): Promise<void> {
        return Promise.resolve(undefined);
    }

    getMetricsAsJson(): Promise<metric[] | void> {
        return Promise.resolve(undefined);
    }

    getMetricsAsPlaintext(): Promise<string> {
        return Promise.resolve("");
    }

    markApiMessage(appId: string, incomingMessage: any, sentMessage: any): void {
        Log.info('markApiMessage')
    }

    markDisconnection(ws: WebSocket): void {
        Log.info('markDisconnection')
    }

    markHorizontalAdapterRequestReceived(appId: string): void {
        Log.info('markHorizontalAdapterRequestReceived')
    }

    markHorizontalAdapterRequestSent(appId: string): void {
        Log.info('markHorizontalAdapterRequestSent')
    }

    markHorizontalAdapterResponseReceived(appId: string): void {
        Log.info('markHorizontalAdapterResponseReceived')
    }

    markNewConnection(ws: WebSocket): void {
        Log.info('markNewConnection');
        Log.info( `new connection app: ${ws.app.id}`);
        const message = { type: 'NewConnection',}
        this.sendMessage(ws.app.id, message);
        // Log.info( `ip: ${ws.app.ip}`)
        // Log.info( `user agent: ${ws.app.userAgent}`)
    }

    sendMessage(appId: string, message: any){
        Log.info('send debug Message');
        let copyMessage = Object.assign({}, message);
        if(copyMessage.event){
            copyMessage.event = this.server.options.metrics.debugEvent;
        }

        const msg = {
            event: this.server.options.metrics.debugEvent,
            channel: this.server.options.metrics.debugChannel,
            data: copyMessage,
        };
        console.log(msg);
        // const appId = this.server.options.metrics.debugAppId;

        this.server.adapter.send(appId, msg.channel, JSON.stringify(msg), '');
    }

    markWsMessageReceived(appId: string, message: any): void {

        if( this.checkDebugMessage(message) ) {
            Log.info('markWsMessageReceived');
            console.log({ message });
            this.sendMessage(appId, message);
        }

    }

    checkDebugMessage(message: any): boolean{
        if(!message) return false;
        // Log.info( this.server.options.metrics.debugChannel )
        return !( message.event === 'pusher:ping' ||
                  message.event === 'pusher:pong' ||
                  message.channel === this.server.options.metrics.debugChannel ||
                  ( message.data && message.data.channel === this.server.options.metrics.debugChannel )
            )
        }

    markWsMessageSent(appId: string, sentMessage: any): void {
        if( this.checkDebugMessage(sentMessage) ) {
            Log.info('markWsMessageSent')
            console.log({ sentMessage });
        }

    }

    trackHorizontalAdapterResolveTime(appId: string, time: number): void {
        Log.info('trackHorizontalAdapterResolveTime')
    }

    trackHorizontalAdapterResolvedPromises(appId: string, resolved?: boolean): void {
        Log.info('trackHorizontalAdapterResolvedPromises')
    }

}
