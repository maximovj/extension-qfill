<script setup>
import { ref, computed, onMounted } from "vue"
import extConfig from '@/extension.config.js'
import { MESSAGE_TYPES, ACTIONS } from '@/constants.config.js'
import { sendMessage, dispatchRuntime, dispatchToBackground } from '@/helpers.config.js'
import extensionState from "../extensionState.config";
import generarFakeValue from './utils/generarFakeValue';
import generarPerfilFake from './utils/generarPerfilFake';

const search = ref("")
const filtroTipo = ref("all")
const animando = ref(null)

const inputs = ref([]);
const modoEscaneo = ref("visibles"); // valores: "visibles" | "todos" | "json" | "selector"
const esEscaneado = ref(false);

const modoSelector = ref(false);
const statusModoSelector = ref("error");
const msgModoSelector = ref("Modo Selector Desactivado");
const itemModoSelector = ref({});

const fileJsonRef = ref(null);
const nombreArchivoJson = ref(null)
const errorJson = ref(null);
const successJson = ref(null);

const segment = "px-3 py-1 text-[var(--text-secondary)] hover:bg-[var(--bg)] transition";
const activeSegment = "px-3 py-1 bg-[var(--primary)] text-white";

const obtenerInputs = async () => {
  fileJsonRef.value = null;
  successJson.value = null;
  errorJson.value = null;
  nombreArchivoJson.value = null; 
  filtroTipo.value = 'all';

  const response = await sendMessage(
    MESSAGE_TYPES.UI_EVENT,
    ACTIONS.SCAN_INPUTS, 
    { soloVisibles: modoEscaneo.value === "visibles", modoEscaneo: modoEscaneo.value });

  if(response?.length) {
    inputs.value = response;
    esEscaneado.value = true;
  } else {
    inputs.value = [];
    esEscaneado.value = false;
  }
};

const rellenarInput = async (input) => {
  const response = await sendMessage(
      MESSAGE_TYPES.UI_EVENT,
      ACTIONS.FILL_INPUT_BY_ID, 
      { data: input });
};

const rellenarTodos = async () => {
  const response = await sendMessage(
      MESSAGE_TYPES.UI_EVENT,
      ACTIONS.FILL_ALL_INPUTS, 
      { data: inputsSeleccionados.value });
};

const activarModoSelector = async () => {
  modoSelector.value = true;
  msgModoSelector.value = 'Modo Selector Activado';
  statusModoSelector.value = 'success';

  const response = await sendMessage(
      MESSAGE_TYPES.UI_EVENT,
      ACTIONS.SELECTOR_MODE_ENABLE, {
        modoEscaneo: modoEscaneo.value,
        modoSelector: modoSelector.value,
        msgModoSelector: msgModoSelector.value,
        statusModoSelector: statusModoSelector.value,
        itemModoSelector: itemModoSelector.value,
      });
};

// Actualiza valores editables en tabla
const actualizarValor = (input, event) => {
    if (input.type === 'checkbox') input.value = event.target.checked;
    else if (input.type === 'number' || input.type === 'range') input.value = Number(event.target.value);
    else if (input.type === 'select-multiple') input.value = Array.from(event.target.selectedOptions).map(opt => opt.value);
    else input.value = event.target.value;
};

const cambiarModoEscaneo = (modo) => {
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
}

const cambiarSelectedATodos = (x) => {
  inputs.value = inputs.value.map(item => ({...item, selected: x}));
}

const activarImportacion = () => {
  modoEscaneo.value = "json";
  fileJsonRef.value?.click();
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

      // TODO : Enviarlo a Background utiliza chrome.storage.set
      const setMany = {
        'ultimoEscaneo.escaneado': true,
        'ultimoEscaneo.inputs': inputs.value,
        'ultimoEscaneo.modo': 'json',
      };
      await sendMessage(MESSAGE_TYPES.STATE_EVENT, ACTIONS.STATE_SET_MANY, { setMany });

    } catch (err) {
      errorJson.value = "✖️ El JSON no tiene la estructura correcta ";
    } finally {
      // Limpiar input para poder volver a seleccionar el mismo archivo
      event.target.value = null
    }
  }

  reader.readAsText(file)
}

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

const aplicarFakerFiller = async () => {
  const perfil = generarPerfilFake();
  inputs.value = inputs.value.map( i => ({
    ...i,
    value: generarFakeValue(i, perfil)
  }));
  // TODO : Enviarlo a Background utiliza chrome.storage.set
  const set = {key: 'ultimoEscaneo.inputs', value: inputs.value };
  await sendMessage(MESSAGE_TYPES.STATE_EVENT, ACTIONS.STATE_SET, { set });
}

