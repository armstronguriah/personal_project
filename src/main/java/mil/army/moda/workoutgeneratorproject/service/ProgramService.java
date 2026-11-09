package mil.army.moda.workoutgeneratorproject.service;

import mil.army.moda.workoutgeneratorproject.model.*;
import org.springframework.stereotype.Service;
import static mil.army.moda.workoutgeneratorproject.model.MovementPattern.*;

import java.util.*;

@Service
public class ProgramService {
    private final ExerciseSelectionService selectionService;

    private record ExerciseSlot(
            MovementPattern pattern,
            String muscle,
            boolean primary
    ) {}

    private record Prescription(int sets, int reps) {}


    private ExerciseSlot slot(
            MovementPattern pattern,
            String muscle,
            boolean primary
    ) {
        return new ExerciseSlot(pattern, muscle, primary);
    }

    private List<ExerciseSlot> slotsFor(
            WorkoutType type,
            int occurrence
    ) {
        return switch (type) {
            case UPPER_BODY -> occurrence % 2 == 1
                    ? List.of(
                    slot(HORIZONTAL_PUSH, null, true),
                    slot(HORIZONTAL_PULL, null, false),
                    slot(VERTICAL_PUSH, null, false),
                    slot(VERTICAL_PULL, null, false),
                    slot(ISOLATION, "Biceps", false),
                    slot(ISOLATION, "Triceps", false),
                    slot(CORE, null, false)
            )
                    : List.of(
                    slot(VERTICAL_PUSH, null, true),
                    slot(HORIZONTAL_PULL, null, false),
                    slot(HORIZONTAL_PUSH, null, false),
                    slot(VERTICAL_PULL, null, false),
                    slot(ISOLATION, "Triceps", false),
                    slot(ISOLATION, "Biceps", false),
                    slot(CORE, null, false)
            );

            case LOWER_BODY, LEGS -> occurrence % 2 == 1
                    ? List.of(
                    slot(SQUAT, null, true),
                    slot(HINGE, null, false),
                    slot(LUNGE, null, false),
                    slot(ISOLATION, "Hamstrings", false),
                    slot(ISOLATION, "Calves", false),
                    slot(CORE, null, false),
                    slot(ISOLATION, "Quadriceps", false)
            )
                    : List.of(
                    slot(HINGE, null, true),
                    slot(SQUAT, null, false),
                    slot(LUNGE, null, false),
                    slot(ISOLATION, "Quadriceps", false),
                    slot(ISOLATION, "Calves", false),
                    slot(CORE, null, false),
                    slot(ISOLATION, "Hamstrings", false)
            );

            case PUSH -> List.of(
                    slot(HORIZONTAL_PUSH, null, true),
                    slot(VERTICAL_PUSH, null, false),
                    slot(ISOLATION, "Chest", false),
                    slot(ISOLATION, "Shoulders", false),
                    slot(ISOLATION, "Triceps", false),
                    slot(CORE, null, false),
                    slot(ISOLATION, "Triceps", false)
            );

            case PULL -> List.of(
                    slot(HORIZONTAL_PULL, null, true),
                    slot(VERTICAL_PULL, null, false),
                    slot(ISOLATION, "Shoulders", false),
                    slot(ISOLATION, "Biceps", false),
                    slot(ISOLATION, "Back", false),
                    slot(CORE, null, false),
                    slot(ISOLATION, "Biceps", false)
            );

            case FULL_BODY -> switch ((occurrence - 1) % 3) {
                case 0 -> List.of(
                        slot(SQUAT, null, true),
                        slot(HORIZONTAL_PUSH, null, false),
                        slot(HORIZONTAL_PULL, null, false),
                        slot(HINGE, null, false),
                        slot(CORE, null, false),
                        slot(VERTICAL_PUSH, null, false),
                        slot(ISOLATION, "Biceps", false)
                );
                case 1 -> List.of(
                        slot(HINGE, null, true),
                        slot(VERTICAL_PUSH, null, false),
                        slot(VERTICAL_PULL, null, false),
                        slot(LUNGE, null, false),
                        slot(CORE, null, false),
                        slot(HORIZONTAL_PUSH, null, false),
                        slot(ISOLATION, "Triceps", false)
                );
                default -> List.of(
                        slot(SQUAT, null, true),
                        slot(HORIZONTAL_PULL, null, false),
                        slot(VERTICAL_PUSH, null, false),
                        slot(LUNGE, null, false),
                        slot(CORE, null, false),
                        slot(VERTICAL_PULL, null, false),
                        slot(ISOLATION, "Shoulders", false)
                );
            };

            case ACTIVE_RECOVERY -> List.of();
        };
    }


