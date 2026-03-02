<template>
    <div class="space-y-5 text-xs perspective-normal">
        <!-- ===================== -->
        <!-- 🟦 TITULO / ENCABEZADO -->
        <!-- ===================== -->
        <div class="flex flex-col">
            <div class="flex justify-between items-center">
                <div class="flex items-center">
                <h1 class="text-sm font-semibold">{{ extConfig.header_title }}</h1>
                </div>
                <span>{{ extConfig.header_version  }}</span>
            </div>
            <div>
                <p>{{ extConfig.header_description }}</p>
            </div>
        </div>

        <div class="flex flex-col">
            <div class="flex gap-3 items-center">
                <button
                    @click="mostrarPanelConfiguracion"
                    :class="[panel == 'configuracion' ? 'text-menu-item-active' : 'text-menu-item']"
                    :active="true"
                >
                    Ver escaneo
                </button>
                <div class="w-1 h-1 bg-gray-400 border-gray-400 border-r-2 rounded-full"></div>
                <button
                    @click="mostrarPanelPerfiles"
                    :class="[panel == 'perfiles' ? 'text-menu-item-active' : 'text-menu-item']"
                >
                    Ver perfiles
                </button>
                <div class="w-1 h-1 bg-gray-400 border-gray-400 border-r-2 rounded-full"></div>
                <button
                    @click="mostrarPanelHistorial"
                    :class="[panel == 'historial' ? 'text-menu-item-active' : 'text-menu-item']"
                >
                    Historial de escaneos
                </button>
            </div>
            <span class="text-gray-500 text-right inline-block border-b-2 w-full">MÉNU</span>
        </div>

        <PanelPerfiles v-if="panel === 'perfiles'" />
        <PanelConfiguracion v-if="panel === 'configuracion'" @perfil-nuevo-creado="mostrarPanelPerfiles" />
        <PanelHistorial v-if="panel === 'historial'" />
    </div>
</template>

<script>
import extConfig from '@/extension.config.js'
import PanelConfiguracion from '../components/PanelConfiguracion.vue';
import PanelPerfiles from '../components/PanelPerfiles.vue';
import PanelHistorial from '../components/PanelHistorial.vue';

export default {
    components: {
        PanelConfiguracion,
        PanelPerfiles,
        PanelHistorial,
    },
    data() {
        return {
            panel: 'configuracion', // configuracion | perfiles | historial
            extConfig
        }
    },
    methods: {
        mostrarPanelConfiguracion(){ 
            this.panel = "configuracion";
        },
        mostrarPanelPerfiles(){ 
            this.panel = "perfiles";
        },
        mostrarPanelHistorial(){ 
            this.panel = "historial";
        },
    }
}
</script>