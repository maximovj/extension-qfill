class IndexedDBManager {

    constructor() {
        this.DB_NAME = "QFill-IndexedDB";
        this.DB_VERSION = 1;

        this.STORES = {
            ELEMENTOS: "elementos",
            ELEMENTOS_ESCANEOS: "elementos_escaneos",
            ELEMENTO_SELECCIONADO: "elemento_seleccionado",
            ELEMENTOS_SELECCIONADOS: "elementos_seleccionados",
            PERFILES: "perfiles",
            CONFIGURACION: "configuracion"
        };

        this.ID = {
            ELEMENTOS_ID : 200,
            ELEMENTO_SELECCIONADO_ID : 200,
            CONFIGURACION_ID : 200,
        }

        this.db = null;
    }

    /* ===============================
       DATOS POR DEFECTO
    =============================== */  
    async initDatabase() {
        this.db = await this.init();

        await this.ensureDefault(
            this.STORES.CONFIGURACION,
            this.ID.CONFIGURACION_ID,
            {
                id: this.ID.CONFIGURACION_ID,
                modo: "visibles",
                elementos: [],
                selectorAnidado: true,
                selectorActivado: false,
                elementoSeleccionado: {},
                creadoEn: Date.now(),
                actualizadoEn: Date.now(),
            }
        );

        await this.ensureDefault(
            this.STORES.ELEMENTOS,
            this.ID.ELEMENTOS_ID,
            {
                id: this.ID.ELEMENTOS_ID,
                modo: "visibles",
                elementos: [],
                creadoEn: Date.now(),
                actualizadoEn: Date.now(),
            }
        );

        await this.ensureDefault(
            this.STORES.ELEMENTO_SELECCIONADO,
            this.ID.ELEMENTO_SELECCIONADO_ID,
            {
                id: this.ID.ELEMENTO_SELECCIONADO_ID,
                selectorAnidado: false,
                selectorActivado: false,
                elementoSeleccionado: {},
                creadoEn: Date.now(),
                actualizadoEn: Date.now(),
            }
        );

    }

    /* ===============================
       INICIALIZAR DB
    =============================== */
    async init() {
        if (this.db) return this.db;

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                const createStore = (name, options, indexes = []) => {
                    if (!db.objectStoreNames.contains(name)) {
                        const store = db.createObjectStore(name, options);
                        indexes.forEach(idx => {
                            store.createIndex(idx.name, idx.key, { unique: idx.unique || false });
                        });
                    }
                };

                createStore(this.STORES.ELEMENTOS, { keyPath: "id", autoIncrement: false}, [
                    { name: "id", key: "id", unique: true },
                    { name: "elementos", key: "elementos" },
                    { name: "modo", key: "modo" },
                    { name: "creadoEn", key: "creadoEn" },
                    { name: "actualizadoEn", key: "actualizadoEn" }
                ]);
                
                createStore(this.STORES.ELEMENTOS_ESCANEOS, { keyPath: "id", autoIncrement: true }, [
                    { name: "id", key: "id", unique: true },
                    { name: "elementos", key: "elementos" },
                    { name: "modo", key: "modo" },
                    { name: "timestamp", key: "timestamp" }
                ]);

                createStore(this.STORES.ELEMENTO_SELECCIONADO, { keyPath: "id", autoIncrement: false }, [
                    { name: "id", key: "id", unique: true },
                    { name: "elemento", key: "elemento" },
                    { name: "modo", key: "modo" },
                    { name: "creadoEn", key: "creadoEn" },
                    { name: "actualizadoEn", key: "actualizadoEn" }
                ]);

                createStore(this.STORES.PERFILES, { keyPath: "id", autoIncrement: true }, [
                    { name: "id", key: "id", unique: true },
                    { name: "titulo", key: "titulo" },
                    { name: "detalle", key: "detalle" },
                    { name: "elementos", key: "elementos" },
                    { name: "modo", key: "modo" },
                    { name: "timestamp", key: "timestamp" }
                ]);
                
                createStore(this.STORES.CONFIGURACION, { keyPath: "id", autoIncrement: false }, [
                    { name: "id", key: "id", unique: true },
                    { name: "modo", key: "modo" },
                    { name: "elementos", key: "elementos" },
                    { name: "selectorActivado", key: "selectorActivado" },
                    { name: "elementoSeleccionado", key: "elementoSeleccionado" }, // ✅ corregido
                    { name: "creadoEn", key: "creadoEn" },
                    { name: "actualizadoEn", key: "actualizadoEn" }
                ]);

            };

            request.onsuccess = () => {
                this.db = request.result;

                // ⚠️ Listener de "versionchange" para cerrar DB correctamente
                //this.db.onversionchange = () => this.db.close();

                resolve(this.db);
            };

            request.onerror = () => reject(request.error);
        });
    }

    /* ===============================
       UTILIDAD TRANSACCIÓN
    =============================== */
    async _transaction(storeName, mode = "readonly") {
        const db = await this.init();
        return db.transaction(storeName, mode).objectStore(storeName);
    }

    /* ===============================
       CRUD GENÉRICO
    =============================== */

    async add(storeName, data) {
        const store = await this._transaction(storeName, "readwrite");
        return this._request(store.add(data));
    }

    async put(storeName, data) {
        const store = await this._transaction(storeName, "readwrite");
        return this._request(store.put(data));
    }

    async get(storeName, id) {
        const store = await this._transaction(storeName);
        return this._request(store.get(id));
    }

    async getAll(storeName) {
        const store = await this._transaction(storeName);
        return this._request(store.getAll());
    }

    async delete(storeName, id) {
        const store = await this._transaction(storeName, "readwrite");
        return this._request(store.delete(id));
    }

    async clear(storeName) {
        const store = await this._transaction(storeName, "readwrite");
        return this._request(store.clear());
    }

    async count(storeName) {
        const store = await this._transaction(storeName);

        return new Promise((resolve, reject) => {
            const request = store.count();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async ensureDefault(store, id, data) {
        const exists = await this.get(store, id);
        if (!exists) {
            await this.add(store, data);
        }
    }

    async existsById(storeName, id) {
        const store = await this._transaction(storeName);
        return new Promise((resolve, reject) => {
            const request = store.count(id);

            request.onsuccess = () => {
                resolve(request.result > 0);
            };

            request.onerror = () => reject(request.error);
        });
    }

    async indexExists(storeName, indexName) {
        const db = await this.init();
        const tx = db.transaction(storeName, "readonly");
        const store = tx.objectStore(storeName);

        return store.indexNames.contains(indexName);
    }

    async getByIndex(storeName, indexName, value) {
        const store = await this._transaction(storeName);
        const index = store.index(indexName);
        return this._request(index.getAll(value));
    }

    async deleteDatabase() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.deleteDatabase(this.DB_NAME);
            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }

    async reset() {
        await this.initDatabase();
        
        await this.put(this.STORES.CONFIGURACION, {
            id: this.ID.CONFIGURACION_ID,
            modo: "visibles",
            elementos: [],
            selectorAnidado: true,
            selectorActivado: false,
            elementoSeleccionado: {},
            creadoEn: Date.now(),
            actualizadoEn: Date.now(),
        });
        await this.put(this.STORES.ELEMENTOS, {
            id: this.ID.ELEMENTOS_ID,
            modo: "visibles",
            elementos: [],
            creadoEn: Date.now(),
            actualizadoEn: Date.now(),
        });
        await this.put(this.STORES.ELEMENTO_SELECCIONADO, {
            id: this.ID.ELEMENTO_SELECCIONADO_ID,
            selectorAnidado: false,
            selectorActivado: false,
            elementoSeleccionado: {},
            creadoEn: Date.now(),
            actualizadoEn: Date.now(),
        });
    }

    async queryByIndex(storeName, indexName, operator, value) {
        const store = await this._transaction(storeName);
        const index = store.index(indexName);

        return new Promise((resolve, reject) => {
            let results = [];
            let range = null;

            // ===== OPERADORES SOPORTADOS CON KEYRANGE =====
            switch (operator) {
                case "=":
                    range = IDBKeyRange.only(value);
                    break;
                case ">":
                    range = IDBKeyRange.lowerBound(value, true);
                    break;
                case ">=":
                    range = IDBKeyRange.lowerBound(value);
                    break;
                case "<":
                    range = IDBKeyRange.upperBound(value, true);
                    break;
                case "<=":
                    range = IDBKeyRange.upperBound(value);
                    break;
            }

            // ===== OPERADORES QUE REQUIEREN CURSOR MANUAL =====
            if (operator === "!=" || operator === "LIKE") {

                const request = index.openCursor();

                request.onsuccess = (event) => {
                    const cursor = event.target.result;
                    if (!cursor) {
                        resolve(results);
                        return;
                    }

                    const record = cursor.value;
                    const fieldValue = record[indexName];

                    if (operator === "!=" && fieldValue !== value) {
                        results.push(record);
                    }

                    if (operator === "LIKE" &&
                        typeof fieldValue === "string" &&
                        fieldValue.toLowerCase().includes(value.toLowerCase())
                    ) {
                        results.push(record);
                    }

                    cursor.continue();
                };

                request.onerror = () => reject(request.error);
                return;
            }

            // ===== KEYRANGE SIMPLE =====
            const request = index.getAll(range);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async countByOperator(storeName, indexName, operator, value) {
        const store = await this._transaction(storeName);
        const index = store.index(indexName);

        return new Promise((resolve, reject) => {

            // ===== OPERADORES SOPORTADOS POR KEYRANGE =====
            let range = null;

            switch (operator) {
                case "=":
                    range = IDBKeyRange.only(value);
                    break;
                case ">":
                    range = IDBKeyRange.lowerBound(value, true);
                    break;
                case ">=":
                    range = IDBKeyRange.lowerBound(value);
                    break;
                case "<":
                    range = IDBKeyRange.upperBound(value, true);
                    break;
                case "<=":
                    range = IDBKeyRange.upperBound(value);
                    break;
            }

            // Si es operador simple
            if (range) {
                const request = index.count(range);
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
                return;
            }

            // ===== Operadores avanzados (requieren cursor) =====
            let counter = 0;
            const request = index.openCursor();

            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (!cursor) {
                    resolve(counter);
                    return;
                }

                const record = cursor.value;
                const fieldValue = record[indexName];

                if (operator === "!=" && fieldValue !== value) {
                    counter++;
                }

                if (
                    operator === "LIKE" &&
                    typeof fieldValue === "string" &&
                    fieldValue.toLowerCase().includes(value.toLowerCase())
                ) {
                    counter++;
                }

                cursor.continue();
            };

            request.onerror = () => reject(request.error);
        });
    }

    async getAllData() {
        const db = await this.init();

        const storeNames = Array.from(db.objectStoreNames);
        const result = {};

        return new Promise((resolve, reject) => {
            const tx = db.transaction(storeNames, "readonly");

            storeNames.forEach(storeName => {
                const store = tx.objectStore(storeName);
                const request = store.getAll();

                request.onsuccess = () => {
                    result[storeName] = request.result;
                };

                request.onerror = () => {
                    reject(request.error);
                };
            });

            tx.oncomplete = () => {
                resolve(result);
            };

            tx.onerror = () => {
                reject(tx.error);
            };
        });
    }

    _request(request) {
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
}

export default new IndexedDBManager();