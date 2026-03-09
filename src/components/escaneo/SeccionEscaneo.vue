<script setup>
import { ref, computed, onMounted, onUnmounted, defineEmits } from "vue";
import { MESSAGE_TYPES, ACTIONS } from "@/constants.config.js";
import { sendMessage, sendToBackground } from "@/helpers.config.js";

const props = defineProps({
  sectionVisible: String,
});

const emit = defineEmits(["update:sectionVisible"]);

//
let localState = ref(null);
let messageListener = null;

const configuracion = ref(null);
const search = ref("");
const filtroTipo = ref("all");

const inputs = ref([]);
const modoEscaneo = ref("visibles"); // valores: "visibles" | "todos" | "json" | "selector"
const esEscaneado = ref(false);

const modoSelector = ref(false);
const modoSelectorAccion = ref("agregar"); // valores: "agregar" | "nuevo" | "escanear"
const statusModoSelector = ref("error");
const msgModoSelector = ref("Modo Selector Desactivado");

const fileJsonRef = ref(null);
const nombreArchivoJson = ref(null);
const errorJson = ref(null);
const successJson = ref(null);

const segment =
  "px-3 py-1 text-[var(--text-secondary)] hover:bg-[var(--bg)] transition";
const activeSegment = "px-3 py-1 bg-[var(--primary)] text-white";

// !! FUNCIONES COMPUTADAS

// !! SENDMESSAGE

const obtenerInputs = async () => {
  fileJsonRef.value = null;
  successJson.value = null;
  errorJson.value = null;
  nombreArchivoJson.value = null;
  filtroTipo.value = "all";

  const sendResponse = await sendMessage(
    MESSAGE_TYPES.UI_EVENT,
    ACTIONS.SCAN_INPUTS,
    {
      soloVisibles: modoEscaneo.value === "visibles",
      modoEscaneo: modoEscaneo.value,
    }
  );

  inputs.value = sendResponse?.payload || [];
  await persistirConfig();
  await cargarConfiguracion();
  emit("update:sectionVisible", "resultados");
};

const activarModoSelector = async () => {
  modoSelector.value = true;
  modoSelectorAccion.value = modoSelectorAccion.value;
  statusModoSelector.value = "success";
  msgModoSelector.value = "Modo Selector Activado";

  const sendResponse = await sendMessage(
    MESSAGE_TYPES.UI_EVENT,
    ACTIONS.SELECTOR_MODE_ENABLE,
    {
      accion: modoSelectorAccion.value,
    }
  );

  if (sendResponse) {
    emit("update:sectionVisible", "resultados");
    await persistirConfig();
    await cargarConfiguracion();
  }

  modoSelector.value = false;
  modoSelectorAccion.value = modoSelectorAccion.value;
  statusModoSelector.value = "error";
  msgModoSelector.value = "Modo Selector Desactivado";
};

const cambiarModoEscaneo = async (modo) => {
  switch (modo) {
    case "json":
      fileJsonRef.value = null;
      successJson.value = null;
      errorJson.value = null;
      nombreArchivoJson.value = null;
      modoEscaneo.value = "json";
      break;
    case "visibles":
      modoEscaneo.value = "visibles";
      break;
    case "selector":
      modoEscaneo.value = "selector";
      break;
    default:
      modoEscaneo.value = "todos";
  }

  await persistirConfig();
  await cargarConfiguracion();
};

const cambiarModoSelectorAccion = async (modo) => {
  switch (modo) {
    case "agregar":
      modoSelectorAccion.value = "agregar";
      break;
    case "nuevo":
      modoSelectorAccion.value = "nuevo";
      break;
    case "escanear":
      modoSelectorAccion.value = "escanear";
      break;
    default:
      modoSelectorAccion.value = "todos";
  }

  await persistirConfig();
  await cargarConfiguracion();
};

const activarImportacion = async () => {
  modoEscaneo.value = "json";
  fileJsonRef.value?.click();

  await persistirConfig();
  await cargarConfiguracion();
};

const importarJSON = (event) => {
  inputs.value = [];
  const file = event.target.files?.[0];
  if (!file) return;

  successJson.value = null;
  errorJson.value = null;
  nombreArchivoJson.value = file.name;
  const reader = new FileReader();

  reader.onload = async (e) => {
    try {
      const data = JSON.parse(e.target.result);

      // ✅ Validación
      if (!Array.isArray(data)) {
        throw new Error("El JSON debe ser un array de objetos");
      }

      const esValido = data.every(
        (item) =>
          item &&
          typeof item === "object" &&
          "id" in item &&
          "name" in item &&
          "value" in item &&
          "type" in item &&
          "autofillId" in item &&
          "options" in item
      );

      if (!esValido) {
        throw new Error("El JSON no tiene la estructura correcta");
      }

      // por ejemplo, reemplazar tus inputs actuales
      inputs.value = data;
      esEscaneado.value = true;
      modoEscaneo.value = "json";
      successJson.value = "✔️ JSON importado correctamente";
      emit("update:sectionVisible", "resultados");

      await persistirConfig();
      await cargarConfiguracion();
    } catch (err) {
      errorJson.value = "✖️ El JSON no tiene la estructura correcta ";
    } finally {
      // Limpiar input para poder volver a seleccionar el mismo archivo
      event.target.value = null;
    }
  };

  reader.readAsText(file);
};

// !! MÉTODOS

