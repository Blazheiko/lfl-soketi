import { Options } from "../options";
import { AppInterface } from "../app";
import {Log} from "../log";

const setAppOptions = (options: object,defaultOptions: Options):AppInterface => {
    return {
        id: extractFromPassedKeys(options, ['id', 'AppId'], 'app-id'),
        key: extractFromPassedKeys(options, ['key', 'AppKey'], 'app-key'),
        secret: extractFromPassedKeys(options, ['secret', 'AppSecret'], 'app-secret'),
        maxConnections: extractFromPassedKeys(options, ['maxConnections', 'MaxConnections', 'max_connections'], -1),
        enableClientMessages: Boolean(extractFromPassedKeys(options, ['enableClientMessages', 'EnableClientMessages', 'enable_client_messages'], false)),
        enabled: Boolean(extractFromPassedKeys(options, ['enabled', 'Enabled'], true)),
        maxBackendEventsPerSecond: parseInt(extractFromPassedKeys(options, ['maxBackendEventsPerSecond', 'MaxBackendEventsPerSecond', 'max_backend_events_per_sec'], -1)),
        maxClientEventsPerSecond: parseInt(extractFromPassedKeys(options, ['maxClientEventsPerSecond', 'MaxClientEventsPerSecond', 'max_client_events_per_sec'], -1)),
        maxReadRequestsPerSecond: parseInt(extractFromPassedKeys(options, ['maxReadRequestsPerSecond', 'MaxReadRequestsPerSecond', 'max_read_req_per_sec'], -1)),
        webhooks: transformPotentialJsonToArray(extractFromPassedKeys(options, ['webhooks', 'Webhooks'], [])),
        maxPresenceMembersPerChannel: parseInt(extractFromPassedKeys(options, ['maxPresenceMembersPerChannel', 'MaxPresenceMembersPerChannel', 'max_presence_members_per_channel'], defaultOptions.presence.maxMembersPerChannel)),
        maxPresenceMemberSizeInKb: parseFloat(extractFromPassedKeys(options, ['maxPresenceMemberSizeInKb', 'MaxPresenceMemberSizeInKb', 'max_presence_member_size_in_kb'], defaultOptions.presence.maxMemberSizeInKb)),
        maxChannelNameLength: parseInt(extractFromPassedKeys(options, ['maxChannelNameLength', 'MaxChannelNameLength', 'max_channel_name_length'], defaultOptions.channelLimits.maxNameLength)),
        maxEventChannelsAtOnce: parseInt(extractFromPassedKeys(options, ['maxEventChannelsAtOnce', 'MaxEventChannelsAtOnce', 'max_event_channels_at_once'], defaultOptions.eventLimits.maxChannelsAtOnce)),
        maxEventNameLength: parseInt(extractFromPassedKeys(options, ['maxEventNameLength', 'MaxEventNameLength', 'max_event_name_length'], defaultOptions.eventLimits.maxNameLength)),
        maxEventPayloadInKb: parseFloat(extractFromPassedKeys(options, ['maxEventPayloadInKb', 'MaxEventPayloadInKb', 'max_event_payload_in_kb'], defaultOptions.eventLimits.maxPayloadInKb)),
        maxEventBatchSize: parseInt(extractFromPassedKeys(options, ['maxEventBatchSize', 'MaxEventBatchSize', 'max_event_batch_size'], defaultOptions.eventLimits.maxBatchSize)),
        enableUserAuthentication: Boolean(extractFromPassedKeys(options, ['enableUserAuthentication', 'EnableUserAuthentication', 'enable_user_authentication'], false)),
        name: extractFromPassedKeys(options, ['name', 'Name'], 'Noname'),

    }
}

const extractFromPassedKeys = (app: { [key: string]: any; }, parameters: string[], defaultValue: any): any => {
    let extractedValue = defaultValue;

    parameters.forEach(param => {
        if (typeof app[param] !== 'undefined' && !['', null].includes(app[param])) {
            extractedValue = app[param];
        }
    });

    return extractedValue;
}

const transformPotentialJsonToArray = (potentialJson: any): any =>{
    if (potentialJson instanceof Array) {
        return potentialJson;
    }

    try {
        let potentialArray = JSON.parse(potentialJson);

        if (potentialArray instanceof Array) {
            return potentialArray;
        }
    } catch (e) {
        //TODO write error to DB
        Log.error('Error parse json webhook')
    }

    return [];
}

export { setAppOptions }
