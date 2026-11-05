package mil.army.moda.workoutgeneratorproject.config;

import mil.army.moda.workoutgeneratorproject.model.Exercise;
import mil.army.moda.workoutgeneratorproject.model.MovementPattern;
import mil.army.moda.workoutgeneratorproject.repository.ExerciseRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

/**
 * Imports a curated CSV the first time it sees each exercise name.
 * Enable locally with app.seed-exercises=true in application.properties.
 * The bundled CSV has no commas or quoted CSV fields.
 */
@Component
@ConditionalOnProperty(name = "app.seed-exercises", havingValue = "true")
public class ExerciseDataSeeder implements CommandLineRunner {

    private final ExerciseRepository repository;

    public ExerciseDataSeeder(ExerciseRepository repository) {
        this.repository = repository;
    }

    @Override
    public void run(String... args) throws Exception {
        Set<String> existingNames = new HashSet<>();
        for (Exercise existing : repository.findAll()) {
            if (existing.getName() != null) {
                existingNames.add(existing.getName().trim().toLowerCase(Locale.ROOT));
            }
        }

        List<Exercise> newExercises = new ArrayList<>();
        var resource = new ClassPathResource("exercises_seed.csv");
        try (var reader = new BufferedReader(new InputStreamReader(
                resource.getInputStream(), StandardCharsets.UTF_8))) {

            String header = reader.readLine();
            if (!"name,primaryMuscle,equipment,movementPattern,description".equals(header)) {
                throw new IllegalStateException("Unexpected exercises_seed.csv header: " + header);
            }

            String line;
            int lineNumber = 1;
            while ((line = reader.readLine()) != null) {
                lineNumber++;
                if (line.isBlank()) {
                    continue;
                }

                // This starter CSV deliberately contains no commas inside fields.
                String[] values = line.split(",", -1);
                if (values.length != 5) {
                    throw new IllegalStateException(
                            "Invalid exercises_seed.csv row " + lineNumber + ": " + line);
                }

                String name = values[0].trim();
                if (name.isEmpty()) {
                    throw new IllegalStateException("Missing exercise name on row " + lineNumber);
                }
                if (!existingNames.add(name.toLowerCase(Locale.ROOT))) {
                    continue;
                }

                Exercise exercise = new Exercise();
                exercise.setName(name);
                exercise.setPrimaryMuscle(values[1].trim());
                exercise.setEquipment(values[2].trim());
                exercise.setMovementPattern(MovementPattern.valueOf(values[3].trim()));
                exercise.setDescription(values[4].trim());
                exercise.setDeleted(false);
                newExercises.add(exercise);
            }
        }

        repository.saveAll(newExercises);
        System.out.println("Exercise seeder added " + newExercises.size() + " new exercises.");
    }
}
