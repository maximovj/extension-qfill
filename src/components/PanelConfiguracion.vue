<script setup>
import { ref, computed, onMounted, onUnmounted, defineEmits } from "vue"
import extConfig from '@/extension.config.js'
import { MESSAGE_TYPES, ACTIONS } from '@/constants.config.js'
import { sendMessage, sendToBackground } from '@/helpers.config.js'
import generarFakeValue from '../sidepanel/utils/generarFakeValue';
import generarPerfilFake from '../sidepanel/utils/generarPerfilFake';
import { sendToActiveTab } from "../helpers.config";
import db from "../indexedDBManager";
import SeccionDesplegable from "./SeccionDesplegable.vue";

// 
let localState = ref(null);
let messageListener = null;

const sectionVisible = ref("escaneo");
const configuracion = ref(null);
const emit = defineEmits(["perfilNuevoCreado"]);
const search = ref("")
const filtroTipo = ref("all")
const animando = ref(null)

const inputs = ref([]);
const modoEscaneo = ref("visibles"); // valores: "visibles" | "todos" | "json" | "selector"
const esEscaneado = ref(false);

const modoSelector = ref(false);
const modoSelectorAccion = ref('agregar'); // valores: "agregar" | "nuevo" | "escanear"
const statusModoSelector = ref("error");
const msgModoSelector = ref("Modo Selector Desactivado");
const itemModoSelector = ref({});

const pizarraRef = ref("panel");

const fileJsonRef = ref(null);
const nombreArchivoJson = ref(null)
const errorJson = ref(null);
const successJson = ref(null);

const segment = "px-3 py-1 text-[var(--text-secondary)] hover:bg-[var(--bg)] transition";
const activeSegment = "px-3 py-1 bg-[var(--primary)] text-white";

// !! FUNCIONES COMPUTADAS

// Inputs seleccionados
const inputsSeleccionados = computed(() => inputs.value.filter( i => i.selected));

// Cantidad de seleccionados
const totalSelecionados = computed(() => {
  const cantidad = inputs.value.filter( i => i.selected)?.length || 0;
  return cantidad > 99 ? '+99' : cantidad;
});

/* Tipos detectados dinámicamente */
const tiposDisponibles = computed(() => {
  const tipos = new Set(inputs.value.map(i => i.type))
  return ["all", "name", "id", ...tipos]
});

/* Filtrado + búsqueda */
const inputsFiltrados = computed(() => {
  return inputs.value.filter(i => {
    const coincideBusqueda =
      !search.value ||
      i.name?.toLowerCase().includes(search.value.toLowerCase()) ||
      i.id?.toLowerCase().includes(search.value.toLowerCase())

    const coincideTipo =
      filtroTipo.value === "all" || i.type === filtroTipo.value

    if(filtroTipo.value === "id") {
      return filtroTipo.value === "id" && i.id !== null;
    }

    if(filtroTipo.value === "name") {
      return filtroTipo.value === "name" && i.name !== null;
    }

    return coincideBusqueda && coincideTipo
  });
});

/* Agrupar por formulario */
const inputsAgrupados = computed(() => {
  const grupos = {}

  inputsFiltrados.value.forEach(i => {
    const form = i.form || "Sin formulario"
    if (!grupos[form]) grupos[form] = []
    grupos[form].push(i)
  })

  return grupos
});

// !! SENDMESSAGE

const obtenerInputs = async () => {
  fileJsonRef.value = null;
  successJson.value = null;
  errorJson.value = null;
  nombreArchivoJson.value = null; 
  filtroTipo.value = 'all';

  const sendResponse = await sendMessage(
    MESSAGE_TYPES.UI_EVENT,
    ACTIONS.SCAN_INPUTS, 
    { soloVisibles: modoEscaneo.value === "visibles", modoEscaneo: modoEscaneo.value });
    
  inputs.value = sendResponse?.payload || [];
  await persistirConfig();
  await cargarConfiguracion();
  sectionVisible.value = "resultados";
};

const eliminarTodoEscaneado = async () => {
  inputs.value = [];
  nombreArchivoJson.value = null;
  successJson.value = null;

  await persistirConfig();
  await cargarConfiguracion();
}

