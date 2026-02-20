<script setup>
import { ref, computed } from "vue"

const search = ref("")
const filtroTipo = ref("all")
const animando = ref(null)

const inputs = ref([]);
const soloVisibles = ref(true); // default: solo inputs visibles
const esEscaneado = ref(false);

const segment = "px-3 py-1 text-[var(--text-secondary)] hover:bg-[var(--bg)] transition";
const activeSegment = "px-3 py-1 bg-[var(--primary)] text-white";

const obtenerInputs = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(
        tabs[0].id,
        { action: 'getInputs', soloVisibles: soloVisibles.value === true }, // forzar booleano
        (response) => { inputs.value = response; }
        );
        esEscaneado.value = true;
    });
};

const rellenarInput = (input) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'fillInput', data: input });
        esEscaneado.value = true;
    });
};

const rellenarTodos = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'fillAllInputs', data: inputs.value });
    });
};

// Actualiza valores editables en tabla
const actualizarValor = (input, event) => {
    if (input.type === 'checkbox') input.value = event.target.checked;
    else if (input.type === 'number' || input.type === 'range') input.value = Number(event.target.value);
    else if (input.type === 'select-multiple') input.value = Array.from(event.target.selectedOptions).map(opt => opt.value);
    else input.value = event.target.value;
};

/* Tipos detectados dinámicamente */
const tiposDisponibles = computed(() => {
  const tipos = new Set(inputs.value.map(i => i.type))
  return ["all", ...tipos]
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

</script>

<template>
  <div class="space-y-4 text-xs">

    <!-- Header -->
    <div class="flex flex-col justify-between">
      <div class="flex items-center gap-2">
        <h1 class="text-sm font-semibold">QFill (Dev)</h1>
        <span class="px-2 py-0.5 rounded-full bg-[var(--primary)] text-white text-[10px]">
          {{ inputsFiltrados.length }}
        </span>
      </div>

      <div class="flex flex-col justify-between h-20">
        <div class="flex bg-[var(--surface)] border border-[var(--border)] rounded-lg overflow-hidden text-xs w-auto">
        <button
          @click="soloVisibles = true"
          :class="soloVisibles ? activeSegment : segment"
        >
          Visibles
        </button>
        <button
          @click="soloVisibles = false"
          :class="!soloVisibles ? activeSegment : segment"
        >
          Todos
        </button>
      </div>

      <button @click="obtenerInputs" class="btn-primary text-xs">
        Escanear
      </button>
      </div>
    </div>

    <!-- Buscador -->
    <input
      v-model="search"
      type="text"
      placeholder="Buscar por name o id..."
      class="input text-xs"
    />

    <!-- Filtro por tipo -->
    <div class="flex gap-2 flex-wrap mt-4">
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

    <!-- Lista agrupada -->
    <div v-if="Object.keys(inputsAgrupados).length"
        class="space-y-4 max-h-[350px] overflow-y-auto pr-1">

      <div
        v-for="(grupo, formName) in inputsAgrupados"
        :key="formName"
        class="space-y-4 p-4"
      >
        <!-- Título del formulario -->
        <div class="text-[10px] uppercase tracking-wide text-[var(--text-secondary)]">
          {{ formName }}
        </div>

        <!-- Inputs -->
        <div
          v-for="i in grupo"
          :key="i.id"
          class="card space-y-4 transition-all duration-300"
          :class="animando === i.id ? 'scale-[1.02] ring-2 ring-green-500' : ''"
        >
          <div class="flex justify-between items-start">
            <div>
              <div class="font-medium">
                {{ i.name || 'Sin nombre' }}
              </div>
              <div class="text-[10px] text-[var(--text-secondary)]">
                {{ i.type }} • {{ i.id || 'sin-id' }}
              </div>
            </div>

            <button
              @click="rellenarInputAnimado(i)"
              class="text-[10px] px-2 py-1 rounded bg-green-600 text-white hover:bg-green-700"
            >
              Rellenar
            </button>
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
    </div>

    <!-- Empty state -->
    <div v-else-if="esEscaneado"
      class="text-center text-[var(--text-secondary)] py-6">
      No se encontraron inputs.
    </div>

  </div>
</template>