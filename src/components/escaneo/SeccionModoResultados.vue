<script setup>
import { ref, computed, onMounted, onUnmounted, defineEmits } from "vue"
import { MESSAGE_TYPES, ACTIONS } from '@/constants.config.js'
import { sendMessage, sendToBackground } from '@/helpers.config.js'
import generarFakeValue from '../../sidepanel/utils/generarFakeValue';
import generarPerfilFake from '../../sidepanel/utils/generarPerfilFake';
import db from "../../indexedDBManager";
import SeccionDesplegable from "../common/SeccionDesplegable.vue";

const props = defineProps({
  sectionVisible: String,
});

const emit = defineEmits(["nuevoPerfil", "update:sectionVisible"]);

// 
let localState = ref(null);
let messageListener = null;

const configuracion = ref(null);
const search = ref("")
const filtroTipo = ref("all")
const animando = ref(null)

const inputs = ref([]);
const modoEscaneo = ref("visibles"); // valores: "visibles" | "todos" | "json" | "selector"
const esEscaneado = ref(false);

const modoSelector = ref(false);
const modoSelectorAccion = ref('agregar'); // valores: "agregar" | "nuevo" | "escanear"
const nombreArchivoJson = ref(null)
const successJson = ref(null);

// !! FUNCIONES COMPUTADAS

// Inputs seleccionados
const inputsSeleccionados = computed(() => inputs.value.filter(i => i.selected));

