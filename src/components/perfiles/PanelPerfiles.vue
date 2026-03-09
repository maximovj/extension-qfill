<script setup>
import { ref, computed, onMounted, onUnmounted} from "vue";
import { MESSAGE_TYPES, ACTIONS } from "@/constants.config.js";
import { sendMessage } from "@/helpers.config.js";
import generarFakeValue from '../../sidepanel/utils/generarFakeValue';
import generarPerfilFake from '../../sidepanel/utils/generarPerfilFake';
import db from "../../indexedDBManager";
import AlertaConfirmar from "../common/AlertaConfirmar.vue";
import SeccionDesplegable from "../common/SeccionDesplegable.vue";
import SeccionLista from "./SeccionLista.vue";
import SeccionModoEdicion from "./SeccionModoEdicion.vue";

// ### !! Ref
let localState = ref(null);
let messageListener = null;

const modoEdicion = ref(false);
const modoEdicionElemento = ref({});

const perfiles = ref([]);
const editar = ref(null);

// ### !! FUNCIONES COMPUTADAS
const editarSeleccionados = computed(() =>
  editar.value?.elementos.filter((i) => i.selected),
);

const editarTotalElementos = computed(
  () => editar.value?.elementos?.length || 0,
);


// ### !! FUNCIONES
const slugify = (text) =>
  text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')        // espacios → guiones
    .replace(/[^\w\-]+/g, '')    // elimina caracteres especiales
    .replace(/\-\-+/g, '-');     // evita múltiples guiones

const editarElemento = (perfil) => {
  modoEdicionElemento.value = perfil;
  modoEdicion.value = true;
}

const volver = () => {
  modoEdicion.value = false;
  modoEdicionElemento.value = null;
};

// Cargar perfiles
const cargarPerfiles = async () => {
  localState.value = await chrome.runtime.sendMessage({
    type: "GET_STATE"
  });
  perfiles.value = localState.value?.perfiles;
}

// CHANGE: Eliminar este método de prueba
const test = async () => {
  
}

// ### !!  onMounted, onUnmounted
onMounted(async () => {
  await cargarPerfiles();
  messageListener = async (message) => {
    if (message.type === "STATE_UPDATED") {
      localState.value = message.state;
      await cargarPerfiles();
    }
  };

  chrome.runtime.onMessage.addListener(messageListener);
});

onUnmounted(() => {
  chrome.runtime.onMessage.removeListener(messageListener);
  localState.value = null;
});
</script>

<template>
  <div class="space-y-5 text-xs perspective-normal animate-slide-in">
    <SeccionLista 
      v-if="!modoEdicion"
      @editarElemento="editarElemento"
      ></SeccionLista>
    
    <SeccionModoEdicion 
      v-if="modoEdicion"
      :elemento="modoEdicionElemento"
      @volver="volver"
      ></SeccionModoEdicion>
  </div>
</template>
