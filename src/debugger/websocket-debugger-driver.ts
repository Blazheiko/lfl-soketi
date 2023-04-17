import {Server} from "../server";
import {metric} from "prom-client";
import {Log} from "../log";
import {WebSocket} from "uWebSockets.js";
import {DebuggerInterface} from "./debugger-interface";

export class WebsocketDebuggerDriver implements DebuggerInterface {
    driver: DebuggerInterface;
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
        Log.info('markApiMessage');
        if( this.checkDebugMessage(sentMessage) ) {
            Log.info('markWsMessageReceived');
            console.log({ incomingMessage });
            this.sendMessage(appId, incomingMessage,'ApiMessage');
        }
    }

    markDisconnection(ws: WebSocket): void {
        Log.info('markDisconnection');
        const message = { event: 'Disconnection' }
        this.sendMessage(ws.app.id, message,'Disconnection');
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
        const message = { event: 'NewConnection' }
        this.sendMessage(ws.app.id, message,'NewConnection');
    }

    sendMessage(appId: string, message: any, type: string){
        Log.info('send debug Message');
        let copyMessage = Object.assign({
            type: type,
            instance: this.server.options.debugger.currentInstance,
            eventStart: message.event
        }, message);
        if(copyMessage.event){
            copyMessage.event = this.server.options.debugger.debugEvent;
        }

        const msg = {
            event: this.server.options.debugger.debugEvent,
            channel: this.server.options.debugger.debugChannel,
            data: copyMessage,
        };
        console.log(msg);
        // const appId = this.server.options.debugger.debugAppId;

        this.server.adapter.send(appId, msg.channel, JSON.stringify(msg), '');
    }

    markWsMessageReceived(appId: string, message: any): void {
        if( this.checkDebugMessage(message) ) {
            Log.info('markWsMessageReceived');
            console.log({ message });
            this.sendMessage(appId, message,'SendMessage');
        }
    }

    checkDebugMessage(message: any): boolean{
        if(!message) return false;
        // Log.info( this.server.options.
        // .debugChannel )
        return !( message.event === 'pusher:ping' ||
            message.event === 'pusher:pong' ||
            message.channel === this.server.options.debugger.debugChannel ||
            ( message.data && message.data.channel === this.server.options.debugger.debugChannel )
        )
    }

    markWsMessageSent(appId: string, sentMessage: any): void {
        if( this.checkDebugMessage(sentMessage) ) {
            Log.info('markWsMessageSent')
            console.log({ sentMessage });
            this.sendMessage(appId, sentMessage,'WsMessageSent');
        }

    }

    trackHorizontalAdapterResolveTime(appId: string, time: number): void {
        Log.info('trackHorizontalAdapterResolveTime')
    }

    trackHorizontalAdapterResolvedPromises(appId: string, resolved?: boolean): void {
        Log.info('trackHorizontalAdapterResolvedPromises')
    }

    getDebuggerAsJson(): Promise<metric[] | void> {
        return Promise.resolve(undefined);
    }

    getDebuggerAsPlaintext(): Promise<string> {
        return Promise.resolve("");
    }

}