    private Prescription prescriptionFor(
            TrainingGoal goal,
            ExerciseSlot slot
    ) {
        if (slot.primary()) {
            return new Prescription(
                    goal.sets(),
                    goal.reps()
            );
        }

        if (slot.pattern() == ISOLATION ||
                slot.pattern() == CORE) {
            return goal == TrainingGoal.ENDURANCE
                    ? new Prescription(2, 15)
                    : new Prescription(3, 12);
        }

        return switch (goal) {
            case STRENGTH -> new Prescription(3, 8);
            case HYPERTROPHY -> new Prescription(3, 10);
            case ENDURANCE -> new Prescription(2, 15);
            case HYBRID -> new Prescription(3, 10);
        };
    }


    private List<String> equipmentPriority(ExerciseSlot slot) {

        if (slot.pattern() == VERTICAL_PULL) {
            return List.of(
                    "Cable", "Machine", "Bodyweight",
                    "Resistance Band", "Dumbbell",
                    "Kettlebell", "Barbell"
            );
        }

        if (slot.primary()) {
            return List.of(
                    "Barbell", "Dumbbell", "Machine",
                    "Kettlebell", "Cable",
                    "Bodyweight", "Resistance Band"
            );
        }

        if (slot.pattern() == SQUAT) {
            return List.of(
                    "Machine", "Dumbbell", "Kettlebell",
                    "Bodyweight", "Barbell",
                    "Resistance Band", "Cable"
            );
        }

        if (slot.pattern() == ISOLATION ||
                slot.pattern() == CORE) {
            return List.of(
                    "Cable", "Machine", "Dumbbell",
                    "Resistance Band", "Bodyweight",
                    "Kettlebell", "Barbell"
            );
        }

        return List.of(
                "Dumbbell", "Machine", "Cable",
                "Kettlebell", "Bodyweight",
                "Resistance Band", "Barbell"
        );
    }

    private WorkoutDay buildWorkout(
            int sessionNumber,
            WorkoutType workoutType,
            List<MovementPattern> patterns,
            List<String> availableEquipment
    ) {
        return buildWorkout(
                sessionNumber,
                workoutType,
                patterns,
                availableEquipment,
                TrainingGoal.HYBRID
        );
    }


    private WorkoutDay buildWorkout(
            int sessionNumber,
            WorkoutType workoutType,
            List<MovementPattern> patterns,
            List<String> availableEquipment,
            TrainingGoal goal
    ) {
        return buildWorkout(
                sessionNumber,
                workoutType,
                patterns,
                availableEquipment,
                goal,
                Set.of()
        );
    }

    private WorkoutDay buildWorkout(
            int sessionNumber,
            WorkoutType workoutType,
            List<MovementPattern> patterns,
            List<String> availableEquipment,
            TrainingGoal goal,
            Set<Long> usedExerciseIds
    ) {
        List<WorkoutExercise> exercises = new ArrayList<>();

        for (MovementPattern pattern : patterns) {

            Optional<WorkoutExercise> selected =
                    selectionService.selectExercise(
                            pattern,
                            availableEquipment,
                            goal.sets(),
                            goal.reps()
                    );

            if (selected.isEmpty()) {
                continue;
            }

            WorkoutExercise exercise = selected.get();

            if (usedExerciseIds.contains(exercise.exerciseId())) {
                exercise = selectionService.selectExercise(
                        pattern,
                        availableEquipment,
                        goal.sets(),
                        goal.reps(),
                        usedExerciseIds
                ).orElse(exercise);
            }

            exercises.add(exercise);
        }

        return new WorkoutDay(
                sessionNumber,
                workoutType,
                exercises
        );
    }

    private List<MovementPattern> patternsFor(WorkoutType type, int sessionNumber) {
        return switch (type) {

            case FULL_BODY -> fullBodyPatternsFor(sessionNumber);

            case UPPER_BODY -> List.of(
                    MovementPattern.HORIZONTAL_PUSH,
                    MovementPattern.HORIZONTAL_PULL,
                    MovementPattern.VERTICAL_PUSH,
                    MovementPattern.VERTICAL_PULL
            );

            case LOWER_BODY, LEGS -> List.of(
                    MovementPattern.SQUAT,
                    MovementPattern.HINGE,
                    MovementPattern.LUNGE
            );

            case PUSH -> List.of(
                    MovementPattern.HORIZONTAL_PUSH,
                    MovementPattern.VERTICAL_PUSH
            );

            case PULL -> List.of(
                    MovementPattern.HORIZONTAL_PULL,
                    MovementPattern.VERTICAL_PULL
            );

            case ACTIVE_RECOVERY -> List.of();
        };
    }

