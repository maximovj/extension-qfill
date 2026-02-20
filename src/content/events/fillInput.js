export default function fillInput(el, value) {
    if (!el) return;
    switch (el.type) {
        case 'checkbox': el.checked = !!value; break;
        case 'radio': if (el.value === value) el.checked = true; break;
        case 'select-one': el.value = value; break;
        case 'select-multiple':
        Array.from(el.options).forEach(opt => opt.selected = value.includes(opt.value));
        break;
        case 'number':
        case 'range': el.valueAsNumber = Number(value); break;
        default: el.value = value;
    }
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
}