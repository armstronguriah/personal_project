
package mil.army.moda.workoutgeneratorproject.model;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class TrainingGoalTest {

    @Test
    void trainingGoals_haveDifferentSetAndRepPrescriptions() {

        assertEquals(4, TrainingGoal.STRENGTH.sets());
        assertEquals(5, TrainingGoal.STRENGTH.reps());

        assertEquals(3, TrainingGoal.HYPERTROPHY.sets());
        assertEquals(10, TrainingGoal.HYPERTROPHY.reps());

        assertEquals(2, TrainingGoal.ENDURANCE.sets());
        assertEquals(15, TrainingGoal.ENDURANCE.reps());

        assertEquals(3, TrainingGoal.HYBRID.sets());
        assertEquals(8, TrainingGoal.HYBRID.reps());
    }
}