const eliminarTodoEscaneado = async () => {
  await sendMessage(MESSAGE_TYPES.STATE_EVENT, ACTIONS.STATE_RESET);
  await inicializarStateConfig();
}

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
})

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
  })
})

/* Agrupar por formulario */
const inputsAgrupados = computed(() => {
  const grupos = {}

  inputsFiltrados.value.forEach(i => {
    const form = i.form || "Sin formulario"
    if (!grupos[form]) grupos[form] = []
    grupos[form].push(i)
  })

  return grupos
})

/* Animación al rellenar */
const rellenarInputAnimado = (input) => {
  rellenarInput(input)
  animando.value = input.id || input.name;

  setTimeout(() => {
    animando.value = null
  }, 600);
}

const inicializarStateConfig = async () => {
  await new Promise((resolve, reject) => {
    esEscaneado.value = extensionState.get('ultimoEscaneo.escaneado');
    inputs.value = extensionState.get('ultimoEscaneo.inputs') || [];    
    modoEscaneo.value = extensionState.get('ultimoEscaneo.modo');

    /*
    modoSelector.value = extensionState.get('modoSelector.activo');
    statusModoSelector.value = extensionState.get('modoSelector.status');
    msgModoSelector.value = extensionState.get('modoSelector.mensaje');
    itemModoSelector.value = extensionState.get('modoSelector.itemSeleccionado');
    */
    resolve({ status: 'ok' });
  }).then(() => {});
}

