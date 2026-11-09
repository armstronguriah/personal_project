// Backend calls for generated and saved programs. No React state lives here.
const SAVED_PROGRAMS_URL = '/api/programs/saved';

export async function getSavedPrograms(signal) {
    const response = await fetch(SAVED_PROGRAMS_URL, {signal});
    if (!response.ok) throw new Error('Unable to load saved programs.');
    const data = await response.json();
    if (!Array.isArray(data)) throw new Error('Unexpected program response.');
    return data;
}

export async function generateWorkoutProgram(request) {
    const response = await fetch('/api/programs/generate', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(request)
    });
    if (!response.ok) throw new Error('Failed to generate workout program.');
    const schedule = await response.json();
    if (!Array.isArray(schedule)) throw new Error('Unexpected workout program response.');
    return schedule;
}

export async function saveWorkoutProgram(program) {
    const response = await fetch(SAVED_PROGRAMS_URL, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(program)
    });
    if (!response.ok) throw new Error('Unable to save workout program.');
    return response.json();
}

export async function deleteSavedProgram(programId) {
    const response = await fetch(`${SAVED_PROGRAMS_URL}/${programId}`, {method: 'DELETE'});
    if (!response.ok) throw new Error('Unable to delete workout program.');
}

export async function setSessionCompletion(programId, sessionNumber, shouldComplete) {
    const response = await fetch(
        `${SAVED_PROGRAMS_URL}/${programId}/sessions/${sessionNumber}/completion`,
        {method: shouldComplete ? 'PUT' : 'DELETE'}
    );
    if (!response.ok) throw new Error('Unable to update workout completion.');
    return response.json();
}

export async function swapSavedExercise(programId, sessionNumber, exerciseId, replacementId) {
    const response = await fetch(
        `${SAVED_PROGRAMS_URL}/${programId}/sessions/${sessionNumber}/exercises/${exerciseId}`,
        {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({replacementExerciseId: replacementId})
        }
    );
    if (!response.ok) throw new Error('Unable to save exercise replacement.');
    return response.json();
}
