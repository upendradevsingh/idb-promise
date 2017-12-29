/*******************************************************************
 ******************** Promisified IndexedDB ************************
 *******************************************************************/
/**
 * Reference :: https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API
 */

/**
 * MIT License
 * Copyright (c) 2017 Upendra Dev Singh
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * urnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/* jshint ignore:start */
(function (factory, config) {
    if (typeof exports !== 'undefined' && typeof module !== 'undefined') {
        module.exports = factory();;
    } else if (typeof define === 'function' && typeof define.amd === 'object') {
        define([], function () {
            return factory();
        });
    } else {
        var IDB = factory();
        /* var config = {
            version: 1,
            dbName: 'JABONG',
            options
        }; */

        window.__idb__ = new IDB(config.dbName, config.version, {
            onupgradeneeded: config.options.onupgradeneeded
        });
    }
}(function () {
    /**
     * @description storage base class
     * @class Storage
     */
    function Storage(dbName, version, options) {
        this.store = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
        this.db = null;
        this.dbName = dbName;
        this.dbVersion = version;
        this.start(options);
    }

    Storage.prototype.isStorageAvailable = function () {
        return this.store !== 'undefined';
    }
    Storage.prototype.start = function (options) {
        var store = this.store;
        var dbName = this.dbName;
        var dbVersion = this.dbVersion;
        var _this = this;

        return new Promise(function (resolve, reject) {
            var request = store.open(dbName, dbVersion);
            var onupgradeneeded = options.onupgradeneeded;

            request.onerror = function (event) {
                return reject('Could not open this database!');
            };

            request.onsuccess = function (event) {
                _this.db = event.target.result;
                return resolve(_this.db);
            };

            var defaults = function (event) {
                var db = event.target.result;
                if (event.oldVersion === 0) {
                    db.createObjectStore('defaultObjStore', { keyPath: 'id' });
                }
            }

            // This event is only implemented in recent browsers
            request.onupgradeneeded = onupgradeneeded || defaults;
        });
    }

    Storage.prototype.open = function () {
        return this.db ? Promise.resolve(this.db) : this.start();
    }

    Storage.prototype.read = function (store) {
        return this.open()
            .then(function (db) {
                return new Promise(function (resolve, reject) {
                    var transaction = db.transaction(store, 'readwrite');
                    var objectStore = transaction.objectStore(store);
                    var results = [];
                    var cursor = objectStore.openCursor();

                    cursor.onsuccess = function (event) {
                        var data = event.target.result;
                        if (data) {
                            results.push(data.value);
                            data.continue();
                        } else {
                            return resolve(results);
                        }
                    };

                    cursor.onerror = function (event) {
                        resolve(results);
                    }
                });
            });
    }

    Storage.prototype.get = function (email, store) {
        return this.open()
            .then(function (db) {
                return new Promise(function (resolve, reject) {
                    var transaction = db.transaction([store], 'readwrite');
                    var objectStore = transaction.objectStore(store);
                    var index = objectStore.index('email');
                    var request = index.get(email);

                    request.onsuccess = function (event) {
                        return resolve(event.target.result);
                    };

                    request.onerror = function (event) {
                        resolve(event.target.result);
                    }
                });
            });
    }
    Storage.prototype.write = function (store, data) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var db = _this.db;
            var transaction = db.transaction([store], 'readwrite');
            var objectStore = transaction.objectStore(store);
            var timestamp = Date.now();
            return resolve(objectStore.add(Object.assign(data, timestamp)));
        });
    }
    Storage.prototype.update = function (store, data) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var db = _this.db;
            var transaction = db.transaction([store], 'readwrite');
            var objectStore = transaction.objectStore(store);
            var timestamp = Date.now();
            return resolve(objectStore.put(Object.assign(data, timestamp)));
        });
    }

    return Storage;
}));
