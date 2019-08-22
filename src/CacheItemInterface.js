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
 *
 * @memberOf Jymfony.Component.Cache
 */
class CacheItemInterface {
    /**
     * Returns the key for the current cache item.
     *
     * The key is loaded by the Implementing Library, but should be available to
     * the higher level callers when needed.
     *
     * @returns {string} The key string for this cache item.
     */
    get key() { }

    /**
     * Retrieves the value of the item from the cache associated with this object's key.
     *
     * The value returned must be identical to the value originally stored by set().
     *
     * If isHit() returns false, this method MUST return null. Note that null
     * is a legitimate cached value, so the isHit() method SHOULD be used to
     * differentiate between "null value was found" and "no value was found."
     *
     * @returns {*} The value corresponding to this cache item's key, or null if not found.
     */
    get() { }

    /**
     * Confirms if the cache item lookup resulted in a cache hit.
     *
     * Note: This method MUST NOT have a race condition between calling isHit()
     * and calling get().
     *
     * @returns {boolean} True if the request resulted in a cache hit. False otherwise.
     */
    get isHit() { }

    /**
     * Sets the value represented by this cache item.
     *
     * The value argument may be any item that can be serialized,
     * although the method of serialization is left up to the Implementing
     * Library.
     *
     * @param {*} value The serializable value to be stored.
     *
     * @returns {Jymfony.Component.Cache.CacheItemInterface} The invoked object.
     */
    set(value) { }

    /**
     * Sets the expiration time for this cache item.
     *
     * @param {Jymfony.Component.DateTime.DateTime|undefined|null} expiration
     *   The point in time after which the item MUST be considered expired.
     *   If null or undefined is passed explicitly, a default value MAY be used.
     *   If none is set, the value should be stored permanently or for as long as the
     *   implementation allows.
     *
     * @returns {Jymfony.Component.Cache.CacheItemInterface} The invoked object.
     */
    expiresAt(expiration) { }

    /**
     * Sets the expiration time for this cache item.
     *
     * @param {int|Jymfony.Component.DateTime.TimeSpan|undefined} time
     *   The period of time from the present after which the item MUST be considered
     *   expired. An integer parameter is understood to be the time in seconds until
     *   expiration. If null is passed explicitly, a default value MAY be used.
     *   If none is set, the value should be stored permanently or for as long as the
     *   implementation allows.
     *
     * @returns {Jymfony.Component.Cache.CacheItemInterface} The invoked object.
     */
    expiresAfter(time) { }
}

export default getInterface(CacheItemInterface);
