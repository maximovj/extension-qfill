<script setup>
import { ref, computed, onMounted, onUnmounted, defineEmits } from "vue";
import { MESSAGE_TYPES, ACTIONS } from "@/constants.config.js";
import { sendMessage } from "@/helpers.config.js";
import db from "../indexedDBManager";
import AlertaConfirmar from "./AlertaConfirmar.vue";
import SeccionDesplegable from "./SeccionDesplegable.vue";

const perfiles = ref([]);
const editar = ref(null);
const alertaConfirmarRef = ref(null);
const modalTitulo = ref("");
const modalMensaje = ref("");

const totalPerfiles = computed(() => perfiles.value?.length);

const fnAccionEditar = (perfil) => {
  editar.value = perfil;
};

const fnAccionGuardar = (perfil) => {
  editar.value = null;
};

const fnAccionVolver = () => {
  editar.value = null;
};

const fnAccionEliminar = async () => {
  modalTitulo.value = "CONFIRMAR";
  modalMensaje.value = "¿SEGURO QUE DESEAS ELIMINAR EL PERFIL?";
  const confirmado = await alertaConfirmarRef.value?.abrir();

  if (confirmado) {
    alert("El usuario aceptó");
  }
};

// Inputs seleccionados
const editarSeleccionados = computed(() =>
  editar.value?.elementos.filter((i) => i.selected),
);

const editarTotalElementos = computed(
  () => editar.value?.elementos?.length || 0,
);

const editarTotalSelecionados = computed(() => editarSeleccionados?.value?.length);

const eliminarPefil = () => {
  alert("Eliminar perfil");
};