    private List<MovementPattern> fullBodyPatternsFor(
            int sessionNumber
    ) {
        return switch ((sessionNumber - 1) % 3) {

            // Full Body A
            case 0 -> List.of(
                    MovementPattern.SQUAT,
                    MovementPattern.HINGE,
                    MovementPattern.HORIZONTAL_PUSH,
                    MovementPattern.HORIZONTAL_PULL,
                    MovementPattern.CORE
            );

            // Full Body B
            case 1 -> List.of(
                    MovementPattern.LUNGE,
                    MovementPattern.HINGE,
                    MovementPattern.VERTICAL_PUSH,
                    MovementPattern.VERTICAL_PULL,
                    MovementPattern.CORE
            );

            // Full Body C
            default -> List.of(
                    MovementPattern.SQUAT,
                    MovementPattern.LUNGE,
                    MovementPattern.HORIZONTAL_PUSH,
                    MovementPattern.VERTICAL_PULL,
                    MovementPattern.CORE
            );
        };
    }

    public WorkoutDay createUpperBodyWorkout(
            int sessionNumber,
            List<String> availableEquipment
    ) {
        return buildWorkout(
                sessionNumber,
                WorkoutType.UPPER_BODY,
                List.of(
                        MovementPattern.HORIZONTAL_PUSH,
                        MovementPattern.HORIZONTAL_PULL,
                        MovementPattern.VERTICAL_PUSH,
                        MovementPattern.VERTICAL_PULL
                ),
                availableEquipment
        );
    }

    public WorkoutDay createLowerBodyWorkout(
            int sessionNumber,
            List<String> availableEquipment
    ) {
        return buildWorkout(
                sessionNumber,
                WorkoutType.LOWER_BODY,
                List.of(
                        MovementPattern.SQUAT,
                        MovementPattern.HINGE,
                        MovementPattern.LUNGE
                ),
                availableEquipment
        );
    }

    public List<WorkoutType> createWeeklySplit(int trainingDays) {

        if (trainingDays == 1) {
            return List.of(WorkoutType.FULL_BODY);
        }

        if (trainingDays == 2) {
            return List.of(
                    WorkoutType.FULL_BODY,
                    WorkoutType.FULL_BODY
            );
        }

        if (trainingDays == 3) {
            return List.of(
                    WorkoutType.FULL_BODY,
                    WorkoutType.FULL_BODY,
                    WorkoutType.FULL_BODY
            );
        }

        if (trainingDays == 4) {
            return List.of(
                    WorkoutType.UPPER_BODY,
                    WorkoutType.LOWER_BODY,
                    WorkoutType.UPPER_BODY,
                    WorkoutType.LOWER_BODY
            );
        }

        if (trainingDays == 5) {
            return List.of(
                    WorkoutType.UPPER_BODY,
                    WorkoutType.LOWER_BODY,
                    WorkoutType.FULL_BODY,
                    WorkoutType.UPPER_BODY,
                    WorkoutType.LOWER_BODY
            );
        }

        if (trainingDays == 6) {
            return List.of(
                    WorkoutType.PUSH,
                    WorkoutType.PULL,
                    WorkoutType.LEGS,
                    WorkoutType.PUSH,
                    WorkoutType.PULL,
                    WorkoutType.LEGS
            );
        }

        if (trainingDays == 7) {
            return List.of(
                    WorkoutType.PUSH,
                    WorkoutType.PULL,
                    WorkoutType.LEGS,
                    WorkoutType.PUSH,
                    WorkoutType.PULL,
                    WorkoutType.LEGS,
                    WorkoutType.ACTIVE_RECOVERY
            );
        }

        throw new IllegalArgumentException(
                "Training days must be between 1 and 7"
        );
    }


    public List<WorkoutDay> createWeeklySchedule(int trainingDays) {

        List<WorkoutType> split = createWeeklySplit(trainingDays);

        List<WorkoutDay> schedule = new ArrayList<>();

        for (int i = 0; i < split.size(); i++) {

            WorkoutType type = split.get(i);
            int sessionNumber = i + 1;

            WorkoutDay workout;

            if (type == WorkoutType.FULL_BODY) {
                workout = createFullBodyWorkout(sessionNumber);
            } else {
                workout = new WorkoutDay(sessionNumber, type);
            }

            schedule.add(workout);
        }

        return schedule;
    }


