<script setup>
import { ref } from 'vue';

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
</script>

<template>
  <div class="space-y-4">

    <!-- Header -->
    <div class="flex justify-between items-center">
      <h1 class="text-sm font-semibold">Input Scanner</h1>

      <div class="flex bg-[var(--surface)] border border-[var(--border)] rounded-lg overflow-hidden text-xs">
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
    </div>

    <!-- Actions -->
    <div class="flex gap-2">
      <button
        @click="obtenerInputs"
        class="btn-primary flex-1"
      >
        Escanear
      </button>

      <button
        v-if="esEscaneado && inputs.length"
        @click="rellenarTodos"
        class="btn-secondary"
      >
        Rellenar todo
      </button>
    </div>

    <!-- Lista -->
    <div v-if="inputs?.length" class="space-y-3 max-h-[350px] overflow-y-auto pr-1">

      <div
        v-for="(i, idx) in inputs"
        :key="idx"
        class="card space-y-2"
      >
        <!-- Info -->
        <div class="flex justify-between text-xs">
          <div>
            <div class="font-medium text-[var(--text-primary)]">
              {{ i.name || 'Sin nombre' }}
            </div>
            <div class="text-[var(--text-secondary)]">
              {{ i.type }} • {{ i.id || 'sin-id' }}
            </div>
          </div>

          <button
            @click="rellenarInput(i)"
            class="text-xs px-2 py-1 rounded bg-green-600 text-white hover:bg-green-700"
          >
            Rellenar
          </button>
        </div>

        <!-- Editor -->
        <div>
          <template v-if="i.type === 'checkbox'">
            <label class="flex items-center gap-2 text-xs">
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

    <!-- Empty state -->
    <div v-else-if="esEscaneado" class="text-xs text-[var(--text-secondary)] text-center py-6">
      No se encontraron inputs en esta página.
    </div>

  </div>
</template>