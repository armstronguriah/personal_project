
package mil.army.moda.workoutgeneratorproject.service;

import mil.army.moda.workoutgeneratorproject.dto.*;
import mil.army.moda.workoutgeneratorproject.model.*;
import mil.army.moda.workoutgeneratorproject.repository.ExerciseRepository;
import mil.army.moda.workoutgeneratorproject.repository.SavedProgramRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.transaction.annotation.Transactional;

import tools.jackson.databind.json.JsonMapper;

import mil.army.moda.workoutgeneratorproject.repository.ExerciseRepository;
import mil.army.moda.workoutgeneratorproject.model.Exercise;
import mil.army.moda.workoutgeneratorproject.model.WorkoutDay;
import mil.army.moda.workoutgeneratorproject.model.WorkoutExercise;
import mil.army.moda.workoutgeneratorproject.dto.GenerateProgramRequest;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Objects;

import java.util.Arrays;
import java.util.List;

@Service
public class SavedProgramService {

    private final SavedProgramRepository repository;
    private final JsonMapper jsonMapper;
    private final ExerciseRepository exerciseRepository;

    public SavedProgramService(
            SavedProgramRepository repository,
            JsonMapper jsonMapper,
            ExerciseRepository exerciseRepository
    ) {
        this.repository = repository;
        this.jsonMapper = jsonMapper;
        this.exerciseRepository = exerciseRepository;
    }

    public SavedProgramResponse save(SaveProgramRequest request) {

        int programWeeks =
                request.preferences().programWeeks() == null
                        ? 1
                        : request.preferences().programWeeks();

        int expectedSessions =
                request.preferences().trainingDays() * programWeeks;

        if (request.schedule().size() != expectedSessions) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Schedule must contain " + expectedSessions + " sessions"
            );
        }

        SavedProgram saved = repository.save(
                new SavedProgram(
                        request.name(),
                        jsonMapper.writeValueAsString(
                                request.preferences()
                        ),
                        jsonMapper.writeValueAsString(
                                request.schedule()
                        )
                )
        );

        return toResponse(saved);
    }

    public List<SavedProgramResponse> getAll() {
        return repository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::toResponse) // transforms saved entities into response object for react
                .toList();
    }

    public SavedProgramResponse getById(Long id) {
        SavedProgram program = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Saved program not found"
                ));

        return toResponse(program);
    }

    private SavedProgramResponse toResponse(SavedProgram program) {

        GenerateProgramRequest preferences = jsonMapper.readValue( //converts JSON back into objects
                program.getPreferencesJson(),
                GenerateProgramRequest.class
        );

        WorkoutDay[] workouts = jsonMapper.readValue( //converts JSON back into objects
                program.getScheduleJson(),
                WorkoutDay[].class
        );

        return new SavedProgramResponse(
                program.getId(),
                program.getName(),
                preferences,
                List.copyOf(Arrays.asList(workouts)),
                program.getCreatedAt(),
                program.getCompletedSessions()
                        .stream()
                        .sorted()
                        .toList()
        );
    }

    @Transactional
    public SavedProgramResponse setSessionCompleted(
            Long programId,
            int sessionNumber,
            boolean completed
    ) {
        SavedProgram program = repository.findById(programId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Saved program not found"
                ));

        WorkoutDay[] workouts = jsonMapper.readValue(
                program.getScheduleJson(),
                WorkoutDay[].class
        );

        boolean sessionExists = Arrays.stream(workouts)
                .anyMatch(workout ->
                        workout.sessionNumber() == sessionNumber
                );

        if (!sessionExists) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Session does not exist in this program"
            );
        }

        if (completed) {
            program.markSessionCompleted(sessionNumber);
        } else {
            program.undoSessionCompletion(sessionNumber);
        }

        return toResponse(repository.save(program));
    }

    @Transactional
    public void deleteProgram(Long programId) {
        SavedProgram program = repository.findById(programId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Saved program not found"
                ));

        repository.delete(program);
    }


    @Transactional
    public SavedProgramResponse swapExercise(
            Long programId,
            int sessionNumber,
            Long currentExerciseId,
            Long replacementExerciseId
    ) {
        // 1. Find the saved program
        SavedProgram program = repository.findById(programId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Saved program not found"
                ));

        // 2. Prevent changes to completed sessions
        if (program.getCompletedSessions().contains(sessionNumber)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Undo workout completion before swapping exercises"
            );
        }

        // 3. Load the current and replacement exercises
        Exercise currentExercise = exerciseRepository
                .findById(currentExerciseId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Current exercise no longer exists"
                ));

        Exercise replacement = exerciseRepository
                .findByIdAndDeletedFalse(replacementExerciseId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Replacement exercise is unavailable"
                ));

        // 4. Require the same movement pattern
        if (
                currentExercise.getMovementPattern() == null ||
                        currentExercise.getMovementPattern() !=
                                replacement.getMovementPattern()
        ) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Replacement must use the same movement pattern"
            );
        }

        // 5. Check the equipment selected for this program
        GenerateProgramRequest preferences = jsonMapper.readValue(
                program.getPreferencesJson(),
                GenerateProgramRequest.class
        );

        if (
                preferences.availableEquipment() == null ||
                        !preferences.availableEquipment().contains(
                                replacement.getEquipment()
                        )
        ) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Replacement requires equipment not available in this program"
            );
        }

        // 6. Read the saved workout schedule
        List<WorkoutDay> schedule = new ArrayList<>(
                Arrays.asList(
                        jsonMapper.readValue(
                                program.getScheduleJson(),
                                WorkoutDay[].class
                        )
                )
        );

        int dayIndex = -1;

        for (int i = 0; i < schedule.size(); i++) {
            if (schedule.get(i).sessionNumber() == sessionNumber) {
                dayIndex = i;
                break;
            }
        }

        if (dayIndex == -1) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Workout session not found"
            );
        }

        WorkoutDay day = schedule.get(dayIndex);

        // 7. Find the exercise within this session
        List<WorkoutExercise> exercises =
                new ArrayList<>(day.exercises());

        int exerciseIndex = -1;

        for (int i = 0; i < exercises.size(); i++) {
            if (
                    Objects.equals(
                            exercises.get(i).exerciseId(),
                            currentExerciseId
                    )
            ) {
                exerciseIndex = i;
                break;
            }
        }

        if (exerciseIndex == -1) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Exercise not found in this workout"
            );
        }

        // 8. Prevent duplicate exercises in the same session
        boolean alreadyIncluded = exercises.stream()
                .anyMatch(exercise ->
                        Objects.equals(
                                exercise.exerciseId(),
                                replacementExerciseId
                        )
                );

        if (alreadyIncluded) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Replacement exercise is already in this workout"
            );
        }

        // 9. Keep the original sets and reps
        WorkoutExercise original = exercises.get(exerciseIndex);

        WorkoutExercise updatedExercise = new WorkoutExercise(
                replacement.getId(),
                replacement.getName(),
                original.sets(),
                original.reps(),
                original.targetRpe()
        );

        exercises.set(exerciseIndex, updatedExercise);

        // 10. Rebuild the immutable WorkoutDay record
        WorkoutDay updatedDay = new WorkoutDay(
                day.sessionNumber(),
                day.workoutType(),
                exercises
        );

        schedule.set(dayIndex, updatedDay);

        // 11. Save the modified schedule back to PostgreSQL
        program.replaceScheduleJson(
                jsonMapper.writeValueAsString(schedule)
        );

        repository.save(program);

        return toResponse(program);
    }



}
