// @vitest-environment jsdom

import { test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import GeneratedWorkout from '../GeneratedWorkout';

test('displays generated workout exercises', () => {
    const schedule = [
        {
            sessionNumber: 1,
            workoutType: 'FULL_BODY',
            exercises: [
                {
                    exerciseId: 1,
                    exerciseName: 'Goblet Squat',
                    sets: 3,
                    reps: 8
                }
            ]
        }
    ];

    render(<GeneratedWorkout schedule={schedule} />);

    expect(screen.getByText('Goblet Squat')).toBeTruthy();

    expect(screen.getByRole('heading', {
        name: 'Session 1 — Full Body'
    })).toBeTruthy();

    expect(screen.getByText('8')).toBeTruthy();
});
