// Format both new cardio prescriptions and older resistance-only saved programs.
export function isCardioExercise(exercise) {
    return exercise?.prescriptionType === 'DURATION' ||
        exercise?.prescriptionType === 'INTERVALS';
}

export function formatWorkoutPrescription(exercise) {
    if (exercise?.prescriptionType === 'DURATION') {
        return `${exercise.durationMinutes ?? '—'} min steady cardio`;
    }
    if (exercise?.prescriptionType === 'INTERVALS') {
        const rounds = exercise.rounds ?? '—';
        const work = exercise.workSeconds ?? '—';
        const rest = exercise.restSeconds ?? '—';
        const duration = exercise.durationMinutes ? ` · ~${exercise.durationMinutes} min total` : '';
        return `${rounds} rounds · ${work}s work / ${rest}s recovery${duration}`;
    }
    return `${exercise.sets} sets × ${exercise.reps} reps`;
}
