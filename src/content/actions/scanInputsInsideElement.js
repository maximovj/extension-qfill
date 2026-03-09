import isVisible from '../utils/isVisible';
import mapElementToInputObject from '../utils/mapElementToInputObject';

export default function scanInputsInsideElement(element, soloVisibles = false) {
    if (!element) return [];

    const elements = Array.from(
        element.querySelectorAll("input, textarea, select")
    );

    return elements
        .filter(el => !soloVisibles || isVisible(el))
        .map((el, index) => mapElementToInputObject(el, index));
}