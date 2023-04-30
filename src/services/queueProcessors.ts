import { WebhookInterface } from "../app";
import async from 'async';
import { Log } from "../log";
import axios from "axios";
import { Lambda } from "aws-sdk";
import { createWebhookHmac, JobData } from "../webhook-sender";
import {Server} from "../server";

const queueProcessors = (server: Server) =>{
    let delay = 1000;
    let retries = 0;
    const maxRetries = 7;

    const sendHTTP = ( appId: string,webhook: WebhookInterface , payload, server: Server, headers, resolveWebhook ) => {
        retries++
        // Send HTTP POST to the target URL
        axios.post(webhook.url, payload, { headers })
            .then((res) => {
                if (server.options.debug) {
                    Log.webhookSenderTitle('✅ Webhook sent.');
                    Log.webhookSender({ webhook, payload });
                }
                resolveWebhook()
            })
            .catch(error => {

                if (retries >= maxRetries) {
                    if (server.options.debug) {
                        Log.webhookSenderTitle('❎ Webhook could not be sent.');
                        Log.webhookSender({ error, webhook, payload });
                    }
                    // Here you can send a notification to technical support
                    resolveWebhook()
                } else {
                    console.log(`Request to ${webhook.url} failed, ${ retries } retrying in ${ delay } ms`);
                    setTimeout(() => sendHTTP(appId, webhook, payload, server, headers, resolveWebhook ), delay);
                    delay *= 2; // exponential backoff
                }
            });
        // .then(() => resolveWebhook())
    }

    const invokeLambda = ( webhook, payload, server, headers, resolveWebhook ) => {
        // Invoke a Lambda function
        const params = {
            FunctionName: webhook.lambda_function,
            InvocationType: webhook.lambda.async ? 'Event' : 'RequestResponse',
            Payload: Buffer.from(JSON.stringify({ payload, headers })),
        };

        let lambda = new Lambda({
            apiVersion: '2015-03-31',
            region: webhook.lambda.region || 'us-east-1',
            ...(webhook.lambda.client_options || {}),
        });

        lambda.invoke(params, (err, data) => {
            if (err) {
                if (server.options.debug) {
                    Log.webhookSenderTitle('❎ Lambda trigger failed.');
                    Log.webhookSender({ webhook, err, data });
                }
            } else {
                if (server.options.debug) {
                    Log.webhookSenderTitle('✅ Lambda triggered.');
                    Log.webhookSender({ webhook, payload });
                }
            }

            resolveWebhook();
        });
    }


    return (job, done ) => {
        let rawData: JobData = job.data;


        const { appKey, payload, originalPusherSignature } = rawData;

        server.appManager.findByKey(appKey).then(app => {
            // Ensure the payload hasn't been tampered with between the job being dispatched
            // and here, as we may need to recalculate the signature post filtration.
            if (originalPusherSignature !== createWebhookHmac(JSON.stringify(payload), app.secret)) {
                return;
            }

            async.each(app.webhooks, (webhook: WebhookInterface, resolveWebhook) => {
                const originalEventsLength = payload.events.length;
                let filteredPayloadEvents = payload.events;

                filteredPayloadEvents = filteredPayloadEvents.filter(event => {
                    if (!webhook.event_types.includes(event.name)) {
                        return false;
                    }

                    if (webhook.filter) {
                        if (webhook.filter.channel_name_starts_with && !event.channel.startsWith(webhook.filter.channel_name_starts_with)) {
                            return false;
                        }

                        if (webhook.filter.channel_name_ends_with && !event.channel.endsWith(webhook.filter.channel_name_ends_with)) {
                            return false;
                        }
                    }

                    return true;
                });

                // If there's no webhooks to send after filtration, we should resolve early.
                if (filteredPayloadEvents.length === 0) {
                    return resolveWebhook();
                }

                // If any events have been filtered out, regenerate the signature
                let pusherSignature = (originalEventsLength !== filteredPayloadEvents.length)
                    ? createWebhookHmac(JSON.stringify(payload), app.secret)
                    : originalPusherSignature;

                if (server.options.debug) {
                    Log.webhookSenderTitle('🚀 Processing webhook from queue.');
                    Log.webhookSender({ appKey, payload, pusherSignature });
                }

                const headers = {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'User-Agent': `SoketiWebhooksAxiosClient/1.0 (Process: ${server.options.instance.process_id})`,
                    // We specifically merge in the custom headers here so the headers below cannot be overwritten
                    ...webhook.headers ?? {},
                    'X-Pusher-Key': appKey,
                    'X-Pusher-Signature': pusherSignature,
                };

                if (webhook.url) {
                    sendHTTP(app.id, webhook, payload, server, headers, resolveWebhook );
                } else if (webhook.lambda_function) {
                    invokeLambda( webhook, payload, server, headers, resolveWebhook )
                }
            }).then(() => {
                if (typeof done === 'function') {
                    done();
                }
            });
        });
    }

};

export default queueProcessors
