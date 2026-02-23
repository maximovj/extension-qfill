class ExtensionState {
    constructor() {
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
            autoGuardar: true
        },
        temp: {} // Para datos temporales entre mensajes
        };
        
        this.listeners = new Map();
        this.init();
    }

    // Inicializar: cargar estado guardado
    async init() {
        const saved = await chrome.storage.local.get('extensionState');
        if (saved.extensionState) {
        this.state = {
            ...this.state,
            ...saved.extensionState
        };
        }
    }

    // Obtener estado completo o parcial
    get(key) {
        if (!key) return this.state;
        return key.split('.').reduce((obj, k) => obj?.[k], this.state);
    }

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

    // RESET GLOBAL - Vuelve a valores por defecto
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
                autoGuardar: true
            },
            temp: {}
        };

        if (seccion === 'all') {
            // Reset completo
            this.state = JSON.parse(JSON.stringify(defaultState)); // Clon profundo
        } else if (defaultState[seccion]) {
            // Reset solo una sección
            this.state[seccion] = JSON.parse(JSON.stringify(defaultState[seccion]));
        }

        await this.persist();
        this.notify('reset', { seccion, state: this.state });
        
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

    // Guardar en chrome.storage
    async persist() {
        await chrome.storage.local.set({ extensionState: this.state });
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