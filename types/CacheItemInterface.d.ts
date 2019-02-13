declare namespace Jymfony.Component.Cache {
    import DateTime = Jymfony.Component.DateTime.DateTime;
    import TimeSpan = Jymfony.Component.DateTime.TimeSpan;

    /**
     * CacheItemInterface defines an interface for interacting with objects inside a cache.
     *
     * Each Item object MUST be associated with a specific key, which can be set
     * according to the implementing system and is typically passed by the
     * CacheItemPoolInterface object.
     *
     * The CacheItemInterface object encapsulates the storage and retrieval of
     * cache items. Each CacheItemInterface is generated by a
     * CacheItemPoolInterface object, which is responsible for any required
     * setup as well as associating the object with a unique Key.
     * CacheItemInterface objects MUST be able to store and retrieve any type
     * of value defined in the Data section of the specification.
     *
     * Calling Libraries MUST NOT instantiate Item objects themselves. They may only
     * be requested from a Pool object via the getItem() method.  Calling Libraries
     * SHOULD NOT assume that an Item created by one Implementing Library is
     * compatible with a Pool from another Implementing Library.
     */
    export class CacheItemInterface<T> implements MixinInterface {
        public static readonly definition: Newable<CacheItemInterface<any>>;

        /**
         * Returns the key for the current cache item.
         *
         * The key is loaded by the Implementing Library, but should be available to
         * the higher level callers when needed.
         *
         * @returns The key string for this cache item.
         */
        readonly key: string;

        /**
         * Retrieves the value of the item from the cache associated with this object's key.
         *
         * The value returned must be identical to the value originally stored by set().
         *
         * If isHit() returns false, this method MUST return null. Note that null
         * is a legitimate cached value, so the isHit() method SHOULD be used to
         * differentiate between "null value was found" and "no value was found."
         */
        get(): T;

        /**
         * Confirms if the cache item lookup resulted in a cache hit.
         *
         * Note: This method MUST NOT have a race condition between calling isHit()
         * and calling get().
         */
        readonly isHit: boolean;

        /**
         * Sets the value represented by this cache item.
         *
         * The value argument may be any item that can be serialized,
         * although the method of serialization is left up to the Implementing
         * Library.
         */
        set(value: T): CacheItemInterface<T>;

        /**
         * Sets the expiration time for this cache item.
         *
         * @param expiration
         *   The point in time after which the item MUST be considered expired.
         *   If null or undefined is passed explicitly, a default value MAY be used.
         *   If none is set, the value should be stored permanently or for as long as the
         *   implementation allows.
         */
        expiresAt(expiration: null|undefined|DateTime): CacheItemInterface<T>;

        /**
         * Sets the expiration time for this cache item.
         *
         * @param time
         *   The period of time from the present after which the item MUST be considered
         *   expired. An integer parameter is understood to be the time in seconds until
         *   expiration. If null is passed explicitly, a default value MAY be used.
         *   If none is set, the value should be stored permanently or for as long as the
         *   implementation allows.
         */
        expiresAfter(time: null|undefined|TimeSpan|number): CacheItemInterface<T>;
    }
}