// Cantidad de seleccionados
const totalSelecionados = computed(() => {
  const cantidad = inputs.value.filter(i => i.selected)?.length || 0;
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

    if (filtroTipo.value === "id") {
      return filtroTipo.value === "id" && i.id !== null;
    }

    if (filtroTipo.value === "name") {
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

const eliminarTodoEscaneado = async () => {
  inputs.value = [];
  nombreArchivoJson.value = null;
  successJson.value = null;
  emit("update:sectionVisible", "escaneo");

  await persistirConfig();
  await cargarConfiguracion();
}

const aplicarFakerFiller = async () => {
  const perfil = generarPerfilFake();
  inputs.value = inputs.value.map(i => ({
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

const crearPerfil = async () => {
  const { nextId } = await db.getIdInfo("perfiles");
  const nuevoPerfil = await chrome.runtime.sendMessage({
    type: "DISPATCH",
    action: {
      type: "PERFIL_CREATE",
      payload: {
        nombre: "Perfil #" + (nextId),
        descripcion: (inputsSeleccionados.value?.length) + " elementos disponibles",
        elementos: inputsSeleccionados.value,
        creado: Date().now,
        actualizado: Date().now,
      },
    }
  });

  emit("nuevoPerfil", nuevoPerfil);
}

const cambiarSelectedATodos = async (x) => {
  inputs.value = inputs.value.map(item => ({ ...item, selected: x }));

  await persistirConfig();
  await cargarConfiguracion();
}

const quitarValores = async () => {
  inputs.value = inputs.value.map(item => {
    if (!item?.selected) return item;
    return { ...item, value: null }
  });

  await persistirConfig();
  await cargarConfiguracion();
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
      }
    }
  });
}

const fnVerEscaneo = () => {
  emit("update:sectionVisible", "escaneo");
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
  modoEscaneo.value = configuracion.value?.modo || "visibles";
  modoSelector.value = configuracion.value?.selectorActivado || false;
  modoSelectorAccion.value = configuracion.value?.selectorAccion || "agregar";
}

// CHANGE: Eliminar este método de prueba
const test = async () => {

}

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
    <section
      class="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 space-y-4 max-h-[580px] overflow-y-auto">

      <!-- header -->
      <h2 class="text-[12px] font-semibold">
        <span class="text-secondary cursor-pointer" @click="fnVerEscaneo">Escaneo</span>
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

      <p v-if="Object.keys(inputsAgrupados)?.length <= 0">
        No hay elementos escaneados.
        Escanea la página en <span class="font-medium cursor-pointer underline" @click="fnVerEscaneo">Escaneo</span>
      </p>

      <template v-if="Object.keys(inputsAgrupados)?.length">

        <!-- ===================== -->
        <!-- FILTROS -->
        <!-- ===================== -->

        <SeccionDesplegable titulo="Acciones">
          <template v-slot:contenido>
            <div class="grid gap-1 mb-2">

              <input v-model="search" type="text" placeholder="Buscar por name o id..." class="input w-full" />

              <div class="flex gap-1 flex-wrap">

                <button v-for="tipo in tiposDisponibles" :key="tipo" @click="filtroTipo = tipo" :class="[
                  'px-2 py-1 rounded-md border text-[10px] transition',
                  filtroTipo === tipo
                    ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                    : 'border-[var(--border)] text-[var(--text-secondary)]'
                ]">
                  {{ tipo }}
                </button>

              </div>

            </div>

            <!-- ===================== -->
            <!-- ACCIONES -->
            <!-- ===================== -->

            <div class="space-y-2">

              <div class="grid grid-cols-2 gap-2">

                <button @click="cambiarSelectedATodos(true)" class="btn btn-outline-primary w-full">
                  Seleccionar
                </button>

                <button @click="cambiarSelectedATodos(false)" class="btn btn-outline-primary w-full">
                  Ninguno
                </button>

                <button @click="aplicarFakerFiller()" class="btn btn-outline-primary w-full">
                  Faker
                </button>

                <button @click="quitarValores()" class="btn btn-outline-primary w-full">
                  Vaciar
                </button>

                <button @click="crearPerfil" class="btn btn-outline-primary col-span-2 w-full">
                  Crear perfil
                </button>

              </div>

            </div>


          </template>
        </SeccionDesplegable>

        <!-- ===================== -->
        <!-- INPUTS -->
        <!-- ===================== -->

        <div v-for="(grupo, formName) in inputsAgrupados" :key="formName"
          class="max-h-[350px] overflow-y-auto space-y-1 space-y-3">

          <div class="text-[10px] uppercase tracking-wide text-[var(--text-secondary)]">
            {{ formName }}
          </div>

          <div v-for="i in grupo" :key="i.id"
            class="bg-[var(--bg)] border border-[var(--border)] rounded-lg p-3 space-y-2 transition hover:border-[var(--primary)] hover:shadow-sm"
            :class="animando === i.id ? 'ring-2 ring-green-500 animate-pulse' : ''">

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
                  id. {{ i.autofillId.slice(0, 30) }}...
                </div>

              </div>

              <div class="flex flex-col items-center gap-2">

                <input type="checkbox" v-model="i.selected" class="accent-[var(--primary)]" />

                <button @click="rellenarInputAnimado(i)" class="btn btn-outline-green text-[10px]">
                  Rellenar
                </button>

              </div>

            </div>

            <!-- editor -->

            <div>

              <template v-if="i.type === 'checkbox'">

                <label class="flex items-center gap-2">
                  <input type="checkbox" :checked="i.value" @change="actualizarValor(i, $event)" />
                  Activado
                </label>

              </template>

              <template v-else-if="i.type === 'select-one' || i.type === 'select-multiple'">

                <select :multiple="i.type === 'select-multiple'" @change="actualizarValor(i, $event)"
                  class="input text-xs w-full">

                  <option v-for="opt in i.options" :key="opt" :value="opt" :selected="i.type === 'select-multiple'
                    ? i.value.includes(opt)
                    : i.value === opt">
                    {{ opt }}
                  </option>

                </select>

              </template>

              <template v-else>

                <input type="text" :value="i.value" @input="actualizarValor(i, $event)" class="input text-xs w-full" />

              </template>

            </div>

          </div>

        </div>

        <!-- ===================== -->
        <!-- ZONA PELIGROSA -->
        <!-- ===================== -->

        <div class="grid grid-cols-3 gap-2 border-t border-[var(--border)] pt-3">

          <button @click="eliminarTodoEscaneado" class="btn btn-outline-red w-full">
            Eliminar todos
          </button>

          <button @click="rellenarTodos()" class="btn btn-outline-primary w-full">
            Rellenar
          </button>

          <button @click="exportarJSON()" class="btn btn-outline-primary w-full">
            Exportar JSON
          </button>

        </div>
      </template>
    </section>
  </div>
</template>