const aplicarFakerFiller = async () => {
  const perfil = generarPerfilFake();
  inputs.value = inputs.value.map( i => ({
    ...i,
    value: generarFakeValue(i, perfil)
  }));

  await persistirConfig();
  await cargarConfiguracion();
}

const rellenarInput = async (input) => {
  // TODO: Funcionando
  await sendMessage(
      MESSAGE_TYPES.UI_EVENT,
      ACTIONS.FILL_INPUT_BY_ID, 
      { data: input });
};

const rellenarTodos = async () => {
  // TODO: Funcionando
  await sendMessage(
      MESSAGE_TYPES.UI_EVENT,
      ACTIONS.FILL_ALL_INPUTS, 
      { data: inputsSeleccionados.value });
};

const activarModoSelector = async () => {
  modoSelector.value = true;
  modoSelectorAccion.value = modoSelectorAccion.value;
  statusModoSelector.value = 'success';
  msgModoSelector.value = 'Modo Selector Activado';
  

  const sendResponse = await sendMessage(
    MESSAGE_TYPES.UI_EVENT,
    ACTIONS.SELECTOR_MODE_ENABLE);

  if(sendResponse) {
    sectionVisible.value = "resultados";
    await persistirConfig();
    await cargarConfiguracion();
  }
  
  modoSelector.value = false;
  modoSelectorAccion.value = modoSelectorAccion.value;
  statusModoSelector.value = 'error';
  msgModoSelector.value = 'Modo Selector Desactivado';
};

const crearPerfil = async () => {
  const { nextId } = await db.getIdInfo("perfiles");
  const nuevoPerfil = await chrome.runtime.sendMessage({
      type: "DISPATCH",
      action: {
        type: "PERFIL_CREATE",
        payload: {
          nombre: "Perfil #"+(nextId),
          descripcion: (inputsSeleccionados.value?.length)+" elementos disponibles",
          elementos: inputsSeleccionados.value,
          creado: Date().now,
          actualizado: Date().now,
        },
      }
    });

  emit("perfilNuevoCreado", nuevoPerfil);
}

const cambiarModoEscaneo = async (modo) => {
  switch(modo) {
    case 'json': 
      fileJsonRef.value = null;
      successJson.value = null;
      errorJson.value = null;
      nombreArchivoJson.value = null;
      modoEscaneo.value = 'json';
      break;
    case 'visibles': 
      modoEscaneo.value = 'visibles';
      break;
    case 'selector': 
      modoEscaneo.value = 'selector';
      break;
    default:
      modoEscaneo.value = 'todos';
  }

  await persistirConfig();
  await cargarConfiguracion();
}

const cambiarModoSelectorAccion = async (modo) => {
  switch(modo) {
    case 'agregar': 
      modoSelectorAccion.value = 'agregar';
      break;
    case 'nuevo': 
      modoSelectorAccion.value = 'nuevo';
      break;
    case 'escanear': 
      modoSelectorAccion.value = 'escanear';
      break;
    default:
      modoSelectorAccion.value = 'todos';
  }

  await persistirConfig();
  await cargarConfiguracion();
}

const cambiarSelectedATodos = async (x) => {
  inputs.value = inputs.value.map(item => ({...item, selected: x}));

  await persistirConfig();
  await cargarConfiguracion();
}

const quitarValores = async () => {
  inputs.value = inputs.value.map(item => {
    if(!item?.selected) return item;
    return {...item, value: null}
  });
  
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
  const file = event.target.files?.[0]
  if (!file) return

  successJson.value = null;
  errorJson.value = null;
  nombreArchivoJson.value = file.name;
  const reader = new FileReader()

  reader.onload = async (e) => {
    try {
      const data = JSON.parse(e.target.result)

      // ✅ Validación
      if (!Array.isArray(data)) {
        throw new Error("El JSON debe ser un array de objetos")
      }

      const esValido = data.every(item =>
        item &&
        typeof item === "object" &&
        "id" in item &&
        "name" in item &&
        "value" in item &&
        "type" in item &&
        "autofillId" in item &&
        "options" in item
      )

      if (!esValido) {
        throw new Error("El JSON no tiene la estructura correcta")
      }

      // por ejemplo, reemplazar tus inputs actuales
      inputs.value = data
      esEscaneado.value = true
      modoEscaneo.value = 'json'
      successJson.value = "✔️ JSON importado correctamente";
      sectionVisible.value = 'resultados';

      await persistirConfig();
      await cargarConfiguracion();

    } catch (err) {
      errorJson.value = "✖️ El JSON no tiene la estructura correcta ";
    } finally {
      // Limpiar input para poder volver a seleccionar el mismo archivo
      event.target.value = null
    }
  }

  reader.readAsText(file)
}


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
          }
      }
    });
} 