const actualizarValor = (input, event) => {
  if (input.type === "checkbox") input.value = event.target.checked;
  else if (input.type === "number" || input.type === "range")
    input.value = Number(event.target.value);
  else if (input.type === "select-multiple")
    input.value = Array.from(event.target.selectedOptions).map(
      (opt) => opt.value,
    );
  else input.value = event.target.value;
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

onMounted(async () => {
  const sendResponse = await sendMessage(
    MESSAGE_TYPES.SYSTEM_EVENT,
    ACTIONS.CONNECT,
  );
  if (sendResponse?.status === "ok") {
    await actualizarEstadosRef();
    editar.value = null;
    db.watchBrodcast(async ({ payload }) => {
      await actualizarEstadosRef();
    }, "perfiles");
  }
});
</script>

<template>
  <div class="space-y-5 text-xs perspective-normal animate-slide-in">
    <AlertaConfirmar
      :titulo="modalTitulo"
      :mensaje="modalMensaje"
      ref="alertaConfirmarRef"
      @aceptar="eliminarPefil"
    />

    <!-- ===================== -->
    <!-- 🟦 MÓDULO : RESULTADOS -->
    <!-- ===================== -->
    <section
      v-if="!editar"
      class="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 space-y-4 max-h-[520px] overflow-y-auto"
    >
      <div class="flex items-center justify-between">
        <h2 class="text-sm font-semibold">Perfiles</h2>
        <span class="text-[10px] text-[var(--text-secondary)]">
          {{ totalPerfiles }} perfiles
        </span>
      </div>

      <div class="space-y-3">
        <div
          v-for="perfil in perfiles"
          :key="perfil?.id"
          v-show="perfil != editar"
          class="bg-[var(--bg)] border border-[var(--border)] rounded-lg p-3 space-y-2 transition"
          :class="'ring-2 ring-green-500'"
        >
          <div class="flex justify-between">
            <div class="truncate w-full w-max-1/2 overflow-auto">
              <div class="flex justify-between gap-2 items-center">
                <span class="font-medium truncate max-w-[200px]">
                  {{ perfil?.nombre || "Sin nombre" }}
                </span>
                <span
                  class="text-[10px] truncate max-w-[200px] text-[var(--text-secondary)]"
                >
                  elementos ({{ perfil?.elementos?.length || 0 }})
                </span>
              </div>
              <div
                class="text-[10px] truncate max-w-[200px] text-[var(--text-secondary)]"
              >
                {{ perfil?.descripcion || "Sin Descripcion" }}
              </div>
              <div
                class="text-[10px] truncate max-w-[200px] text-[var(--text-secondary)]"
              >
                ID. #{{ perfil?.id || "Sin ID" }}
              </div>
            </div>
          </div>

          <div class="flex flex-row gap-2">
            <button class="text-[10px] text-blue-400 hover:underline">
              Cargar
            </button>
            <button
              @click="fnAccionEditar(perfil)"
              class="text-[10px] text-yellow-400 hover:underline"
            >
              Editar
            </button>
            <button
              @click="fnAccionEliminar"
              class="text-[10px] text-red-400 hover:underline"
            >
              Eliminar
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- ===================== -->
    <!-- 🟦 MÓDULO : EDICCION -->
    <!-- ===================== -->
    <section
      v-if="editar"
      class="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 space-y-3"
    >
      <h2 class="text-[12px] font-semibold">
        <span class="text-secondary cursor-pointer" @click="fnAccionVolver"
          >Perfiles</span
        >
        >
        <span class="text-menu-item-active">Modo edición</span>
      </h2>

      <div class="grid grid-cols-1 gap-2">

        <!-- Información del perfil -->
        <SeccionDesplegable titulo="Información del perfil">
          <template v-slot:contenido>
            <div class="m-2">
              <div class="flex flex-col gap-1 justify-center">
                <label class="text-[10px] font-bold" for="nombre"
                  >Nombre:</label
                >
                <input
                  id="nombre"
                  type="text"
                  v-model="editar.nombre"
                  placeholder="Escribe un nombre (obligatorio)"
                  class="input text-xs"
                />
              </div>
              <div class="flex flex-col gap-1 justify-center">
                <label class="text-[10px] font-bold" for="descripcion"
                  >Descripción:</label
                >
                <input
                  id="descripcion"
                  type="text"
                  v-model="editar.descripcion"
                  placeholder="Escribe una descripción (opcional)"
                  class="input text-xs"
                />
              </div>
            </div>
          </template>
        </SeccionDesplegable>

        <!-- Elementos -->
        <SeccionDesplegable :titulo="`Elementos (${editarTotalElementos})`">
          <template v-slot:contenido>
            <!-- Elementos | Acciones -->
            <div v-if="editarTotalElementos > 0" class="grid grid-cols-2 my-2 space-y-2">
              <div>
                <button
                  @click="eliminarTodoEscaneado"
                  class="btn btn-outline-red"
                >
                  Eliminar todos
                </button>
              </div>
              <div></div>
              <div>
                <button
                  @click="cambiarSelectedATodos(true)"
                  class="btn btn-outline-primary"
                >
                  Seleccionar todos
                </button>
              </div>
              <div>
                <button
                  @click="cambiarSelectedATodos(false)"
                  class="btn btn-outline-primary"
                >
                  Deseleccionar todos
                </button>
              </div>
              <div>
                <button
                  @click="aplicarFakerFiller()"
                  class="btn btn-outline-primary"
                >
                  Aplicar Faker Filler ({{ editarTotalSelecionados }})
                </button>
              </div>
              <div>
                <button
                  @click="exportarJSON()"
                  class="btn btn-outline-primary"
                >
                  Exportar a JSON ({{ editarTotalSelecionados }})
                </button>
              </div>
            </div>
            <div v-else>
              <span>No hay elementos</span>
            </div>

            <div class="grid grid-cols-1 gap-2 overflow-y-auto max-h-[260px]">
              <div
                v-for="i in editar?.elementos"
                :key="i.id"
                class="bg-[var(--bg)] border border-[var(--border)] rounded-lg p-3 space-y-2 transition"
              >
                <div class="flex justify-between">
                  <div class="truncate w-full w-max-1/2 overflow-auto">
                    <input
                      type="checkbox"
                      v-model="i.selected"
                      class="accent-[var(--primary)]"
                    />
                    <div class="font-medium">
                      {{ i.name || "Sin nombre" }}
                    </div>
                    <div class="text-[10px] text-[var(--text-secondary)]">
                      {{ i.type }} • {{ i.id || "sin-id" }}
                    </div>
                    <div
                      class="text-[10px] truncate max-w-[169px] text-[var(--text-secondary)]"
                    >
                      id. {{ i.autofillId.slice(0, 30) }}...
                    </div>
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

                  <template
                    v-else-if="
                      i.type === 'select-one' || i.type === 'select-multiple'
                    "
                  >
                    <select
                      :multiple="i.type === 'select-multiple'"
                      @change="actualizarValor(i, $event)"
                      class="input text-xs"
                    >
                      <option
                        v-for="opt in i.options"
                        :key="opt"
                        :value="opt"
                        :selected="
                          i.type === 'select-multiple'
                            ? i.value.includes(opt)
                            : i.value === opt
                        "
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
          </template>
        </SeccionDesplegable>

        <!-- Acciones -->
        <div class="flex gap-2">
          <button
            class="btn btn-outline-green cursor-pointer"
            @click="fnAccionGuardar(editar)"
          >
            Guardar
          </button>
          <button
            class="btn btn-outline-blue cursor-pointer"
            @click="fnAccionGuardar(editar)"
          >
            Cargar
          </button>
          <button
            class="btn btn-outline-red cursor-pointer"
            @click="fnAccionEliminar"
          >
            Eliminar
          </button>
        </div>

      </div>

    </section>
  </div>
</template>
