export default function fillElementById(autofillId, value) {
    try {
        const el = document.querySelector(`[data-autofill-id="${autofillId}"]`);
        if (!el) return;

        if (el.isContentEditable) {
            el.textContent = value;
        }

        else if (el.tagName === 'TEXTAREA') {
            el.value = value;
        }

        else if (el.tagName === 'SELECT') {
            if (el.multiple) {
                Array.from(el.options).forEach(opt => {
                    opt.selected = value.includes(opt.value);
                });
            } else {
                el.value = value;
            }
        }

        else if (el.tagName === 'INPUT') {
            switch (el.type) {
                case 'checkbox':
                    el.checked = !!value;
                    break;

                case 'radio':
                    if (el.value === value) el.checked = true;
                    break;

                case 'number':
                case 'range':
                    el.valueAsNumber = Number(value);
                    break;

                case 'file':
                    return;

                default:
                    el.value = value;
            }
        }

        // 🔥 Cualquier otro elemento HTML
        else {
            el.textContent = value;
        }

        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));

    } catch (error) {
        console.error(error);
    }
}