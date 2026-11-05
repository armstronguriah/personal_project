
package mil.army.moda.workoutgeneratorproject.repository;

import mil.army.moda.workoutgeneratorproject.model.SavedProgram;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SavedProgramRepository
        extends JpaRepository<SavedProgram, Long> {

    List<SavedProgram> findAllByOrderByCreatedAtDesc();
}