const persistirConfig = async () => {
  await sendToBackground({
    type: "DISPATCH",
    action: {
      type: "CONFIG_SAVE",
      payload: {
        actualizado: Date.now(),
        elementoSeleccionado: {},
        elementos: inputs.value,
        modo: modoEscaneo.value,
        selectorActivado: modoSelector.value,
        selectorAccion: modoSelectorAccion.value,
      },
    },
  });
};

const fnVerResultados = () => {
  emit("update:sectionVisible", "resultados");
};

// Cargar perfiles
const cargarConfiguracion = async () => {
  localState.value = await chrome.runtime.sendMessage({
    type: "GET_STATE",
  });
  configuracion.value = localState.value?.configuracion;
  esEscaneado.value = configuracion.value?.elementos?.length > 0;
  inputs.value = configuracion.value?.elementos || [];
  modoEscaneo.value = configuracion.value?.modo || "visibles";
  modoSelector.value = configuracion.value?.selectorActivado || false;
  modoSelectorAccion.value = configuracion.value?.selectorAccion || "agregar";
};

// CHANGE: Eliminar este método de prueba
const test = async () => { };

// !! CICLO DE VIDA (EVENTOS)

/* Cargar popup */
onMounted(async () => {
  await cargarConfiguracion();
  messageListener = async (message) => {
    if (message.type === "STATE_UPDATED") {
      localState.value = message.state;
      await cargarConfiguracion();
    }
  };

  chrome.runtime.onMessage.addListener(messageListener);
});

onUnmounted(() => {
  chrome.runtime.onMessage.removeListener(messageListener);
  localState.value = null;
});
</script>

<!-- panel configuración v2.5  -->
<template>
  <div class="perspective-normal animate-slide-in">
    <!-- ===================== -->
    <!-- ESCANEO -->
    <!-- ===================== -->

    <section class="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 space-y-3">
      <h2 class="text-[12px] font-semibold">
        <span class="text-menu-item-active">Escaneo</span>
        >
        <span class="text-secondary cursor-pointer" @click="fnVerResultados">Modo resultados</span>
      </h2>

      <div class="flex items-center justify-between">
        <h2 class="text-sm font-semibold">Escaneo</h2>

        <span class="text-[10px] text-[var(--text-secondary)]">
          {{ inputs?.length }} detectados
        </span>
      </div>

      <!-- modos -->

      <div class="flex bg-[var(--bg)] border border-[var(--border)] rounded-lg overflow-hidden w-full">
        <button @click="cambiarModoEscaneo('visibles')" :class="[
          'flex-1',
          modoEscaneo === 'visibles' ? activeSegment : segment,
        ]">
          Visibles
        </button>

        <button @click="cambiarModoEscaneo('todos')"
          :class="['flex-1', modoEscaneo === 'todos' ? activeSegment : segment]">
          Todos
        </button>

        <button @click="cambiarModoEscaneo('selector')" :class="[
          'flex-1',
          modoEscaneo === 'selector' ? activeSegment : segment,
        ]">
          Selector
        </button>

        <button @click="cambiarModoEscaneo('json')"
          :class="['flex-1', modoEscaneo === 'json' ? activeSegment : segment]">
          JSON
        </button>
      </div>

      <!-- contenido dinámico -->

      <div class="text-[11px] text-[var(--text-secondary)]">
        <p v-if="modoEscaneo === 'visibles'">Escanea solo inputs visibles.</p>

        <p v-if="modoEscaneo === 'todos'">
          Escanea todos los inputs de la página.
        </p>

        <div v-if="modoEscaneo === 'selector'" class="space-y-2">
          <p>Selecciona manualmente elementos de la página.</p>

          <div class="flex bg-[var(--bg)] border border-[var(--border)] rounded-lg overflow-hidden">
            <button @click="cambiarModoSelectorAccion('agregar')" :class="[
              'flex-1',
              modoSelectorAccion === 'agregar' ? activeSegment : segment,
            ]">
              Agregar
            </button>

            <button @click="cambiarModoSelectorAccion('nuevo')" :class="[
              'flex-1',
              modoSelectorAccion === 'nuevo' ? activeSegment : segment,
            ]">
              Nuevo
            </button>

            <button @click="cambiarModoSelectorAccion('escanear')" :class="[
              'flex-1',
              modoSelectorAccion === 'escanear' ? activeSegment : segment,
            ]">
              Escanear
            </button>
          </div>

          <p class="text-green-400 font-medium" v-if="statusModoSelector === 'success'">
            {{ msgModoSelector }}
          </p>

          <p class="text-red-400 font-medium" v-if="statusModoSelector === 'error'">
            {{ msgModoSelector }}
          </p>
        </div>

        <div v-if="modoEscaneo === 'json'" class="space-y-2">
          <p>
            {{ nombreArchivoJson || "Seleccione un archivo JSON" }}
          </p>

          <p class="text-red-400 font-medium" v-if="errorJson">
            {{ errorJson }}
          </p>

          <p class="text-green-400 font-medium" v-if="successJson">
            {{ successJson }}
          </p>

          <input ref="fileJsonRef" @change="importarJSON" type="file" accept="application/json" hidden />
        </div>
      </div>

      <!-- botón principal -->

      <button v-if="modoEscaneo === 'json'" @click="activarImportacion" class="btn-primary w-full">
        Importar JSON
      </button>

      <button v-else-if="modoEscaneo === 'selector'" @click="activarModoSelector" class="btn-primary w-full">
        Activar modo selector
      </button>

      <button v-else @click="obtenerInputs" class="btn-primary w-full">
        Escanear página
      </button>
    </section>
  </div>
</template>
