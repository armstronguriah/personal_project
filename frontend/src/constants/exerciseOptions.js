
export const EQUIPMENT_OPTIONS = [
    'Barbell',
    'Dumbbell',
    'Bodyweight',
    'Cable',
    'Machine',
    'Kettlebell',
    'Resistance Band'
];

export const MUSCLE_OPTIONS = [
    'Chest',
    'Back',
    'Shoulders',
    'Quadriceps',
    'Hamstrings',
    'Glutes',
    'Biceps',
    'Triceps',
    'Calves',
    'Core'
];

export const MOVEMENT_OPTIONS = [
    { value: 'SQUAT', label: 'Squat' },
    { value: 'HINGE', label: 'Hinge' },
    { value: 'LUNGE', label: 'Lunge' },
    { value: 'HORIZONTAL_PUSH', label: 'Horizontal Push' },
    { value: 'VERTICAL_PUSH', label: 'Vertical Push' },
    { value: 'HORIZONTAL_PULL', label: 'Horizontal Pull' },
    { value: 'VERTICAL_PULL', label: 'Vertical Pull' },
    { value: 'CORE', label: 'Core' },
    { value: 'CARRY', label: 'Carry' },
    { value: 'ISOLATION', label: 'Isolation' },
    { value: 'CARDIO_STEADY', label: 'Steady Cardio' },
    { value: 'CARDIO_INTERVALS', label: 'Cardio Intervals' }
];
export const EQUIPMENT_PRESETS = {
    BODYWEIGHT: ['Bodyweight'],

    DUMBBELL: ['Dumbbell', 'Bodyweight'],

    BARBELL: ['Barbell', 'Bodyweight'],

    FULL_GYM: EQUIPMENT_OPTIONS
};