import { createHash } from 'crypto';

const CacheItem = Jymfony.Component.Cache.CacheItem;
const DateTime = Jymfony.Component.DateTime.DateTime;
const LoggerAwareTrait = Jymfony.Contracts.Logger.LoggerAwareTrait;

/**
 * @memberOf Jymfony.Component.Cache.Traits
 */
class AbstractAdapterTrait extends LoggerAwareTrait.definition {
    /**
     * Constructor.
     */
    __construct() {
        /**
         * @type {string|undefined}
         *
         * @private
         */
        this._namespace = undefined;

        /**
         * @type {string|undefined}
         *
         * @private
         */
        this._namespaceVersion = undefined;
    }

    /**
     * Fetches several cache items.
     *
     * @param {string[]} ids The cache identifiers to fetch
     *
     * @returns {Promise<Object.<string, *>>} The corresponding values found in the cache
     *
     * @abstract
     *
     * @protected
     */
    _doFetch(ids) { } // eslint-disable-line no-unused-vars

    /**
     * Confirms if the cache contains specified cache item.
     *
     * @param {string} id The identifier for which to check existence
     *
     * @returns {Promise<boolean>} True if item exists in the cache, false otherwise
     *
     * @abstract
     *
     * @protected
     */
    _doHave(id) { } // eslint-disable-line no-unused-vars

    /**
     * Deletes all items in the pool.
     *
     * @param {string} namespace The prefix used for all identifiers managed by this pool
     *
     * @returns {Promise<boolean>} True if the pool was successfully cleared, false otherwise
     *
     * @abstract
     *
     * @protected
     */
    _doClear(namespace) { } // eslint-disable-line no-unused-vars

    /**
     * Removes multiple items from the pool.
     *
     * @param {string[]} ids An array of identifiers that should be removed from the pool
     *
     * @returns {Promise<boolean>} True if the items were successfully removed, false otherwise
     *
     * @abstract
     *
     * @protected
     */
    _doDelete(ids) { } // eslint-disable-line no-unused-vars

    /**
     * Persists several cache items immediately.
     *
     * @param {Object.<string, *>} values   The values to cache, indexed by their cache identifier
     * @param {int} lifetime The lifetime of the cached values, 0 for persisting until manual cleaning
     *
     * @returns {Promise<Object.<string, *>|boolean>} The identifiers that failed to be cached or a boolean stating if caching succeeded or not
     *
     * @abstract
     *
     * @protected
     */
    _doSave(values, lifetime) { } // eslint-disable-line no-unused-vars

    /**
     * @inheritdoc
     */
    async hasItem(key) {
        const id = await this._getId(key);

        try {
            return await this._doHave(id);
        } catch (e) {
            this._logger.warning('Failed to check if key "{key}" is cached', {key: key, exception: e});

            return false;
        }
    }

    /**
     * @inheritdoc
     */
    async clear() {
        let cleared = undefined !== this._namespaceVersion;
        if (cleared) {
            this._namespaceVersion = 2;

            for (const v of Object.values(await this._doFetch([ '@' + this._namespace ]))) {
                this._namespaceVersion = 1 + ~~v;
            }

            this._namespaceVersion += ':';
            cleared = await this._doSave({['@' + this._namespace]: this._namespaceVersion}, 0);
        }

        try {
            return await this._doClear(this._namespace) || cleared;
        } catch (e) {
            this._logger.warning('Failed to clear the cache', {exception: e});

            return false;
        }
    }

    /**
     * @inheritdoc
     */
    deleteItem(key) {
        return this.deleteItems([ key ]);
    }

    /**
     * @inheritdoc
     */
    async deleteItems(keys) {
        const ids = [];
        for (const key of keys) {
            ids.push(await this._getId(key));
        }

        try {
            await this._doDelete(ids);
            return true;
        } catch {
        }

        let ok = true;

        // When bulk-delete failed, retry each item individually
        for (const [ key, id ] of __jymfony.getEntries(ids)) {
            try {
                await this._doDelete([ id ]);
            } catch (e) {
                this._logger.warning('Failed to delete key "{key}"', { key: key, exception: e });
                ok = false;
            }
        }

        return ok;
    }

