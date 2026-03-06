// IndexedDBManager.js
// Versión: v2.0

class IndexedDBManager {

    /* =========================================================
       🧠 SINGLETON
    ========================================================= */
    static instance;

    static getInstance() {
        if (!IndexedDBManager.instance) {
            IndexedDBManager.instance = new IndexedDBManager();
        }
        return IndexedDBManager.instance;
    }

    constructor() {
        if (IndexedDBManager.instance) {
            return IndexedDBManager.instance;
        }

        this.DB_NAME = "QFill-IndexedDB";
        this.DB_VERSION = 1;

        /* =========================================================
           🗂 STORE CONFIGURATION (GENÉRICO)
        ========================================================= */
        this.STORES = {
            configuracion: {
                name: "configuracion",
                keyPath: "id",
                autoIncrement: false,
                type: "single"
            },
            perfiles: {
                name: "perfiles",
                keyPath: "id",
                autoIncrement: true,
                type: "collection"
            },
            elementos_escaneos: {
                name: "elementos_escaneos",
                keyPath: "id",
                autoIncrement: true,
                type: "collection"
            }
        };

        this.db = null;
        this.state = {};
        this.listeners = new Set();
        this.meta = {};

        IndexedDBManager.instance = this;
    }

    /* =========================================================
       🏗 INIT DB
    ========================================================= */
    async init() {
        if (this.db) return this.db;

        return new Promise((resolve, reject) => {

            const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                Object.values(this.STORES).forEach(store => {
                    if (!db.objectStoreNames.contains(store.name)) {
                        db.createObjectStore(store.name, {
                            keyPath: store.keyPath,
                            autoIncrement: store.autoIncrement
                        });
                    }
                });
            };

            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };

            request.onerror = () => reject(request.error);
        });
    }

    /* =========================================================
       📦 INIT DATABASE (Carga en memoria)
    ========================================================= */
    async initDatabase() {
        const db = await this.init();
        const storeNames = Object.values(this.STORES).map(s => s.name);
        const tx = db.transaction(storeNames, "readonly");
        this.meta = {};

        for (const store of Object.values(this.STORES)) {
            const request = tx.objectStore(store.name).getAll();
            const result = await new Promise(resolve => {
                request.onsuccess = () => resolve(request.result ?? []);
            });

            if (store.type === "single") {
                this.state[store.name] = result[0] ?? this.defaultStore(store.name);
            } else {
                this.state[store.name] = result;
            }

            /* ===============================
            🧠 META INFO (lastId)
            =============================== */
            if (store.type === "collection") {
                const key = store.keyPath;
                let lastId = 0;
                for (const item of result) {
                    if (item[key] > lastId) {
                        lastId = item[key];
                    }
                }
                this.meta[store.name] = {
                    lastId
                };
            }
        }
    }

    /* =========================================================
       🧠 DEFAULTS
    ========================================================= */
    defaultStore(name) {
        if (name === "configuracion") {
            return {
                id: 200,
                modo: "visibles",
                elementos: [],
                selectorAccion: "agregar",
                selectorActivado: false,
                elementoSeleccionado: {},
                creado: Date.now(),
                actualizado: Date.now()
            };
        }
        return {};
    }

    /* =========================================================
       📖 GET
    ========================================================= */
    get(path) {
        if (!path) return this.state;

        return path.split(".")
            .reduce((obj, key) => obj?.[key], this.state);
    }

    /* =========================================================
       🔔 SUBSCRIBE
    ========================================================= */
    subscribe(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    notify(path, value) {
        this.listeners.forEach(listener => {
            listener(this.state, path, value);
        });
    }

    /* =========================================================
       ➕ CREATE (Colecciones autoIncrement)
    ========================================================= */
    async create(storeName, data) {
        const storeConfig = this.STORES[storeName];
        if (!storeConfig || storeConfig.type !== "collection") {
            throw new Error(`Store ${storeName} no es colección`);
        }

        const db = await this.init();
        const tx = db.transaction(storeConfig.name, "readwrite");
        const store = tx.objectStore(storeConfig.name);

        const request = store.add(data);

        return new Promise((resolve, reject) => {
            request.onsuccess = (event) => {
                const id = event.target.result;
                const newItem = { ...data, [storeConfig.keyPath]: id };

                this.state[storeName].push(newItem);
                this.notify(storeName, newItem);

                resolve(newItem);
            };

            request.onerror = () => reject(request.error);
        });
    }

    /* =========================================================
       ✏️ UPDATE
    ========================================================= */
    async update(storeName, id, changes) {
        const storeConfig = this.STORES[storeName];
        const db = await this.init();
        const tx = db.transaction(storeConfig.name, "readwrite");
        const store = tx.objectStore(storeConfig.name);

        const existing = this.state[storeName]
            .find(item => item[storeConfig.keyPath] === id);

        if (!existing) return null;

        const updated = { ...existing, ...changes };

        store.put(updated);

        const index = this.state[storeName]
            .findIndex(item => item[storeConfig.keyPath] === id);

        this.state[storeName][index] = updated;

        this.notify(storeName, updated);

        return updated;
    }

    /* =========================================================
       ❌ DELETE
    ========================================================= */
    async delete(storeName, id) {
        const storeConfig = this.STORES[storeName];
        const db = await this.init();
        const tx = db.transaction(storeConfig.name, "readwrite");
        const store = tx.objectStore(storeConfig.name);

        store.delete(id);

        this.state[storeName] = this.state[storeName]
            .filter(item => item[storeConfig.keyPath] !== id);

        this.notify(storeName, null);
    }

    /* =========================================================
       💾 SAVE SINGLE (Documento único)
    ========================================================= */
    async saveSingle(storeName, data) {
        const storeConfig = this.STORES[storeName];
        if (!storeConfig || storeConfig.type !== "single") {
            throw new Error(`Store ${storeName} no es tipo single`);
        }

        const db = await this.init();
        const tx = db.transaction(storeConfig.name, "readwrite");
        const store = tx.objectStore(storeConfig.name);

        const payload = {
            id: data.id ?? 200,
            ...data,
            actualizado: Date.now()
        };

        store.put(payload);

        this.state[storeName] = payload;

        this.notify(storeName, payload);

        return payload;
    }

    /* =========================================================
       📚 GET ALL
    ========================================================= */
    async getAll(storeName) {
        const storeConfig = this.STORES[storeName];
        const db = await this.init();

        return new Promise((resolve, reject) => {
            const tx = db.transaction(storeConfig.name, "readonly");
            const store = tx.objectStore(storeConfig.name);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /* =========================================================
       🗑 DELETE DATABASE
    ========================================================= */
    async deleteDatabase() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.deleteDatabase(this.DB_NAME);
            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }

    // uso: const perfil = await DB.getById("perfiles", 1);
    async getById(storeName, id) {
        const storeConfig = this.STORES[storeName];
        const key = storeConfig.keyPath;

        return this.state[storeName]
            .find(item => item[key] === id) ?? null;
    }

    // uso: await DB.clear("perfiles");
    async clear(storeName) {
        const storeConfig = this.STORES[storeName];
        const db = await this.init();

        const tx = db.transaction(storeConfig.name, "readwrite");
        const store = tx.objectStore(storeConfig.name);

        store.clear();

        this.state[storeName] = [];

        this.notify(storeName, []);
    }

    // uso:
    /*
    DB.watch("configuracion.modo", (value) => {
            console.log("modo cambio:", value);
    });
    */
    watch(path, callback) {
        const listener = (state, changedPath, value) => {

            if (changedPath.startsWith(path)) {
                callback(value, state);
            }

        };

        this.listeners.add(listener);

        return () => this.listeners.delete(listener);
    }

    // uso: await DB.set("configuracion.modo", "ocultos");
    async set(path, value) {
        const keys = path.split(".");
        const storeName = keys.shift();

        let target = this.state[storeName];

        while (keys.length > 1) {
            target = target[keys.shift()];
        }

        const lastKey = keys[0];

        target[lastKey] = value;

        if (this.STORES[storeName].type === "single") {
            await this.saveSingle(storeName, this.state[storeName]);
        }

        this.notify(path, value);
    }

    // uso:
    /*
    await DB.push("perfiles", {
        nombre: "admin"
    });
    */
    async push(storeName, data) {
        return this.create(storeName, data);
    }
    
    // uso: await DB.remove("perfiles", 5);
    async remove(storeName, id) {
        return this.delete(storeName, id);
    }

    // uso: await DB.updateByPath("configuracion.selectorActivado", true);
    async updateByPath(path, value) {
        const keys = path.split(".");
        const storeName = keys.shift();

        let obj = this.state[storeName];

        while (keys.length > 1) {
            obj = obj[keys.shift()];
        }

        obj[keys[0]] = value;

        await this.saveSingle(storeName, this.state[storeName]);

        this.notify(path, value);
    }

    // uso: const total = await DB.count("perfiles");
    async count(storeName) {
        const storeConfig = this.STORES[storeName];
        const db = await this.init();

        return new Promise((resolve, reject) => {

            const tx = db.transaction(storeConfig.name, "readonly");
            const store = tx.objectStore(storeConfig.name);

            const request = store.count();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);

        });
    }

    // uso: const lastId = await DB.getLastId("perfiles");
    async getLastId(storeName) {
        const storeConfig = this.STORES[storeName];
        const data = await this.getAll(storeConfig?.name);

        if (!Array.isArray(data) || data.length === 0) {
            return null;
        }

        const key = storeConfig.keyPath;

        return Math.max(...data.map(item => item[key]));
    }

    // uso: const ids = await DB.getIdInfo("perfiles");
    async getIdInfo(storeName) {
        const storeConfig = this.STORES[storeName];
        const data = await this.getAll(storeConfig?.name);
        console.log(" async getIdInfo(storeName) ", data);

        if (!Array.isArray(data) || data.length === 0) {
            return {
                beforeId: null,
                currentId: null,
                nextId: 1
            };
        }

        const key = storeConfig.keyPath;

        // ordenar ids
        const ids = data.map(item => item[key]).sort((a, b) => a - b);

        const currentId = ids[ids.length - 1];
        const beforeId = ids.length > 1 ? ids[ids.length - 2] : null;
        const nextId = currentId + 1;

        return {
            beforeId,
            currentId,
            nextId
        };
    }

}

export default IndexedDBManager.getInstance();