    public ProgramService(ExerciseSelectionService selectionService) {
        this.selectionService = selectionService;
    }


    public WorkoutDay createFullBodyWorkout(int sessionNumber) {

        List<WorkoutExercise> exercises = new ArrayList<>();

        List<MovementPattern> patterns = List.of(
                MovementPattern.SQUAT,
                MovementPattern.HORIZONTAL_PUSH,
                MovementPattern.HORIZONTAL_PULL
        );

        for (MovementPattern pattern : patterns) {
            selectionService
                    .selectExercise(pattern, 3, 8)
                    .ifPresent(exercises::add); //method reference of .ifPresent(exercise -> exercises.add(exercise));
        }

        return new WorkoutDay(
                sessionNumber,
                WorkoutType.FULL_BODY,
                exercises
        );
    }


    public WorkoutDay createFullBodyWorkout(
            int sessionNumber,
            List<String> availableEquipment
    ) {
        return createFullBodyWorkout(
                sessionNumber,
                availableEquipment,
                TrainingGoal.HYBRID
        );
    }

    public WorkoutDay createFullBodyWorkout(
            int sessionNumber,
            List<String> availableEquipment,
            TrainingGoal goal
    ) {
        return buildWorkout(
                sessionNumber,
                WorkoutType.FULL_BODY,
                List.of(
                        MovementPattern.SQUAT,
                        MovementPattern.HORIZONTAL_PUSH,
                        MovementPattern.HORIZONTAL_PULL
                ),
                availableEquipment,
                goal
        );
    }

    public List<WorkoutDay> createWeeklySchedule(
            int trainingDays,
            List<String> availableEquipment
    ) {
        return createWeeklySchedule(
                trainingDays,
                availableEquipment,
                TrainingGoal.HYBRID
        );
    }

    public List<WorkoutDay> createWeeklySchedule(
            int trainingDays,
            List<String> availableEquipment,
            TrainingGoal goal
    ) {
        List<WorkoutType> split = createWeeklySplit(trainingDays);
        List<WorkoutDay> schedule = new ArrayList<>();

        Set<Long> usedExerciseIds = new HashSet<>();

        for (int i = 0; i < split.size(); i++) {
            WorkoutType type = split.get(i);
            int sessionNumber = i + 1;

            WorkoutDay workout = buildWorkout(
                    sessionNumber,
                    type,
                    patternsFor(type, sessionNumber),
                    availableEquipment,
                    goal,
                    Set.copyOf(usedExerciseIds)
            );

            schedule.add(workout);

            for (WorkoutExercise exercise : workout.exercises()) {
                usedExerciseIds.add(exercise.exerciseId());
            }
        }

        return schedule;
    }

    public WorkoutDay createPushWorkout(
            int sessionNumber,
            List<String> availableEquipment
    ) {
        return buildWorkout(
                sessionNumber,
                WorkoutType.PUSH,
                List.of(
                        MovementPattern.HORIZONTAL_PUSH,
                        MovementPattern.VERTICAL_PUSH
                ),
                availableEquipment
        );
    }

    public WorkoutDay createPullWorkout(
            int sessionNumber,
            List<String> availableEquipment
    ) {
        return buildWorkout(
                sessionNumber,
                WorkoutType.PULL,
                List.of(
                        MovementPattern.HORIZONTAL_PULL,
                        MovementPattern.VERTICAL_PULL
                ),
                availableEquipment
        );
    }

    public WorkoutDay createLegsWorkout(
            int sessionNumber,
            List<String> availableEquipment
    ) {
        return buildWorkout(
                sessionNumber,
                WorkoutType.LEGS,
                List.of(
                        MovementPattern.SQUAT,
                        MovementPattern.HINGE,
                        MovementPattern.LUNGE
                ),
                availableEquipment
        );
    }


    private int targetExerciseCount(
            int sessionMinutes,
            String experience
    ) {
        int target;

        if (sessionMinutes <= 30) {
            target = 3;
        } else if (sessionMinutes <= 45) {
            target = 4;
        } else if (sessionMinutes <= 60) {
            target = 5;
        } else if (sessionMinutes <= 90) {
            target = 6;
        } else {
            target = 7;
        }

        return switch (experience) {
            case "BEGINNER" -> Math.min(target, 5);
            case "INTERMEDIATE" -> Math.min(target, 6);
            case "ADVANCED" -> target;
            default -> throw new IllegalArgumentException(
                    "Unsupported experience level: " + experience
            );
        };
    }


