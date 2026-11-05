
package mil.army.moda.workoutgeneratorproject.repository;

import mil.army.moda.workoutgeneratorproject.model.WorkoutSetLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface WorkoutSetLogRepository
        extends JpaRepository<WorkoutSetLog, Long> {

    List<WorkoutSetLog>
    findBySavedProgram_IdAndSessionNumberOrderByExerciseIdAscSetNumberAsc(
            Long programId,
            int sessionNumber
    );

    long deleteBySavedProgram_IdAndSessionNumber(
            Long programId,
            int sessionNumber
    );
}
