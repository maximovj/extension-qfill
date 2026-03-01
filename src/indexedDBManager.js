import { sendToActiveTab, dispatchToActiveTab } from './helpers.config'
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

        this.STORES = {
            CONFIGURACION: "configuracion",
            //ELEMENTOS: "elementos",
            //ELEMENTO_SELECCIONADO: "elemento_seleccionado",
            PERFILES: "perfiles",
            ELEMENTOS_ESCANEOS: "elementos_escaneos"
        };

        this.IDS = {
            configuracion: 200,
            //elementos: 200,
            //elemento_seleccionado: 200
        };

        this.db = null;

        /* 🧠 Estado en memoria */
        this.state = {};

        /* 🔔 Subscripciones */
        this.listeners = new Set();

        /* ⚡ Control de escritura optimizada */
        this.dirtyStores = new Set();
        this.persistTimer = null;

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

                const createStore = (name, options) => {
                    if (!db.objectStoreNames.contains(name)) {
                        db.createObjectStore(name, options);
                    }
                };

                createStore(this.STORES.CONFIGURACION, { keyPath: "id" });
                //createStore(this.STORES.ELEMENTOS, { keyPath: "id" });
                //createStore(this.STORES.ELEMENTO_SELECCIONADO, { keyPath: "id" });
                createStore(this.STORES.PERFILES, { keyPath: "id", autoIncrement: true });
                createStore(this.STORES.ELEMENTOS_ESCANEOS, { keyPath: "id", autoIncrement: true });
            };

            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };

            request.onerror = () => reject(request.error);
        });
    }

    /* =========================================================
       🧩 LOAD STATE NORMALIZADO
    ========================================================= */
    async initDatabase() {
        await this.init();

        const data = await this.getAllData();

        this.state = {
            configuracion: data.configuracion?.[0] ?? this.defaultConfiguracion(),
            //elementos: data.elementos?.[0] ?? this.defaultElementos(),
            //elemento_seleccionado: data.elemento_seleccionado?.[0] ?? this.defaultElementoSeleccionado(),
            perfiles: data.perfiles ?? [],
            elementos_escaneos: data.elementos_escaneos ?? []
        };

        await this.persistAll();
    }

    defaultConfiguracion() {
        return {
            id: this.IDS.configuracion,
            modo: "visibles",
            elementos: [],
            selectorAccion: "agregar",
            selectorActivado: false,
            elementoSeleccionado: {},
            creado: Date.now(),
            actualizado: Date.now()
        };
    }

    /*
    defaultElementos() {
        return {
            id: this.IDS.elementos,
            modo: "visibles",
            elementos: [],
            creadoEn: Date.now(),
            actualizadoEn: Date.now()
        };
    }
    */

    /* 
    defaultElementoSeleccionado() {
        return {
            id: this.IDS.elemento_seleccionado,
            selectorAnidado: false,
            selectorActivado: false,
            elementoSeleccionado: {},
            creadoEn: Date.now(),
            actualizadoEn: Date.now()
        };
    }
    */

    /* =========================================================
       📖 GET
    ========================================================= */
    get(path) {
        if (!path) return this.state;

        return path.split(".")
            .reduce((obj, key) => obj?.[key], this.state);
    }

    /* =========================================================
       ✏️ SET (Ultra optimizado)
    ========================================================= */
    async set(path, value) {

        const keys = path.split(".");
        const storeName = keys[0];
        const lastKey = keys.pop();

        const target = keys.reduce((obj, key) => {
            if (!obj[key]) obj[key] = {};
            return obj[key];
        }, this.state);

        target[lastKey] = value;

        this.markDirty(storeName);
        this.notify(path, value);

        this.schedulePersist();

        console.log("Enviando actualizacion a STATE_BRODCAST ");
        const broadcast = await dispatchToActiveTab("STATE_BRODCAST", "STATE_BRODCAST", { path, value });
        console.log("Respuesta de STATE_UPDATE + STATE_BRODCAST ", { broadcast });
        //await sendMessage("STATE_UPDATE", "STATE_UPDATE");

        return this.state;
    }

    async setMany(updates) {
        Object.entries(updates).forEach(([path, value]) => {
            const keys = path.split(".");
            const storeName = keys[0];
            const lastKey = keys.pop();

            const target = keys.reduce((obj, key) => {
                if (!obj[key]) obj[key] = {};
                return obj[key];
            }, this.state);

            target[lastKey] = value;
            this.markDirty(storeName);
        });

        this.schedulePersist();
        this.notify("*", updates);

        return this.state;
    }

    /* =========================================================
       💾 PERSISTENCIA OPTIMIZADA
    ========================================================= */
    markDirty(store) {
        this.dirtyStores.add(store);
    }

    schedulePersist(delay = 100) {
        if (this.persistTimer) return;

        this.persistTimer = setTimeout(async () => {
            await this.persistDirty();
            this.persistTimer = null;
        }, delay);
    }

    async persistDirty() {
        for (const store of this.dirtyStores) {
            await this.persistStore(store);
        }
        this.dirtyStores.clear();
    }

    async persistStore(store) {
        const db = await this.init();
        const tx = db.transaction(store, "readwrite");
        const objectStore = tx.objectStore(store);

        const data = this.state[store];

        if (Array.isArray(data)) {
            for (const item of data) {
                objectStore.put(item);
            }
        } else {
            objectStore.put({
                ...data,
                actualizadoEn: Date.now()
            });
        }

        return tx.complete;
    }

    async persistAll() {
        Object.keys(this.state).forEach(store => {
            this.markDirty(store);
        });

        await this.persistDirty();
    }

    /* =========================================================
       🔔 SUBSCRIPCIONES (tipo Zustand)
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

    watchBrodcast(callback, path= "", key = null) {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            (async () => {
                if(message.type === "STATE_UPDATE" && typeof callback === 'function') {
                    const payloadPath = message?.payload?.path || null;
                    const payloadValue = message?.payload?.value || null;
                    
                    if(typeof path === 'string' && Array.isArray(key) && typeof payloadValue === 'object') {
                        // Condiciones del key para ejecutar el callback
                        const buscar = path?.split(".");
                        const buscarStore = Object.values(this.STORES).some(value => value === buscar[0]);
                        const filtrarCoincidencias = Object.values(key).filter(propiedad => Object.hasOwn(payloadValue, propiedad));
                        const existeAlguna = key.some(item => filtrarCoincidencias.includes(item));
                        if(existeAlguna && buscarStore) {
                            await callback(message);
                        }
                    } else
                    if(typeof path === 'string' && typeof payloadPath === 'string') {
                        // Condiciones del path para ejecutar el callback
                        const buscar = path?.split(".");
                        const propiedades = payloadPath?.split(".");
                        const buscarStore = Object.values(this.STORES).some(value => value === buscar[0]);
                        const coincidencia = Object.values(buscar).some(value => propiedades.includes(value));
                        const igualAPath = buscar.every(item => propiedades.includes(item));
                        if((buscarStore) || (coincidencia && buscarStore) || igualAPath) {
                            await callback(message);
                        }
                    }
                }
                sendResponse("STATE_UPDATE DONE !!!");
            })();
            return true;
        });
    }

    /* =========================================================
       📦 UTILIDADES
    ========================================================= */
    async getAllData() {
        const db = await this.init();
        const storeNames = Array.from(db.objectStoreNames);
        const result = {};

        return new Promise((resolve, reject) => {

            const tx = db.transaction(storeNames, "readonly");

            storeNames.forEach(storeName => {
                const request = tx.objectStore(storeName).getAll();

                request.onsuccess = () => {
                    result[storeName] = request.result;
                };

                request.onerror = () => reject(request.error);
            });

            tx.oncomplete = () => resolve(result);
            tx.onerror = () => reject(tx.error);
        });
    }

    async deleteDatabase() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.deleteDatabase(this.DB_NAME);
            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }
}

export default IndexedDBManager.getInstance();