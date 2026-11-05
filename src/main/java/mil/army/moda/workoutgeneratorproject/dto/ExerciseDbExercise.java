
package mil.army.moda.workoutgeneratorproject.dto;

import java.util.List;

public record ExerciseDbExercise(
        String exerciseId,
        String name,
        String gifUrl,
        List<String> targetMuscles,
        List<String> secondaryMuscles,
        List<String> bodyParts,
        List<String> equipments,
        List<String> instructions
) {
}
