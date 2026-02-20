import isVisible from './isVisible';

export default function getAllInputs(soloVisibles = false) {
    const inputs = Array.from(document.querySelectorAll('input, textarea, select'));
    console.log("inputs =>", inputs);

    return inputs
        .filter(el => !soloVisibles || isVisible(el))
        .map(el => {
        let value;
        switch (el.type) {
            case 'checkbox': value = el.checked; break;
            case 'radio': value = el.checked ? el.value : null; break;
            case 'select-one': value = el.options[el.selectedIndex]?.value || null; break;
            case 'select-multiple': value = Array.from(el.selectedOptions).map(opt => opt.value); break;
            case 'number':
            case 'range': value = el.valueAsNumber; break;
            default: value = el.value;
        }

        let options = null;
        if (el.tagName.toLowerCase() === 'select') {
            options = Array.from(el.options).map(opt => opt.value);
        }

        return {
            id: el.id || null,
            name: el.name || null,
            type: el.type || el.tagName.toLowerCase(),
            value,
            options
        };
        });
}