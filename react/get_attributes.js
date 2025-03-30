// Parse all props on a DOM element into a dictionary, and return them.
// Based on https://github.com/liron-navon/slate-react-starter/blob/master/src/react/mountReact.jsx


// Parse the attributes on a DOM element into a dictionary.
// This allows us to relatively easily take data from the DOM (as rendered by Shopify/Liquid) into React.
export default function getAttributes(el) {
    // Turn the nodelist into an array using Array.slice()...
    let attr_array = Array.prototype.slice.call(el.attributes);

    // ...then into an object using Array.reduce().
    return attr_array.reduce((acc, attributeNode) => {
        let name = attributeNode.nodeName;
        let value = attributeNode.nodeValue.trim();

        // Skip certain core attributes.
        if (name === "id" || name === "class") {
            return acc;
        }

        // Ensure objects or arrays are parsed correctly.
        if (value.charAt(0) === '{' && value.charAt(value.length - 1) === '}') {
            value = JSON.parse(value);
        } else if (value.charAt(0) === '[' && value.charAt(value.length - 1) === ']') {
            value = JSON.parse(value);
        }

        acc[name] = value;
        return acc;
    }, {});
}