    private List<MovementPattern> priorityPatternsFor(
            WorkoutType type,
            int sessionNumber
    ) {
        return switch (type) {

            case FULL_BODY -> switch ((sessionNumber - 1) % 3) {
                case 0 -> List.of(
                        SQUAT,
                        HORIZONTAL_PUSH,
                        HORIZONTAL_PULL,
                        HINGE,
                        CORE,
                        VERTICAL_PUSH,
                        VERTICAL_PULL
                );

                case 1 -> List.of(
                        HINGE,
                        VERTICAL_PUSH,
                        VERTICAL_PULL,
                        LUNGE,
                        CORE,
                        HORIZONTAL_PUSH,
                        HORIZONTAL_PULL
                );

                default -> List.of(
                        LUNGE,
                        HORIZONTAL_PUSH,
                        VERTICAL_PULL,
                        SQUAT,
                        CORE,
                        HORIZONTAL_PULL,
                        VERTICAL_PUSH
                );
            };

            case UPPER_BODY -> List.of(
                    HORIZONTAL_PUSH,
                    HORIZONTAL_PULL,
                    VERTICAL_PUSH,
                    VERTICAL_PULL,
                    HORIZONTAL_PUSH,
                    HORIZONTAL_PULL,
                    CORE
            );

            case LOWER_BODY, LEGS -> List.of(
                    SQUAT,
                    HINGE,
                    LUNGE,
                    SQUAT,
                    HINGE,
                    LUNGE,
                    CORE
            );

            case PUSH -> List.of(
                    HORIZONTAL_PUSH,
                    VERTICAL_PUSH,
                    HORIZONTAL_PUSH,
                    VERTICAL_PUSH,
                    CORE
            );

            case PULL -> List.of(
                    HORIZONTAL_PULL,
                    VERTICAL_PULL,
                    HORIZONTAL_PULL,
                    VERTICAL_PULL,
                    CORE
            );

            case ACTIVE_RECOVERY -> List.of();
        };
    }


