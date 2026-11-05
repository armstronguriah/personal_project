
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

