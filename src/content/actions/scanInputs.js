import isVisible from '../utils/isVisible';
import mapElementToInputObject from '../utils/mapElementToInputObject';

export default function scanInputs(soloVisibles = false) {
    const elements = Array.from(
        document.querySelectorAll('input, textarea, select')
    );

    return elements
        .filter(el => !soloVisibles || isVisible(el))
        .map((el, index) => mapElementToInputObject(el, index));
}