    /**
     * Enables/disables versioning of items.
     *
     * When versioning is enabled, clearing the cache is atomic and doesn't require listing existing keys to proceed,
     * but old keys may need garbage collection and extra round-trips to the back-end are required.
     *
     * Calling this method also clears the memoized namespace version and thus forces a resynchonization of it.
     *
     * @param {boolean} [enable = true]
     *
     * @returns {boolean} the previous state of versioning
     */
    enableVersioning(enable = true) {
        const wasEnabled = undefined !== this._namespaceVersion;
        this._namespaceVersion = enable ? '' : undefined;

        return wasEnabled;
    }

    /**
     * @param {string} key
     *
     * @returns {Promise<*>}
     *
     * @private
     */
    async _getId(key) {
        CacheItem.validateKey(key);

        if ('' === this._namespaceVersion) {
            this._namespaceVersion = '1:';
            for (const v of Object.values(await this._doFetch([ '@' + this._namespace ]))) {
                this._namespaceVersion = v;
            }
        }

        const namespace = undefined === this._namespace ? '' : this._namespace;
        const nsVersion = undefined === this._namespaceVersion ? '' : this._namespaceVersion;

        if (undefined === this.constructor.MAX_ID_LENGTH) {
            return namespace + nsVersion + key;
        }

        let id = namespace + nsVersion + key;
        if (id.length > this.constructor.MAX_ID_LENGTH) {
            const hash = createHash('sha256');
            hash.update(key);
            key = hash.digest('base64');
            id = namespace + nsVersion + key;
        }

        return id;
    }


    /**
     * @inheritdoc
     */
    async getItem(key) {
        const id = await this._getId(key);

        let isHit = false;
        let value = undefined;

        try {
            for (const val of Object.values(await this._doFetch([ id ]))) {
                value = val;
                isHit = true;
            }
        } catch (e) {
            this._logger.warning('Failed to fetch key "{key}"', { key, exception: e });
        }

        return this._createCacheItem(key, value, isHit);
    }

    /**
     * @inheritdoc
     */
    async getItems(keys = []) {
        let ids = await Promise.all(keys.map(key => this._getId(key)));

        let items;
        try {
            items = await this._doFetch(ids);
        } catch (e) {
            this._logger.warning('Failed to fetch requested items', { keys, exception: e });

            items = [];
        }

        ids = Object.entries(ids)
            .reduce((res, val) => (res[val[1]] = keys[val[0]], res), {});

        return new Map(this._generateItems(items, ids));
    }

    /**
     * @inheritdoc
     */
    save(item) {
        if (! (item instanceof CacheItem)) {
            return false;
        }

        let lifetime = item._expiry - DateTime.unixTime;
        if (undefined === item._expiry) {
            lifetime = item._defaultLifetime;
        }

        if (undefined !== lifetime && 0 > lifetime) {
            return this._doDelete([ item.key ]);
        }

        return this._doSave({ [item.key]: item.get() }, lifetime);
    }

    * _generateItems(items, keys) {
        try {
            for (const [ id, value ] of __jymfony.getEntries(items)) {
                if (undefined === keys[id]) {
                    continue;
                }

                const key = keys[id];
                delete keys[id];
                yield [ key, this._createCacheItem(key, value, true) ];
            }
        } catch (e) {
            this._logger.warning('Failed to fetch requested items', { keys: Object.values(keys), exception: e });
        }

        for (const key of Object.values(keys)) {
            yield [ key, this._createCacheItem(key, undefined, false) ];
        }
    }

    /**
     * @inheritdoc
     */
    async close() {
        // Nothing to do.
    }
}

AbstractAdapterTrait.MAX_ID_LENGTH = undefined;

export default getTrait(AbstractAdapterTrait);
