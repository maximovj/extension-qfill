class ExtensionState {
    constructor() {
        // Estado en memoria para acceso rápido
        this.state = {
            modoSelector: {
                activo: false,
                status: 'error',
                mensaje: 'Modo Selector Desactivado',
                itemSeleccionado: null
            },
            ultimoEscaneo: {
                escaneado: false,
                timestamp: null,
                inputs: [],
                modo: 'visibles'
            },
            configuracion: {
                modoEscaneoPorDefecto: 'visibles',
                autoGuardar: true,
                usarIndexedDB: false // Flag para decidir dónde guardar
            },
            temp: {}
        };
        
        this.listeners = new Map();
        this.db = null; // Conexión a IndexedDB
        this.DB_NAME = 'ExtensionDatabase';
        this.DB_VERSION = 1;
        this.STORES = {
            ESCANEOS: 'escaneos',     // Para historial de escaneos
            ITEMS_SELECCIONADOS: 'itemsSeleccionados', // Para items guardados
            CONFIGURACION: 'configuracion' // Podrías migrar config aquí
        };
        
        this.init();
    }

    // Inicialización completa
    async init() {
        try {
            // 1. Inicializar IndexedDB
            await this.initDB();
            
            // 2. Cargar configuración desde chrome.storage (más simple para config)
            const saved = await chrome.storage.local.get('extensionState');
            if (saved.extensionState) {
                this.state = {
                    ...this.state,
                    ...saved.extensionState
                };
            }
            
            // 3. Si está configurado para usar IndexedDB, cargar datos adicionales
            if (this.state.configuracion.usarIndexedDB) {
                await this.cargarDatosDesdeIndexedDB();
            }
            
            console.log('ExtensionState inicializado correctamente');
        } catch (error) {
            console.error('Error en inicialización:', error);
        }
    }

    // Inicializar IndexedDB
    initDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Crear almacenes si no existen
                if (!db.objectStoreNames.contains(this.STORES.ESCANEOS)) {
                    const storeEscaneos = db.createObjectStore(this.STORES.ESCANEOS, { 
                        keyPath: 'id', 
                        autoIncrement: true 
                    });
                    storeEscaneos.createIndex('timestamp', 'timestamp', { unique: false });
                    storeEscaneos.createIndex('modo', 'modo', { unique: false });
                }
                
                if (!db.objectStoreNames.contains(this.STORES.ITEMS_SELECCIONADOS)) {
                    const storeItems = db.createObjectStore(this.STORES.ITEMS_SELECCIONADOS, { 
                        keyPath: 'id', 
                        autoIncrement: true 
                    });
                    storeItems.createIndex('fechaGuardado', 'fechaGuardado', { unique: false });
                }
                
                if (!db.objectStoreNames.contains(this.STORES.CONFIGURACION)) {
                    db.createObjectStore(this.STORES.CONFIGURACION, { 
                        keyPath: 'clave' 
                    });
                }
                
                console.log('Estructura de IndexedDB creada/actualizada');
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                console.log('IndexedDB conectada');
                resolve(this.db);
            };

            request.onerror = (event) => {
                console.error('Error abriendo IndexedDB:', event.target.error);
                reject(event.target.error);
            };
        });
    }

    // Guardar un escaneo completo en IndexedDB
    async guardarEscaneo(datosEscaneo) {
        if (!this.db) await this.initDB();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.STORES.ESCANEOS], 'readwrite');
            const store = transaction.objectStore(this.STORES.ESCANEOS);
            
            const escaneoParaGuardar = {
                ...datosEscaneo,
                timestamp: new Date().toISOString(),
                version: '1.0'
            };
            
            const request = store.add(escaneoParaGuardar);

            request.onsuccess = () => {
                console.log('Escaneo guardado en IndexedDB');
                resolve(request.result);
                
                // Actualizar también el último escaneo en el estado rápido
                this.state.ultimoEscaneo = {
                    escaneado: true,
                    timestamp: escaneoParaGuardar.timestamp,
                    inputs: datosEscaneo.inputs || [],
                    modo: datosEscaneo.modo || 'visibles'
                };
                
                // Persistir solo el estado rápido en chrome.storage
                this.persist();
            };

            request.onerror = () => reject(request.error);
        });
    }

    // Obtener historial de escaneos desde IndexedDB
    async obtenerHistorialEscaneos(limite = 50) {
        if (!this.db) await this.initDB();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.STORES.ESCANEOS], 'readonly');
            const store = transaction.objectStore(this.STORES.ESCANEOS);
            const index = store.index('timestamp');
            
            const escaneos = [];
            const request = index.openCursor(null, 'prev'); // Orden descendente
            
            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor && escaneos.length < limite) {
                    escaneos.push(cursor.value);
                    cursor.continue();
                } else {
                    resolve(escaneos);
                }
            };
            
            request.onerror = () => reject(request.error);
        });
    }

    // Guardar item seleccionado en IndexedDB
    async guardarItemSeleccionado(item) {
        if (!this.db) await this.initDB();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.STORES.ITEMS_SELECCIONADOS], 'readwrite');
            const store = transaction.objectStore(this.STORES.ITEMS_SELECCIONADOS);
            
            const itemParaGuardar = {
                ...item,
                fechaGuardado: new Date().toISOString()
            };
            
            const request = store.add(itemParaGuardar);

            request.onsuccess = () => {
                console.log('Item guardado en IndexedDB');
                resolve(request.result);
                
                // Actualizar item actual en estado rápido
                this.state.modoSelector.itemSeleccionado = item;
                this.persist();
            };

            request.onerror = () => reject(request.error);
        });
    }

    // Obtener items guardados
    async obtenerItemsGuardados() {
        if (!this.db) await this.initDB();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.STORES.ITEMS_SELECCIONADOS], 'readonly');
            const store = transaction.objectStore(this.STORES.ITEMS_SELECCIONADOS);
            const request = store.getAll();
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // Eliminar item específico
    async eliminarItem(id) {
        if (!this.db) await this.initDB();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.STORES.ITEMS_SELECCIONADOS], 'readwrite');
            const store = transaction.objectStore(this.STORES.ITEMS_SELECCIONADOS);
            const request = store.delete(id);
            
            request.onsuccess = () => {
                console.log('Item eliminado');
                resolve();
            };
            
            request.onerror = () => reject(request.error);
        });
    }

    // RESET - Versión mejorada que limpia ambos almacenes
    async reset(seccion = 'all') {
        const defaultState = {
            modoSelector: {
                activo: false,
                status: 'error',
                mensaje: 'Modo Selector Desactivado',
                itemSeleccionado: null
            },
            ultimoEscaneo: {
                escaneado: false,
                timestamp: null,
                inputs: [],
                modo: 'visibles'
            },
            configuracion: {
                modoEscaneoPorDefecto: 'visibles',
                autoGuardar: true,
                usarIndexedDB: this.state.configuracion.usarIndexedDB
            },
            temp: {}
        };

        // Reset en memoria
        if (seccion === 'all') {
            this.state = JSON.parse(JSON.stringify(defaultState));
            
            // También limpiar IndexedDB si se está usando
            if (this.state.configuracion.usarIndexedDB && this.db) {
                await this.limpiarIndexedDB();
            }
        } else if (defaultState[seccion]) {
            this.state[seccion] = JSON.parse(JSON.stringify(defaultState[seccion]));
        }

        await this.persist();
        this.notify('reset', { seccion, state: this.state });
        
        return this.state;
    }

    // Limpiar toda IndexedDB
    async limpiarIndexedDB() {
        if (!this.db) return;
        
        const stores = Object.values(this.STORES);
        const transaction = this.db.transaction(stores, 'readwrite');
        
        stores.forEach(storeName => {
            const store = transaction.objectStore(storeName);
            store.clear();
        });
        
        return new Promise((resolve) => {
            transaction.oncomplete = () => {
                console.log('IndexedDB limpiada');
                resolve();
            };
        });
    }

    // Cargar datos desde IndexedDB al estado en memoria
    async cargarDatosDesdeIndexedDB() {
        try {
            // Por ejemplo, cargar el último escaneo
            const historial = await this.obtenerHistorialEscaneos(1);
            if (historial.length > 0) {
                const ultimo = historial[0];
                this.state.ultimoEscaneo = {
                    escaneado: true,
                    timestamp: ultimo.timestamp,
                    inputs: ultimo.inputs || [],
                    modo: ultimo.modo || 'visibles'
                };
            }
            
            // Cargar items si existen
            const items = await this.obtenerItemsGuardados();
            // Procesar items según necesites...
            
        } catch (error) {
            console.error('Error cargando datos desde IndexedDB:', error);
        }
    }

    // Nuevo método de utilidad para exportar/importar datos
    async exportarDatos() {
        const datos = {
            configuracion: this.state.configuracion,
            historial: await this.obtenerHistorialEscaneos(1000),
            items: await this.obtenerItemsGuardados(),
            fechaExportacion: new Date().toISOString()
        };
        
        return datos;
    }

    async importarDatos(datos) {
        if (!datos) return;
        
        try {
            if (datos.configuracion) {
                this.state.configuracion = datos.configuracion;
            }
            
            if (datos.historial && Array.isArray(datos.historial)) {
                for (const escaneo of datos.historial) {
                    await this.guardarEscaneo(escaneo);
                }
            }
            
            if (datos.items && Array.isArray(datos.items)) {
                for (const item of datos.items) {
                    await this.guardarItemSeleccionado(item);
                }
            }
            
            await this.persist();
            console.log('Datos importados correctamente');
            
        } catch (error) {
            console.error('Error importando datos:', error);
        }
    }

    // Método modificado para persistir según configuración
    async persist() {
        // Siempre guardar configuración en chrome.storage (rápido y simple)
        await chrome.storage.local.set({ extensionState: this.state });
        
        // Si está configurado, también guardar datos importantes en IndexedDB
        if (this.state.configuracion.usarIndexedDB && this.db) {
            // Por ejemplo, guardar automáticamente el estado completo
            // o datos específicos según tu lógica
        }
    }

    // Mantén todos tus métodos existentes (get, set, setMany, etc.)
    // pero puedes mejorarlos para que usen IndexedDB cuando sea apropiado

    // Método mejorado para guardar con opción de destino
    async set(key, value, opciones = { usarIndexedDB: false }) {
        const keys = key.split('.');
        const lastKey = keys.pop();
        const target = keys.reduce((obj, k) => {
            if (!obj[k]) obj[k] = {};
            return obj[k];
        }, this.state);
        
        const valorAnterior = target[lastKey];
        target[lastKey] = value;
        
        // Si es un escaneo completo y queremos en IndexedDB
        if (opciones.usarIndexedDB && key === 'ultimoEscaneo') {
            await this.guardarEscaneo(value);
        }
        
        if (this.state.configuracion.autoGuardar) {
            await this.persist();
        }
        
        this.notify(key, { valorAnterior, valorNuevo: value });
        
        return this.state;
    }
    
    // Obtener estado completo o parcial
    get(key) {
        if (!key) return this.state;
        return key.split('.').reduce((obj, k) => obj?.[k], this.state);
    }

    /*
    // Actualizar estado
    async set(key, value) {
        const keys = key.split('.');
        const lastKey = keys.pop();
        const target = keys.reduce((obj, k) => {
        if (!obj[k]) obj[k] = {};
        return obj[k];
        }, this.state);
        
        target[lastKey] = value;
        
        // Auto-guardar si está configurado
        if (this.state.configuracion.autoGuardar) {
        await this.persist();
        }
        
        // Notificar cambios
        this.notify(key, value);
        
        return this.state;
    }
    */

    // Actualizar múltiples valores
    async setMany(updates) {
        Object.entries(updates).forEach(([key, value]) => {
        const keys = key.split('.');
        const lastKey = keys.pop();
        const target = keys.reduce((obj, k) => {
            if (!obj[k]) obj[k] = {};
            return obj[k];
        }, this.state);
        target[lastKey] = value;
        });
        
        if (this.state.configuracion.autoGuardar) {
        await this.persist();
        }
        
        return this.state;
    }

    // Limpiar solo datos temporales
    async clearTemp() {
        this.state.temp = {};
        await this.persist();
        this.notify('tempCleared', {});
    }

    // Verificar si hay datos guardados
    hasData() {
        return (
            this.state.ultimoEscaneo.inputs?.length > 0 ||
            this.state.modoSelector.itemSeleccionado !== null
        );
    }

    // Sistema simple de eventos
    on(event, callback) {
        if (!this.listeners.has(event)) {
        this.listeners.set(event, new Set());
        }
        this.listeners.get(event).add(callback);
    }

    notify(event, data) {
        if (this.listeners.has(event)) {
        this.listeners.get(event).forEach(cb => cb(data));
        }
    }

    // Desarrollo y testing
    async debugEstado() {
        chrome.storage.local.get('extensionState', (result) => {
            console.log('📦 DATOS GUARDADOS EN STORAGE:');
            console.log(JSON.stringify(result, null, 2));
        });
        
        // También puedes ver el estado en memoria
        console.log('🔄 ESTADO EN MEMORIA:');
        console.log(JSON.stringify(this.state, null, 2));
    }
    
}

export default new ExtensionState();