import mapElementToInputObject from '../utils/mapElementToInputObject';
import { MESSAGE_TYPES, ACTIONS } from '../../constants.config.js'
import { sendMessage } from '../../helpers.config.js'

let elementoActual = null;
let overlay = null;
let selectorActivo = false;

export default function selectElementEnable() {

  if (selectorActivo) return; // evita doble activación
  selectorActivo = true;

  // Crear overlay visual (NO tocamos estilos del elemento)
  overlay = document.createElement("div");
  overlay.style.position = "fixed";
  overlay.style.zIndex = "999999";
  overlay.style.pointerEvents = "none";
  overlay.style.border = "2px solid #00ff88";
  overlay.style.backgroundColor = "rgba(0,255,136,0.1)";
  document.body.appendChild(overlay);

  const highlight = (el) => {
    if (!el || el === overlay) return;

    elementoActual = el;

    const rect = el.getBoundingClientRect();

    overlay.style.top = rect.top + "px";
    overlay.style.left = rect.left + "px";
    overlay.style.width = rect.width + "px";
    overlay.style.height = rect.height + "px";
  };

  const mouseMoveHandler = (e) => {
    highlight(e.target);
  };

  const clickHandler = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    limpiar();

    if (elementoActual) {
      const data = mapElementToInputObject(elementoActual);

      const response = await sendMessage(
        MESSAGE_TYPES.UI_EVENT,
        ACTIONS.SELECTOR_MODE_SET_ITEM,
        {
          data
        }
      );

    }
  };

  const limpiar = () => {
    document.removeEventListener("mousemove", mouseMoveHandler, true);
    document.removeEventListener("click", clickHandler, true);

    overlay?.remove();
    overlay = null;
    selectorActivo = false;
  };

  document.addEventListener("mousemove", mouseMoveHandler, true);
  document.addEventListener("click", clickHandler, true);
};