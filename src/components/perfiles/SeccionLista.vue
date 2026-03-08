<script setup>
import { ref, computed, onMounted, onUnmounted, defineEmits } from "vue";
import AlertaConfirmar from "../common/AlertaConfirmar.vue";

// ### !! Props y Emits
const props = defineProps({ });
const emit = defineEmits(["editarElemento"]);

// ### !! Ref
let localState = ref(null);
let messageListener = null;

const perfiles = ref([]);
const editar = ref(null);
const alertaConfirmarRef = ref(null);
const modalTitulo = ref("");
const modalMensaje = ref("");

// ### !! FUNCIONES COMPUTADAS
const totalPerfiles = computed(() => perfiles.value?.length);

// ### !! FUNCIONES
const fnAccionEditar = (perfil) => {
  emit("editarElemento", perfil);
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
    editar.value = null;
  }
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
    <AlertaConfirmar :titulo="modalTitulo" :mensaje="modalMensaje" ref="alertaConfirmarRef" />

    <!-- ===================== -->
    <!-- 🟦 MÓDULO : RESULTADOS -->
    <!-- ===================== -->
    <section
      class="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 space-y-4 max-h-[520px] overflow-y-auto">
      <div class="flex items-center justify-between">
        <h2 class="text-sm font-semibold">Perfiles</h2>
        <span class="text-[10px] text-[var(--text-secondary)]">
          {{ totalPerfiles }} perfiles
        </span>
      </div>

      <div v-if="perfiles?.length <= 0">
        <span>No hay perfiles creadas.</span> <br />
        <span>Escanea para crear un perfil.</span>
      </div>

      <div class="space-y-3">
        <div v-for="perfil in perfiles" :key="perfil?.id" v-show="perfil != editar"
          class="bg-[var(--bg)] border border-[var(--border)] rounded-lg p-3 space-y-2 transition"
          :class="'ring-2 ring-green-500'">
          <div class="flex justify-between">
            <div class="truncate w-full w-max-1/2 overflow-auto">
              <div class="flex justify-between gap-2 items-center">
                <span class="font-medium truncate max-w-[200px]">
                  {{ perfil?.nombre || "Sin nombre" }}
                </span>
                <span class="text-[10px] truncate max-w-[200px] text-[var(--text-secondary)]">
                  elementos ({{ perfil?.elementos?.length || 0 }})
                </span>
              </div>
              <div class="text-[10px] truncate max-w-[200px] text-[var(--text-secondary)]">
                {{ perfil?.descripcion || "Sin Descripcion" }}
              </div>
              <div class="text-[10px] truncate max-w-[200px] text-[var(--text-secondary)]">
                ID. #{{ perfil?.id || "Sin ID" }}
              </div>
            </div>
          </div>

          <div class="flex flex-row gap-2">
            <button class="btn btn-outline-blue">
              Cargar
            </button>
            <button @click="fnAccionEditar(perfil)" class="btn btn-outline-yellow">
              Editar
            </button>
            <button @click="fnAccionEliminar(perfil)" class="btn btn-outline-red">
              Eliminar
            </button>
          </div>
        </div>
      </div>
    </section>
</template>
