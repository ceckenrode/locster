import fs from "fs";
import path from "path";
import delve from "dlv";
import deepSet from "dset";

const Storage = (function() {
  // In memory representation of the cache
  let context = {};

  // Event types and subscriptions
  const events = { STORAGE: [] };

  /**
   * Fires subscriptions for storage events
   */
  const emitChange = function() {
    events.STORAGE.forEach(function(cb) {
      cb(context.data);
    });
  };

  /**
   * Safely deep sets an object key
   * @param {string | string[]} propertyList - A period delimited list or array of properties to deeply set
   * @param {any | undefined} value - The value to set the specified property to
   */
  const deepSetItem = function(propertyList, value) {
    deepSet(context.data, propertyList, value);
    fs.writeFileSync(context.dir, JSON.stringify(context.data), "utf8");
    emitChange();
  };

  /**
   * Safely deep gets an object key
   * @param {string | string[]} propertyList
   * @returns {any | undefined}
   */
  const deepGetItem = function(propertyList) {
    return delve(context.data, propertyList);
  };

  /**
   *
   * @param {string} dir - The path and filename for the new cache file
   * @param {Object} options - Options for the storage object
   * @param {boolean} options.force - Whether or not a new cache should be created if one exists at the specified location
   */
  const Storage = function(dir = "./.cache", options = { force: false }) {
    // Check if passed directory is relative or absolute, resolve to absolute
    const resolvedDir =
      dir.charAt(0) !== "/" ? path.join(process.cwd(), dir) : dir;

    // True if cache already exists, else false
    const cacheExists = fs.existsSync(resolvedDir);

    // If there's no cache or `options.force` is true, create new cache
    if (!cacheExists || options.force === true) {
      context = { dir: resolvedDir, data: {} };
      fs.writeFileSync(resolvedDir, JSON.stringify(context.data), "utf8");
    } else {
      // Otherwise update context with cache
      context = {
        dir: resolvedDir,
        data: JSON.parse(fs.readFileSync(dir, "utf8"))
      };
    }
  };

  /**
   * Creates a new subscription for an event
   * @param {string} key - The of event to subscribe to
   * @param {function} - The function to fire when the event occurs
   */
  Storage.prototype.on = function(type, callback) {
    const key = type.toUpperCase();
    if (key in events) events[key].push(callback);
  };

  /**
   * Resets the cache object and cache file
   */
  Storage.prototype.clear = function() {
    context = { dir: context.dir, data: {} };
    fs.writeFileSync(context.dir, JSON.stringify(context.data), "utf8");
    emitChange();
  };

  /**
   * Gets back the value at the specified key
   * @param {number} key - The index of the root key to get
   * @returns {string}
   */
  Storage.prototype.key = function(key) {
    return Object.keys(context.data)[key];
  };

  /**
   * Removes an item from the cache either at the top level or nested
   * @param {string} key - The key to remove
   */
  Storage.prototype.removeItem = function(key) {
    if (~key.indexOf(".")) return deepSetItem(key);
    else delete context.data[key];
    emitChange();
  };

  /**
   * Sets an item in the cache at the top level or nested
   * @param {string} key - The key to update
   * @param {any} value - The key's new value
   */
  Storage.prototype.setItem = function(key, value) {
    if (~key.indexOf(".")) return deepSetItem(key, value);
    context.data[key] = value;
    fs.writeFileSync(context.dir, JSON.stringify(context.data), "utf8");
    emitChange();
  };

  /**
   * Retrieves an item in the cache at the top level or nested
   * @param {string} key - The key of the value to be retrieved
   * @returns {any}
   */
  Storage.prototype.getItem = function(key) {
    if (key === "*") return context.data;
    if (~key.indexOf(".")) return deepGetItem(key);
    return context.data[key];
  };

  /**
   * Gets the filepath the cache is located in
   * @returns {string}
   */
  Storage.prototype.getDir = function() {
    return context.dir;
  };

  /**
   * Destroys the cache file and cache object
   */
  Storage.prototype.destroy = function() {
    fs.unlinkSync(context.dir);
    events.STORAGE = [];
    context = undefined;
  };

  return Storage;
})();

export default Storage;
