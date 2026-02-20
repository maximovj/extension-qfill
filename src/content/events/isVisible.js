export default function isVisible(el) {
    // Algunos inputs pueden estar ocultos por CSS
    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden') return false;

    // También verificar tamaño real en la página
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return false;

    return true;
}