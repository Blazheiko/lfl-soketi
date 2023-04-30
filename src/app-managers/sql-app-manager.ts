import { App } from './../app';
import { WebhookInterface } from "../app";
import { BaseAppManager } from './base-app-manager';
import { Log } from '../log';
import { Knex, knex } from 'knex';
import { Server } from './../server';

export abstract class SqlAppManager extends BaseAppManager {
    /**
     * The Knex connection.
     *
     * @type {Knex}
     */
    protected connection: Knex;

    /**
     * Create a new app manager instance.
     */
    constructor(protected server: Server) {
        super();

        let knexConfig = {
            client: this.knexClientName(),
            connection: this.knexConnectionDetails(),
            version: this.knexVersion(),
        };

        if (this.supportsPooling() && server.options.databasePooling.enabled) {
            knexConfig = {
                ...knexConfig,
                ...{
                    pool: {
                        min: server.options.databasePooling.min,
                        max: server.options.databasePooling.max,
                    },
                },
            };
        }

        this.connection = knex(knexConfig);
    }

    /**
     * Find an app by given ID.
     */
    findById(id: string): Promise<App|null> {
        return this.selectById(id).then(apps => {
            if (apps.length === 0) {
                if (this.server.options.debug) {
                    Log.error(`App ID not found: ${id}`);
                }

                return null;
            }

            return new App(apps[0] || apps, this.server);
        });
    }

    /**
     * Find an app by given key.
     */
    findByKey(key: string): Promise<App|null> {
        return this.selectByKey(key).then(apps => {
            if (apps.length === 0) {
                if (this.server.options.debug) {
                    Log.error(`App key not found: ${key}`);
                }

                return null;
            }

            return new App(apps[0] || apps, this.server);
        });
    }
    /**
     * Save a failed webhook send.
     */
    saveErrorWebhook(appId: string,webhook: WebhookInterface, payload, error): void {
        this.saveWebhookError(appId,webhook, payload, error,'webhook_errors')
            .then(() => {
                if (this.server.options.debug) {
                    Log.error(`Save Error Webhook`);
                }
            })
            .catch(error => {
                Log.error(`Save Error Webhook failed`)
                // Log.info(error)
                console.error(error)
            });
    }

    saveErrorClient( appId: string,user_id: string,instance:string, error:object ): void {
        this.saveClientError(appId, user_id ,instance , error, 'client_ws_errors')
            .then(() => {
                if (this.server.options.debug) {
                    Log.error(`Save Error Client`);
                }
            })
            .catch(error => {
                Log.error(`Save Error Client failed`)
                // Log.info(error)
                console.error(error)
            });
    }

    getFirstAppName(): Promise<App[]|null> {
        return this.selectFirstAppName()
    }

    /**
     * Make a Knex insert for the error.
     */
    protected saveWebhookError(appId: string, webhook: WebhookInterface, payload, error, tableName: string): Promise<void> {

        return this.connection(tableName)
            .insert({
                appId,
                webhook,
                url: webhook.url,
                payload,
                error
            })
    }
    protected saveClientError(appId: string,user_id: string,instance:string, error:object, tableName: string): Promise<void> {

        return this.connection(tableName)
            .insert({ appId, user_id, instance, error })
    }

    /**
     * Select first app name for information by start soketi.
     */
    protected selectFirstAppName(): Promise<App[]> {
        return this.connection(this.appsTableName())
            .select('id','name')
            .orderBy('id','asc')
            .limit(1)
    }

    /**
     * Make a Knex selection for the app ID.
     */
    protected selectById(id: string): Promise<App[]> {
        return this.connection<App>(this.appsTableName())
            .where('id', id)
            .select('*');
    }

    /**
     * Make a Knex selection for the app key.
     */
    protected selectByKey(key: string): Promise<App[]> {
        return this.connection<App>(this.appsTableName())
            .where('key', key)
            .select('*');
    }

    /**
     * Get the client name to be used by Knex.
     */
    protected abstract knexClientName(): string;

    /**
     * Get the object connection details for Knex.
     */
    protected abstract knexConnectionDetails(): { [key: string]: any; };

    /**
     * Get the connection version for Knex.
     * For MySQL can be 5.7 or 8.0, etc.
     */
    protected abstract knexVersion(): string;

    /**
     * Wether the manager supports pooling. This introduces
     * additional settings for connection pooling.
     */
    protected abstract supportsPooling(): boolean;

    /**
     * Get the table name where the apps are stored.
     */
    protected abstract appsTableName(): string;
}
