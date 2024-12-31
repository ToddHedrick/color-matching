const Storage = {
    _db: null,
    _dbName: "db_colorSwatches",
    _tables: [
        "metadata",
        "color_swatches",
        "sources"
    ],

    init: async function () {
        this._db = await new Promise((resolve, reject) => {
            const request = indexedDB.open(this._dbName, 1);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                for (let table of this._tables) {
                    if (!db.objectStoreNames.contains(table)) {
                        db.createObjectStore(table, {keyPath: "id"});
                    }
                }
                console.debug("database setup complete");
            };

            request.onsuccess = function (event) {
                console.debug("database opened successfully")
                resolve(event.target.result);
            };

            request.onerror = function (event) {
                console.error("database failed to open", event.target.error)
                reject(event.target.error);
            };
        });
    },

    tableCount: function (tableName) {
        return new Promise(async (resolve, reject) => {
            const transaction = this._db.transaction(tableName, "readonly");
            const store = transaction.objectStore(tableName);

            const request = store.count();

            request.onsuccess = function () {
                resolve(request.result);
            };

            request.onerror = function (event) {
                console.error("Error adding record", event.target.error)
                reject(event.target.error);
            };
        });
    },

    putRecords: function (tableName, dataArr) {
        return new Promise(async (resolve, reject) => {
            if (!Array.isArray(dataArr)) {
                reject("dataArr must be of type Array");
            }

            for (let data of dataArr) {
                await this.putRecord(tableName, data);
            }

            resolve();
        });
    },

    putRecord: function (tableName, data) {
        return new Promise((resolve, reject) => {
            const transaction = this._db.transaction(tableName, "readwrite");
            const store = transaction.objectStore(tableName);

            const request = store.put(data);

            request.onsuccess = function () {
                resolve();
            };

            request.onerror = function (event) {
                console.error("Error adding record", event.target.error)
                reject(event.target.error);
            };
        });
    },

    retrieveRecord: function (tableName, id) {
        return new Promise((resolve, reject) => {
            const transaction = this._db.transaction(tableName, "readonly");
            const store = transaction.objectStore(tableName);

            const request = store.get(id);

            request.onsuccess = function () {
                resolve(request.result);
            };

            request.onerror = function (event) {
                console.error("Error retrieving record", event.target.error)
                reject(event.target.error);
            };
        });
    },

    retrieveAllRecords: async function* (tableName) {
        // return new Promise((resolve, reject) => {
        //     debugger
        //     try {
        //         const transaction = this._db.transaction(tableName, "readonly");
        //         const store = transaction.objectStore(tableName);
        //
        //         const request = store.getAll();
        //
        //         request.onsuccess = function () {
        //             resolve(request.result);
        //         };
        //
        //         request.onerror = function (event) {
        //             console.error("Error retrieving all records", event.target.error)
        //             reject(event.target.error);
        //         };
        //     } catch(error){
        //         reject(error)
        //     }
        // });

        // Open a transaction and access the object store
        const transaction = this._db.transaction(tableName, "readonly");
        const store = transaction.objectStore(tableName);

        // Open a cursor on the store
        const cursorRequest = store.openCursor();

        // Process items using a cursor
        let cursor = await new Promise((resolve, reject) => {
            cursorRequest.onsuccess = (event) => {
                resolve(event.target.result)
            };
            cursorRequest.onerror = () => {
                reject(cursorRequest.error)
            };
        });

        // Iterate using a generator
        while (cursor) {
            yield cursor.value; // Yield current item
            cursor = await new Promise((resolve, reject) => {
                cursor.continue(); // Move to the next item
                cursorRequest.onsuccess = (event) => resolve(event.target.result);
                cursorRequest.onerror = () => reject(cursorRequest.error);
            });
        }
    },

    deleteRecord: function (tableName, id) {
        return new Promise((resolve, reject) => {
            const transaction = this._db.transaction(tableName, "readwrite");
            const store = transaction.objectStore(tableName);

            const request = store.delete(id);

            request.onsuccess = function () {
                console.debug(`Record with id ${id} has been deleted`)
                resolve(request.result);
            };

            request.onerror = function (event) {
                console.error("Error retrieving all records", event.target.error)
                reject(event.target.error);
            };
        });
    },
};

await Storage.init();
export default Storage;