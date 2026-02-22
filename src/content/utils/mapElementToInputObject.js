import generateStableId from './generateStableId';

export default function mapElementToInputObject(el, index = 0) {
    // 🔥 Generar ID estable
    if (!el.dataset.autofillId) {
        el.dataset.autofillId = generateStableId(el);
    }

    let value;

    if (el.tagName.toLowerCase() === 'select') {
        if (el.multiple) {
        value = Array.from(el.selectedOptions).map(opt => opt.value);
        } else {
        value = el.value;
        }
    } else if (el.type === 'checkbox') {
        value = el.checked;
    } else if (el.type === 'radio') {
        value = el.checked ? el.value : null;
    } else if (el.type === 'number' || el.type === 'range') {
        value = el.valueAsNumber;
    } else if (el.isContentEditable) {
        value = el.innerText;
    } else {
        value = el.value ?? el.innerText ?? null;
    }

    let options = null;
    if (el.tagName.toLowerCase() === 'select') {
        options = Array.from(el.options).map(opt => opt.value);
    }

    return {
        autofillId: el.dataset.autofillId,
        id: el.id || null,
        name: el.name || null,
        type: el.type || el.tagName.toLowerCase(),
        value,
        options,
        selected: true,
    };
}