    //uses better logic to create workouts
    public List<WorkoutDay> createWeeklySchedule(
            int trainingDays,
            List<String> availableEquipment,
            TrainingGoal goal,
            String experience,
            int sessionMinutes
    ) {
        List<WorkoutType> split = createWeeklySplit(trainingDays);
        List<WorkoutDay> schedule = new ArrayList<>();

        Set<Long> usedAcrossWeek = new HashSet<>();
        Map<WorkoutType, Integer> occurrences =
                new EnumMap<>(WorkoutType.class);

        int target = targetExerciseCount(
                sessionMinutes,
                experience
        );

        for (WorkoutType type : split) {
            int sessionNumber = schedule.size() + 1;

            // Endurance sessions feature cardio; Hybrid sessions mix in conditioning.
            boolean cardioDay = goal == TrainingGoal.ENDURANCE ||
                    (goal == TrainingGoal.HYBRID && (
                            trainingDays == 1 || sessionNumber % 2 == 0 ||
                                    (trainingDays == 3 && sessionNumber == 3)));

            int resistanceTarget = goal == TrainingGoal.ENDURANCE
                    ? (sessionMinutes >= 60 && type != WorkoutType.ACTIVE_RECOVERY ? 2 : 0)
                    : (cardioDay ? Math.max(1, target - 1) : target);

            int occurrence = occurrences.merge(
                    type, 1, Integer::sum
            );

            List<WorkoutExercise> exercises = new ArrayList<>();
            Set<Long> usedToday = new HashSet<>();

            for (ExerciseSlot slot : slotsFor(type, occurrence)) {
                if (exercises.size() >= resistanceTarget) {
                    break;
                }

                Prescription prescription = prescriptionFor(
                        goal, slot
                );

                List<String> priority = equipmentPriority(slot);

                // First attempt: find an exercise not used this week
                Set<Long> excluded = new HashSet<>(usedAcrossWeek);
                excluded.addAll(usedToday);

                Optional<WorkoutExercise> selected =
                        selectionService.selectExercise(
                                slot.pattern(),
                                availableEquipment,
                                prescription.sets(),
                                prescription.reps(),
                                excluded,
                                slot.muscle(),
                                priority
                        );

                // Fallback: permit earlier-week exercises,
                // but never repeat an exercise in one session
                if (selected.isEmpty()) {
                    selected = selectionService.selectExercise(
                            slot.pattern(),
                            availableEquipment,
                            prescription.sets(),
                            prescription.reps(),
                            usedToday,
                            slot.muscle(),
                            priority
                    );
                }

                selected.ifPresent(exercise -> {
                    if (usedToday.add(exercise.exerciseId())) {
                        exercises.add(exercise);
                    }
                });
            }

            if (cardioDay) {
                // Interval days alternate with steady aerobic days.
                boolean intervals = type != WorkoutType.ACTIVE_RECOVERY &&
                        (goal == TrainingGoal.ENDURANCE
                                ? sessionNumber % 2 == 0
                                : sessionNumber % 4 == 0 || sessionNumber == 3);
                MovementPattern cardioPattern = intervals ? CARDIO_INTERVALS : CARDIO_STEADY;
                String cardioFocus = intervals && !"BEGINNER".equalsIgnoreCase(experience)
                        ? "Anaerobic" : (goal == TrainingGoal.ENDURANCE && !intervals
                        && sessionMinutes >= 60 && availableEquipment.contains("Bodyweight")
                        ? "Long Aerobic" : "Aerobic");

                List<String> cardioPriority = List.of("Bodyweight", "Machine");
                Optional<WorkoutExercise> cardio = selectionService.selectExercise(
                        cardioPattern, availableEquipment, 0, 0,
                        usedToday, cardioFocus, cardioPriority);

                // Ensure a cardio row exists in exercises_seed.csv and is enabled in the DB.
                cardio.ifPresent(exercise -> {
                    WorkoutExercise prescription;
                    if (intervals) {
                        int rounds = "BEGINNER".equalsIgnoreCase(experience) ? 4 : 6;
                        int work = "BEGINNER".equalsIgnoreCase(experience) ? 20 : 30;
                        int rest = "BEGINNER".equalsIgnoreCase(experience) ? 100 : 90;
                        int totalMinutes = 10 + (int) Math.ceil(rounds * (work + rest) / 60.0);
                        prescription = WorkoutExercise.intervalCardio(
                                exercise.exerciseId(), exercise.exerciseName(),
                                rounds, work, rest, totalMinutes, 6.0);
                    } else {
                        int minutes = goal == TrainingGoal.ENDURANCE
                                ? Math.max(12, sessionMinutes - (resistanceTarget > 0 ? 30 : 10))
                                : Math.min(25, Math.max(10, sessionMinutes / 3));
                        prescription = WorkoutExercise.steadyCardio(
                                exercise.exerciseId(), exercise.exerciseName(), minutes, 6.0);
                    }
                    exercises.add(prescription);
                    usedToday.add(exercise.exerciseId());
                });
            }

            usedAcrossWeek.addAll(usedToday);

            schedule.add(new WorkoutDay(
                    sessionNumber,
                    type,
                    exercises
            ));
        }

        return schedule;
    }

    //supports multiweek scheduling
    public List<WorkoutDay> createMultiWeekSchedule(
            int programWeeks,
            int trainingDays,
            List<String> availableEquipment,
            TrainingGoal goal,
            String experience,
            int sessionMinutes
    )
    {
        if (programWeeks < 1 || programWeeks > 8) {
            throw new IllegalArgumentException(
                    "Program must be between 1 and 8 weeks"
            );
        }

        // Generate the initial week with existing selection logic
        List<WorkoutDay> baseWeek = createWeeklySchedule(
                trainingDays,
                availableEquipment,
                goal,
                experience,
                sessionMinutes
        );

        List<WorkoutDay> fullProgram = new ArrayList<>();

        for (int week = 1; week <= programWeeks; week++) {

            for (WorkoutDay day : baseWeek) {

                int globalSessionNumber =
                        (week - 1) * trainingDays
                                + day.sessionNumber();

                List<WorkoutExercise> adjustedExercises =
                        new ArrayList<>();

                for (int i = 0; i < day.exercises().size(); i++) {

                    WorkoutExercise original =
                            day.exercises().get(i);

                    boolean primaryExercise = i < 2;

                    WorkoutExercise adjusted =
                            PeriodizationPlanner.apply(
                                    original,
                                    goal,
                                    week,
                                    experience,
                                    primaryExercise
                            );

                    adjustedExercises.add(adjusted);
                }

                fullProgram.add(new WorkoutDay(
                        globalSessionNumber,
                        day.workoutType(),
                        adjustedExercises
                ));
            }
        }

        return fullProgram;
    }





}
