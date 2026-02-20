<script setup>
import { ref, computed } from "vue"
import extConfig from '@/extension.config.js'

const search = ref("")
const filtroTipo = ref("all")
const animando = ref(null)

const inputs = ref([]);
const soloVisibles = ref(true); // default: solo inputs visibles
const esEscaneado = ref(false);

const segment = "px-3 py-1 text-[var(--text-secondary)] hover:bg-[var(--bg)] transition";
const activeSegment = "px-3 py-1 bg-[var(--primary)] text-white";

const obtenerInputs = () => {
    filtroTipo.value = 'all';
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

</script>

<template>
  <div class="space-y-5 text-xs">

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

      <button @click="obtenerInputs" class="btn-primary w-full">
        Escanear página
      </button>
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
      <div class="flex flex-col">
        <div class="flex justify-between items-center">
          <h2 class="text-sm font-semibold">
            Resultados ({{ inputsFiltrados?.length }})
          </h2>
        </div>
        <div>
          <button
            @click="rellenarTodos()"
            class="text-[10px] text-green-600 hover:underline"
          >
            Rellenar Todos
          </button>
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
              class="text-[10px] text-green-600 hover:underline"
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
    </section>

  </div>
</template>