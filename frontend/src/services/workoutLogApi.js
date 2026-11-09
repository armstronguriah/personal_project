// Backend calls for recorded lifting sets and cardio notes.
function sessionUrl(programId, sessionNumber) {
    return `/api/programs/saved/${programId}/sessions/${sessionNumber}`;
}

export async function getSessionLogs(programId, sessionNumber, signal) {
    const url = sessionUrl(programId, sessionNumber);
    const [setsResponse, notesResponse] = await Promise.all([
        fetch(`${url}/sets`, {signal}),
        fetch(`${url}/cardio-notes`, {signal})
    ]);
    if (!setsResponse.ok || !notesResponse.ok) {
        throw new Error('Unable to load workout log.');
    }
    const [sets, notes] = await Promise.all([setsResponse.json(), notesResponse.json()]);
    if (!Array.isArray(sets) || !notes || Array.isArray(notes) || typeof notes !== 'object') {
        throw new Error('Unexpected workout log response.');
    }
    return {sets, notes};
}

export async function saveResistanceSets(programId, sessionNumber, sets) {
    const response = await fetch(`${sessionUrl(programId, sessionNumber)}/sets`, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({sets})
    });
    if (!response.ok) throw new Error('Unable to save workout log.');
    return response.json();
}

export async function saveCardioNotes(programId, sessionNumber, notes) {
    const response = await fetch(`${sessionUrl(programId, sessionNumber)}/cardio-notes`, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({notes})
    });
    if (!response.ok) {
        throw new Error('Set logs saved, but cardio notes could not be saved. Try saving again.');
    }
    return response.json();
}
