<script setup>
import { ref, computed, onMounted, onUnmounted, defineEmits } from "vue";
import { MESSAGE_TYPES, ACTIONS } from "@/constants.config.js";
import { sendMessage } from "@/helpers.config.js";
import generarFakeValue from '../../sidepanel/utils/generarFakeValue';
import generarPerfilFake from '../../sidepanel/utils/generarPerfilFake';
import db from "../../indexedDBManager";
import AlertaConfirmar from "../common/AlertaConfirmar.vue";
import SeccionDesplegable from "../common/SeccionDesplegable.vue";
import TarjetaElemento from "./TarjetaElemento.vue";
import AccionElemento from "./AccionElemento.vue";

const props = defineProps({
  elemento: Object,
});

const emit = defineEmits(["volver"]);

//
let localState = ref(null);
let messageListener = null;

const perfiles = ref([]);
const editar = ref(props.elemento)
const alertaConfirmarRef = ref(null);
const modalTitulo = ref("");
const modalMensaje = ref("");

// !! FUNCIONES COMPUTADAS

const editarSeleccionados = computed(() =>
  editar.value?.elementos.filter((i) => i.selected),
);

const editarTotalElementos = computed(
  () => editar.value?.elementos?.length || 0,
);

const editarTotalSelecionados = computed(() => editarSeleccionados?.value?.length);

// !! FUNCIONES

const slugify = (text) =>
  text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')        // espacios → guiones
    .replace(/[^\w\-]+/g, '')    // elimina caracteres especiales
    .replace(/\-\-+/g, '-');     // evita múltiples guiones

const fnAccionEditar = (perfil) => {
  editar.value = perfil;
};

const fnAccionActualizar = async (perfil) => {
  modalTitulo.value = "CONFIRMAR";
  modalMensaje.value = "¿SEGURO QUE DESEAS ACTUALIZAR ESTE PERFIL?";
  const confirmado = await alertaConfirmarRef.value?.abrir();

  if (confirmado) {
    await chrome.runtime.sendMessage({
      type: "DISPATCH",
      action: {
        type: "PERFIL_UPDATE",
        payload: {
          id: perfil?.id,
          changes: {
            nombre: perfil?.nombre,
            descripcion: perfil?.descripcion,
            actualizado: Date.now()
          }
        }
      }
    });
    emit("volver", {});
  }
};

const fnAccionVolver = () => {
  emit("volver", {});
};

const fnAccionEliminar = async (perfil) => {
  modalTitulo.value = "CONFIRMAR";
  modalMensaje.value = "¿SEGURO QUE DESEAS ELIMINAR EL PERFIL?";
  const confirmado = await alertaConfirmarRef.value?.abrir();

  if (confirmado) {
    await chrome.runtime.sendMessage({
      type: "DISPATCH",
      action: {
        type: "PERFIL_DELETE",
        payload: {
          id: perfil?.id,
        }
      }
    });
    emit("volver", {});
  }
};

const cambiarSelectedATodos = (valor) => {
  if (!editar.value?.elementos) return;

  editar.value.elementos = editar.value.elementos.map(item => ({
    ...item,
    selected: valor
  }));
};

const actualizarEstadosRef = async () => {
  // Cargar la configuración
  const configDB = await sendMessage(
    MESSAGE_TYPES.SYSTEM_EVENT,
    ACTIONS.ASYNC_PROFILES,
  );

  if (configDB?.status === "ok") {
    perfiles.value = configDB?.msg?.storePerfiles || [];
    editar.value = perfiles.value[0];
  }
};

const exportarJSON = () => {
  const dataStr = JSON.stringify(editarSeleccionados.value, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const timestamp = Date.now();
  const slugNombre = slugify(editar.value?.nombre || 'elementos');
  const a = document.createElement("a");
  a.href = url;
  a.download = `${slugNombre}_${editarTotalElementos.value}_${timestamp}.json`;
  a.click();

  URL.revokeObjectURL(url);
};

const aplicarFakerFiller = () => {
  if (!editar.value?.elementos) return;

  const perfil = generarPerfilFake();

  editar.value.elementos = editar.value.elementos.map(i => {
    if (!i.selected) return i;

    return {
      ...i,
      value: generarFakeValue(i, perfil)
    };
  });
};

const eliminarTodos = () => {
  editar.value.elementos = [];
}

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

// !! 

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
  <div class="perspective-normal animate-slide-in">
    <AlertaConfirmar :titulo="modalTitulo" :mensaje="modalMensaje" ref="alertaConfirmarRef" />

    <!-- ===================== -->
    <!-- 🟦 MÓDULO : EDICCION -->
    <!-- ===================== -->
    <section class="bg-(--surface) border border-(--border) rounded-xl p-4 space-y-3">
      <h2 class="text-[12px] font-semibold">
        <span class="text-secondary cursor-pointer" @click="fnAccionVolver">Perfiles</span>
        >
        <span class="text-menu-item-active">Modo edición</span>
      </h2>

      <div class="grid grid-cols-1 gap-2">

        <!-- Información del perfil -->
        <SeccionDesplegable titulo="Información del perfil">
          <template v-slot:contenido>
            <div class="m-2">
              <div class="flex flex-col gap-1 justify-center">
                <label class="text-[10px] font-bold" for="nombre">Nombre:</label>
                <input id="nombre" type="text" v-model="editar.nombre" placeholder="Escribe un nombre (obligatorio)"
                  class="input text-xs" />
              </div>
              <div class="flex flex-col gap-1 justify-center">
                <label class="text-[10px] font-bold" for="descripcion">Descripción:</label>
                <input id="descripcion" type="text" v-model="editar.descripcion"
                  placeholder="Escribe una descripción (opcional)" class="input text-xs" />
              </div>
            </div>
          </template>
        </SeccionDesplegable>

        <!-- Elementos -->
        <SeccionDesplegable :titulo="`Elementos (${editarTotalElementos})`">
          <template v-slot:contenido>
            <!-- Elementos | Acciones -->
            <AccionElemento 
              :es-visible="editarTotalElementos > 0"
              :editar-total-selecionados="editarTotalSelecionados"
            ></AccionElemento>

            <div class="grid grid-cols-1 gap-2 overflow-y-auto max-h-65">
              <div v-for="i in editar?.elementos" :key="i.id"
                class="bg-(--bg) border border-(--border) rounded-lg p-3 space-y-2 transition">
                <TarjetaElemento :elemento="i" />
              </div>
            </div>
          </template>
        </SeccionDesplegable>

        <!-- Acciones -->
        <div class="flex gap-2">
          <button class="btn btn-outline-green cursor-pointer" @click="fnAccionActualizar(editar)">
            Actualizar
          </button>
          <button class="btn btn-outline-blue cursor-pointer">
            Cargar
          </button>
          <button class="btn btn-outline-red cursor-pointer" @click="fnAccionEliminar(editar)">
            Eliminar
          </button>
        </div>

      </div>
    </section>
  </div>
</template>
