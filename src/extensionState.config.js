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
}

export default new ExtensionState();