const fnVerEscaneo = () => {
  sectionVisible.value = "escaneo";
};

const fnVerResultados = () => {
  sectionVisible.value = "resultados";
};

// Actualiza valores editables en tabla
const actualizarValor = (input, event) => {
    if (input.type === 'checkbox') input.value = event.target.checked;
    else if (input.type === 'number' || input.type === 'range') input.value = Number(event.target.value);
    else if (input.type === 'select-multiple') input.value = Array.from(event.target.selectedOptions).map(opt => opt.value);
    else input.value = event.target.value;
};

const exportarJSON = () => {
  const dataStr = JSON.stringify(inputsSeleccionados.value, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "inputs-export.json";
  a.click();

  URL.revokeObjectURL(url);
};

/* Animación al rellenar */
const rellenarInputAnimado = (input) => {
  rellenarInput(input)
  animando.value = input.id || input.name;

  setTimeout(() => {
    animando.value = null
  }, 600);
}

// Cargar perfiles
const cargarConfiguracion = async () => {
  localState.value = await chrome.runtime.sendMessage({
    type: "GET_STATE"
  });
  configuracion.value = localState.value?.configuracion;
  esEscaneado.value = configuracion.value?.elementos?.length > 0;
  inputs.value = configuracion.value?.elementos || [];
  modoEscaneo.value =  configuracion.value?.modo || "visibles";
  modoSelector.value = configuracion.value?.selectorActivado || false;
  modoSelectorAccion.value = configuracion.value?.selectorAccion || "agregar";
}

// CHANGE: Eliminar este método de prueba
const test = async () => {
  
}

// !! CICLO DE VIDA (EVENTOS)

/* Cargar popup */
onMounted( async () => {
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
<div class="space-y-4 text-xs max-w-[520px] mx-auto animate-slide-in">

  <!-- ===================== -->
  <!-- ESCANEO -->
  <!-- ===================== -->

  <section
    v-if="sectionVisible === 'escaneo'"
    class="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 space-y-3"
  >

    <h2 class="text-[12px] font-semibold">
      <span class="text-menu-item-active"
        >Escaneo</span
      >
      >
      <span class="text-secondary cursor-pointer" @click="fnVerResultados">Modo resultados</span>
    </h2>

    <div class="flex items-center justify-between">
      <h2 class="text-sm font-semibold">
        Escaneo
      </h2>

      <span class="text-[10px] text-[var(--text-secondary)]">
        {{ inputs?.length }} detectados
      </span>
    </div>

    <!-- modos -->

    <div class="flex bg-[var(--bg)] border border-[var(--border)] rounded-lg overflow-hidden w-full">

      <button
        @click="cambiarModoEscaneo('visibles')"
        :class="['flex-1', modoEscaneo === 'visibles' ? activeSegment : segment]"
      >
        Visibles
      </button>

      <button
        @click="cambiarModoEscaneo('todos')"
        :class="['flex-1', modoEscaneo === 'todos' ? activeSegment : segment]"
      >
        Todos
      </button>

      <button
        @click="cambiarModoEscaneo('selector')"
        :class="['flex-1', modoEscaneo === 'selector' ? activeSegment : segment]"
      >
        Selector
      </button>

      <button
        @click="cambiarModoEscaneo('json')"
        :class="['flex-1', modoEscaneo === 'json' ? activeSegment : segment]"
      >
        JSON
      </button>

    </div>

    <!-- contenido dinámico -->

    <div class="text-[11px] text-[var(--text-secondary)]">

      <p v-if="modoEscaneo === 'visibles'">
        Escanea solo inputs visibles.
      </p>

      <p v-if="modoEscaneo === 'todos'">
        Escanea todos los inputs de la página.
      </p>

      <div v-if="modoEscaneo === 'selector'" class="space-y-2">

        <p>Selecciona manualmente elementos de la página.</p>

        <div class="flex bg-[var(--bg)] border border-[var(--border)] rounded-lg overflow-hidden">

          <button
            @click="cambiarModoSelectorAccion('agregar')"
            :class="['flex-1', modoSelectorAccion === 'agregar' ? activeSegment : segment]"
          >
            Agregar
          </button>

          <button
            @click="cambiarModoSelectorAccion('nuevo')"
            :class="['flex-1', modoSelectorAccion === 'nuevo' ? activeSegment : segment]"
          >
            Nuevo
          </button>

          <button
            @click="cambiarModoSelectorAccion('escanear')"
            :class="['flex-1', modoSelectorAccion === 'escanear' ? activeSegment : segment]"
          >
            Escanear
          </button>

        </div>

        <p
          class="text-green-400 font-medium"
          v-if="statusModoSelector === 'success'"
        >
          {{ msgModoSelector }}
        </p>

        <p
          class="text-red-400 font-medium"
          v-if="statusModoSelector === 'error'"
        >
          {{ msgModoSelector }}
        </p>

      </div>

      <div v-if="modoEscaneo === 'json'" class="space-y-2">

        <p>
          {{ nombreArchivoJson || 'Seleccione un archivo JSON' }}
        </p>

        <p
          class="text-red-400 font-medium"
          v-if="errorJson"
        >
          {{ errorJson }}
        </p>

        <p
          class="text-green-400 font-medium"
          v-if="successJson"
        >
          {{ successJson }}
        </p>

        <input
          ref="fileJsonRef"
          @change="importarJSON"
          type="file"
          accept="application/json"
          hidden
        />

      </div>

    </div>

    <!-- botón principal -->

    <button
      v-if="modoEscaneo === 'json'"
      @click="activarImportacion"
      class="btn-primary w-full"
    >
      Importar JSON
    </button>

    <button
      v-else-if="modoEscaneo === 'selector'"
      @click="activarModoSelector"
      class="btn-primary w-full"
    >
      Activar modo selector
    </button>

    <button
      v-else
      @click="obtenerInputs"
      class="btn-primary w-full"
    >
      Escanear página
    </button>

  </section>

  <!-- ===================== -->
  <!-- RESULTADOS -->
  <!-- ===================== -->

  <section
    v-if="sectionVisible === 'resultados'"
    class="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 space-y-4 max-h-[580px] overflow-y-auto"
  >

    <!-- header -->
    <h2 class="text-[12px] font-semibold">
      <span class="text-secondary cursor-pointer" @click="fnVerEscaneo"
        >Escaneo</span
      >
      >
      <span class="text-menu-item-active">Modo resultados</span>
    </h2>

    <div class="flex justify-between items-center">

      <h2 class="text-sm font-semibold">
        Modo Resultados ({{ inputsFiltrados?.length }})
      </h2>

      <span class="text-[10px] bg-cyan-500 px-2 py-1 rounded-full font-semibold text-white">
        {{ totalSelecionados }} seleccionados
      </span>

    </div>

    <template v-if="Object.keys(inputsAgrupados)?.length" >

      <!-- ===================== -->
      <!-- FILTROS -->
      <!-- ===================== -->

      <SeccionDesplegable titulo="Acciones">
        <template v-slot:contenido>
          <div class="grid gap-1 mb-2">

            <input
              v-model="search"
              type="text"
              placeholder="Buscar por name o id..."
              class="input w-full"
            />

            <div class="flex gap-1 flex-wrap">

              <button
                v-for="tipo in tiposDisponibles"
                :key="tipo"
                @click="filtroTipo = tipo"
                :class="[
                  'px-2 py-1 rounded-md border text-[10px] transition',
                  filtroTipo === tipo
                    ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                    : 'border-[var(--border)] text-[var(--text-secondary)]'
                ]"
              >
                {{ tipo }}
              </button>

            </div>

          </div>
          
          <!-- ===================== -->
          <!-- ACCIONES -->
          <!-- ===================== -->

          <div class="space-y-2">

            <div class="grid grid-cols-2 gap-2">

              <button
                @click="cambiarSelectedATodos(true)"
                class="btn btn-outline-primary w-full"
              >
                Seleccionar
              </button>

              <button
                @click="cambiarSelectedATodos(false)"
                class="btn btn-outline-primary w-full"
              >
                Ninguno
              </button>

              <button
                @click="aplicarFakerFiller()"
                class="btn btn-outline-primary w-full"
              >
                Faker
              </button>

              <button
                @click="quitarValores()"
                class="btn btn-outline-primary w-full"
              >
                Vaciar
              </button>

              <button
                @click="crearPerfil"
                class="btn btn-outline-primary col-span-2 w-full"
              >
                Crear perfil
              </button>

            </div>

          </div>


        </template>  
      </SeccionDesplegable>
      
      <!-- ===================== -->
      <!-- INPUTS -->
      <!-- ===================== -->

      <div
        v-for="(grupo, formName) in inputsAgrupados"
        :key="formName"
        class="max-h-[350px] overflow-y-auto space-y-1 space-y-3"
      >

        <div class="text-[10px] uppercase tracking-wide text-[var(--text-secondary)]">
          {{ formName }}
        </div>

        <div
          v-for="i in grupo"
          :key="i.id"
          class="bg-[var(--bg)] border border-[var(--border)] rounded-lg p-3 space-y-2 transition hover:border-[var(--primary)] hover:shadow-sm"
          :class="animando === i.id ? 'ring-2 ring-green-500 animate-pulse' : ''"
        >

          <!-- header -->

          <div class="flex justify-between gap-2">

            <div class="flex-1 min-w-0">

              <div class="font-medium truncate">
                {{ i.name || 'Sin nombre' }}
              </div>

              <div class="text-[10px] text-[var(--text-secondary)]">
                {{ i.type }} • {{ i.id || 'sin-id' }}
              </div>

              <div class="text-[10px] truncate text-[var(--text-secondary)]">
                id. {{ i.autofillId.slice(0,30) }}...
              </div>

            </div>

            <div class="flex flex-col items-center gap-2">

              <input
                type="checkbox"
                v-model="i.selected"
                class="accent-[var(--primary)]"
              />

              <button
                @click="rellenarInputAnimado(i)"
                class="btn btn-outline-green text-[10px]"
              >
                Rellenar
              </button>

            </div>

          </div>

          <!-- editor -->

          <div>

            <template v-if="i.type === 'checkbox'">

              <label class="flex items-center gap-2">
                <input
                  type="checkbox"
                  :checked="i.value"
                  @change="actualizarValor(i,$event)"
                />
                Activado
              </label>

            </template>

            <template v-else-if="i.type === 'select-one' || i.type === 'select-multiple'">

              <select
                :multiple="i.type === 'select-multiple'"
                @change="actualizarValor(i,$event)"
                class="input text-xs w-full"
              >

                <option
                  v-for="opt in i.options"
                  :key="opt"
                  :value="opt"
                  :selected="i.type==='select-multiple'
                    ? i.value.includes(opt)
                    : i.value===opt"
                >
                  {{ opt }}
                </option>

              </select>

            </template>

            <template v-else>

              <input
                type="text"
                :value="i.value"
                @input="actualizarValor(i,$event)"
                class="input text-xs w-full"
              />

            </template>

          </div>

        </div>

      </div>

      <!-- ===================== -->
      <!-- ZONA PELIGROSA -->
      <!-- ===================== -->

      <div class="grid grid-cols-3 gap-2 border-t border-[var(--border)] pt-3">

        <button
          @click="eliminarTodoEscaneado"
          class="btn btn-outline-red w-full"
        >
          Eliminar todos
        </button>

        <button
          @click="rellenarTodos()"
          class="btn btn-outline-primary w-full"
        >
          Rellenar
        </button>

        <button
          @click="exportarJSON()"
          class="btn btn-outline-primary w-full"
        >
          Exportar JSON
        </button>

      </div>
    </template>
  </section>

</div>
</template>

