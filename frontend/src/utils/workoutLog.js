// Stable key used to associate inputs with a particular exercise set.
export function entryKey(exerciseId, setNumber) {
    return `${exerciseId}:${setNumber}`;
}
