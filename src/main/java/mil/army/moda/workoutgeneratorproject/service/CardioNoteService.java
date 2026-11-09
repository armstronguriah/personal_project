package mil.army.moda.workoutgeneratorproject.service;

import mil.army.moda.workoutgeneratorproject.model.CardioNote;
import mil.army.moda.workoutgeneratorproject.model.SavedProgram;
import mil.army.moda.workoutgeneratorproject.model.WorkoutDay;
import mil.army.moda.workoutgeneratorproject.model.WorkoutExercise;
import mil.army.moda.workoutgeneratorproject.repository.CardioNoteRepository;
import mil.army.moda.workoutgeneratorproject.repository.SavedProgramRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.databind.json.JsonMapper;

import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class CardioNoteService {
    private final CardioNoteRepository notesRepository;
    private final SavedProgramRepository programRepository;
    private final JsonMapper jsonMapper;

    public CardioNoteService(CardioNoteRepository notesRepository,
                             SavedProgramRepository programRepository,
                             JsonMapper jsonMapper) {
        this.notesRepository = notesRepository;
        this.programRepository = programRepository;
        this.jsonMapper = jsonMapper;
    }

    @Transactional(readOnly = true)
    public Map<Long, String> getNotes(Long programId, int sessionNumber) {
        // Validate program and session before returning any notes.
        findSession(findProgram(programId), sessionNumber);

        Map<Long, String> notes = new HashMap<>();
        for (CardioNote note : notesRepository.findBySavedProgram_IdAndSessionNumber(programId, sessionNumber)) {
            notes.put(note.getExerciseId(), note.getNotes());
        }
        return notes;
    }

    @Transactional
    public Map<Long, String> saveNotes(Long programId, int sessionNumber, Map<Long, String> notes) {
        SavedProgram program = findProgram(programId);
        WorkoutDay session = findSession(program, sessionNumber);

        Set<Long> cardioIds = session.exercises().stream()
                .filter(WorkoutExercise::isCardio)
                .map(WorkoutExercise::exerciseId)
                .collect(Collectors.toSet());

        for (Map.Entry<Long, String> entry : notes.entrySet()) {
            if (!cardioIds.contains(entry.getKey())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Exercise is not cardio in this session");
            }
            if (entry.getValue() == null || entry.getValue().length() > 1000) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Cardio notes must be at most 1000 characters");
            }
        }

        // Replace the session's notes, so clearing a field also clears it in the DB.
        notesRepository.deleteBySavedProgram_IdAndSessionNumber(programId, sessionNumber);
        notesRepository.flush();

        for (Map.Entry<Long, String> entry : notes.entrySet()) {
            if (!entry.getValue().isBlank()) {
                notesRepository.save(new CardioNote(
                        program, sessionNumber, entry.getKey(), entry.getValue().trim()
                ));
            }
        }
        return getNotes(programId, sessionNumber);
    }

    private SavedProgram findProgram(Long programId) {
        return programRepository.findById(programId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Saved program not found"));
    }

    private WorkoutDay findSession(SavedProgram program, int sessionNumber) {
        WorkoutDay[] schedule = jsonMapper.readValue(program.getScheduleJson(), WorkoutDay[].class);
        return Arrays.stream(schedule)
                .filter(day -> day.sessionNumber() == sessionNumber)
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Workout session not found"));
    }
}