/* Cargar popup */
onMounted( async () => {
  console.log(`Cargando extensión ${extConfig.header_title} ${extConfig.header_version} [...] `);
  
  const connect = await sendMessage( MESSAGE_TYPES.SYSTEM_EVENT, ACTIONS.CONNECT);
  if(connect?.status === 'ok') {
    await inicializarStateConfig();
  }

});
</script>

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
    
    <!-- ===================== -->
    <!-- 🟦 MÓDULO 1: ESCANEO -->
    <!-- ===================== -->
    <section class="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 space-y-3">
      
      <div class="flex items-center justify-between">
        <h2 class="text-sm font-semibold">Escaneo</h2>
        <span class="text-[10px] text-[var(--text-secondary)]">
          {{ inputs?.length }} detectados
        </span>
      </div>

      <div class="flex bg-[var(--bg)] border border-[var(--border)] rounded-lg overflow-hidden w-fit">
        <button
          @click="cambiarModoEscaneo('visibles')"
          :class="modoEscaneo === 'visibles' ? activeSegment : segment"
        >
          Visibles
        </button>
        <button
          @click="cambiarModoEscaneo('todos')"
          :class="modoEscaneo === 'todos' ? activeSegment : segment"
        >
          Todos
        </button>
        <button
          @click="cambiarModoEscaneo('selector')"
          :class="modoEscaneo === 'selector' ? activeSegment : segment"
        >
          Seleccion
        </button>
        <button
          @click="cambiarModoEscaneo('json')"
          :class="modoEscaneo === 'json' ? activeSegment : segment"
        >
          Importar JSON
        </button>
      </div>

      <div v-if="modoEscaneo === 'visibles'">
        <p>Está opción solo buscará inputs visibles de la página actual</p>
      </div>

      <div v-if="modoEscaneo === 'todos'">
        <p>Está opción solo buscará todos los inputs de la página actual</p>
      </div>

      <div v-if="modoEscaneo === 'selector'">
        <p>Está opción permite seleccionar un elemento de la página actual</p>
        <p class="my-2 text-green-400 font-medium" v-if="statusModoSelector === 'success'">{{ msgModoSelector }}</p>
        <p class="my-2 text-red-400 font-medium" v-if="statusModoSelector === 'error'">{{ msgModoSelector }}</p>
      </div>

      <div v-if="modoEscaneo === 'json'">
        <p class="my-2">{{ nombreArchivoJson || 'Seleccione un archivo JSON' }}</p>
        <p class="my-2 text-red-400 font-medium" v-if="errorJson">{{ errorJson }}</p>
        <p class="my-2 text-green-400 font-medium" v-if="successJson">{{ successJson }}</p>

        <input
          ref="fileJsonRef"
          @change="importarJSON"
          type="file"
          accept="application/json"
          hidden
        />
      </div>

      <div class="grid grid-cols-1 gap-1">
        <button @click="activarImportacion" v-if="modoEscaneo === 'json'" class="btn-primary w-full">
          Importar Json
        </button>
        <button @click="activarModoSelector" v-else-if="modoEscaneo === 'selector'" class="btn-primary w-full">
          Seleccionar un input
        </button>
        <button @click="obtenerInputs" v-else class="btn-primary w-full">
          Escanear página
        </button>
      </div>

    </section>


    <!-- ===================== -->
    <!-- 🟦 MÓDULO 2: FILTROS -->
    <!-- ===================== -->
    <section class="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 space-y-3">
      
      <h2 class="text-sm font-semibold">Filtros</h2>

      <input
        v-model="search"
        type="text"
        placeholder="Buscar por name o id..."
        class="input"
      />

      <div class="flex gap-2 flex-wrap mt-2">
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
    </section>


    <!-- ===================== -->
    <!-- 🟦 MÓDULO 3: RESULTADOS -->
    <!-- ===================== -->
    <section
      v-if="Object.keys(inputsAgrupados)?.length"
      class="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 space-y-4 max-h-[320px] overflow-y-auto"
    >
      <div class="fixed right-13
                    min-w-7 h-7 px-1 py-1
                    bg-cyan-500
                    rounded-full 
                    flex items-center justify-center
                    text-[10p] font-semibold animate-pulse">
          <span>{{ totalSelecionados }}</span>
      </div>
      <div class="flex flex-col">
        <div class="flex justify-between items-center">
          <h2 class="text-sm font-semibold">
            Resultados ({{ inputsFiltrados?.length }})
          </h2>
        </div>
        
        <div class="grid grid-cols-2">
          <div>
            <button
              @click="eliminarTodoEscaneado"
              class="text-[10px] text-green-600 hover:underline"
            >
              Eliminar todos los elementos
            </button>
          </div>
          <div>
            <button
              @click="cambiarSelectedATodos(true)"
              class="text-[10px] text-green-600 hover:underline"
            >
              Seleccionar todos
            </button>
          </div>
          <div>
            <button
              @click="cambiarSelectedATodos(false)"
              class="text-[10px] text-green-600 hover:underline"
            >
              Deseleccionar todos
            </button>
          </div>
          <div>
            <button
              @click="rellenarTodos()"
              class="text-[10px] text-green-600 hover:underline"
            >
              Rellenar seleccionados ({{ totalSelecionados }})
            </button>
          </div>
          <div>
            <button
              @click="exportarJSON()"
              class="text-[10px] text-green-600 hover:underline"
            >
              Exportar a JSON ({{ totalSelecionados }})
            </button>
          </div>
          <div>
            <button
              @click="aplicarFakerFiller()"
              class="text-[10px] text-green-600 hover:underline"
            >
              Aplicar Faker Filler ({{ totalSelecionados }})
            </button>
          </div>
        </div>
      </div>
      
      <div
        v-for="(grupo, formName) in inputsAgrupados"
        :key="formName"
        class="space-y-3"
      >
        <div class="text-[10px] uppercase tracking-wide text-[var(--text-secondary)]">
          {{ formName }}
        </div>

        <div
          v-for="i in grupo"
          :key="i.id"
          class="bg-[var(--bg)] border border-[var(--border)] rounded-lg p-3 space-y-2 transition"
          :class="animando === i.id ? 'ring-2 ring-green-500' : ''"
        >
          <div class="flex justify-between">
            <div class="truncate w-full w-max-1/2 overflow-auto">
              <div class="font-medium">
                {{ i.name || 'Sin nombre' }}
              </div>
              <div class="text-[10px] text-[var(--text-secondary)]">
                {{ i.type }} • {{ i.id || 'sin-id' }}
              </div>
              <div class="text-[10px] truncate max-w-[169px] text-[var(--text-secondary)]">
                id. {{ i.autofillId.slice(0, 30) }}...
              </div>
            </div>

            <div class="flex flex-col gap-2">
                <input type="checkbox" v-model="i.selected" class="accent-[var(--primary)]" />
                <button
                  @click="rellenarInputAnimado(i)"
                  class="text-[10px] text-green-600 hover:underline"
                >
                  Rellenar
                </button>
            </div>

            
          </div>

          <!-- Editor dinámico -->
          <div>
            <template v-if="i.type === 'checkbox'">
              <label class="flex items-center gap-2">
                <input
                  type="checkbox"
                  :checked="i.value"
                  @change="actualizarValor(i, $event)"
                />
                Activado
              </label>
            </template>

            <template v-else-if="i.type === 'select-one' || i.type === 'select-multiple'">
              <select
                :multiple="i.type === 'select-multiple'"
                @change="actualizarValor(i, $event)"
                class="input text-xs"
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
                @input="actualizarValor(i, $event)"
                class="input text-xs"
              />
            </template>
          </div>

        </div>
      </div>
    </section>

  </div>
</template>