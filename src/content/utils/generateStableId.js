export default function generateStableId(el) {
    const path = [];
    while (el && el.parentElement) {
        const siblings = Array.from(el.parentElement.children);
        const index = siblings.indexOf(el);
        path.unshift(`${el.tagName.toLowerCase()}:nth-child(${index + 1})`);
        el = el.parentElement;
    }
    return 'af-' + btoa(path.join('>'));
}