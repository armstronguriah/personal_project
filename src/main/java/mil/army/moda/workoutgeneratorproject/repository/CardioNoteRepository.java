package mil.army.moda.workoutgeneratorproject.repository;

import mil.army.moda.workoutgeneratorproject.model.CardioNote;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CardioNoteRepository extends JpaRepository<CardioNote, Long> {
    List<CardioNote> findBySavedProgram_IdAndSessionNumber(Long programId, int sessionNumber);
    long deleteBySavedProgram_IdAndSessionNumber(Long programId, int sessionNumber);
}
