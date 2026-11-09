// Turn backend enum names like FULL_BODY into readable labels.
export function formatWorkoutType(value) {
    return (value ?? '')
        .replaceAll('_', ' ')
        .toLowerCase()
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
