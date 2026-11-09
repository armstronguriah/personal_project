
export async function getExercises(filters, signal) {
    const params = new URLSearchParams();

    if (filters.equipment) {
        params.set('equipment', filters.equipment);
    }

    if (filters.primaryMuscle) {
        params.set('primaryMuscle', filters.primaryMuscle);
    }

    if (filters.movementPattern) {
        params.set('movementPattern', filters.movementPattern);
    }

    const queryString = params.toString();

    const url = queryString
        ? `/api/exercises?${queryString}`
        : '/api/exercises';

    const response = await fetch(url, { signal });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }

    return response.json();
}


export async function saveExercise(exercise, editingId) {
    const isEditing = editingId !== null;

    const url = isEditing
        ? `/api/exercises/${editingId}`
        : '/api/exercises';

    const payload = {
        ...exercise,
        movementPattern: exercise.movementPattern || null
    };

    const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const data = await response.json().catch(() => null);

        const error = new Error(
            data?.error || `HTTP ${response.status}`
        );

        error.fieldErrors = data?.errors ?? null;

        throw error;
    }

    return response.json();
}


export async function deleteExercise(id) {
    const response = await fetch(`/api/exercises/${id}`, {
        method: 'DELETE'
    });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }
}


// Local exercise detail and ExerciseDB proxy endpoints.
export async function getExerciseById(exerciseId, signal) {
    const response = await fetch(`/api/exercises/${exerciseId}`, {signal});
    if (!response.ok) throw new Error('Unable to load exercise information.');
    return response.json();
}

export async function findExternalExerciseMatches(exerciseId, signal) {
    const response = await fetch(`/api/exercises/${exerciseId}/external-matches`, {signal});
    if (!response.ok) throw new Error('Unable to search ExerciseDB. Please try again.');
    const results = await response.json();
    if (!Array.isArray(results)) throw new Error('Unexpected ExerciseDB search response.');
    return results;
}

export async function getExternalExerciseDetails(externalId, signal) {
    const response = await fetch(`/api/exercises/external/${encodeURIComponent(externalId)}`, {signal});
    if (!response.ok) throw new Error('Unable to load the selected exercise details.');
    const result = await response.json();
    if (!result || result.exerciseId !== externalId) {
        throw new Error('ExerciseDB returned unexpected exercise details.');
    }
    return result;
}
