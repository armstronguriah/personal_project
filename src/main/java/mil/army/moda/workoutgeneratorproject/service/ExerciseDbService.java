
package mil.army.moda.workoutgeneratorproject.service;

import mil.army.moda.workoutgeneratorproject.dto.ExerciseDbExercise;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

import java.util.ArrayList;
import java.util.List;

@Service
public class ExerciseDbService {

    private final RestClient restClient;
    private final JsonMapper jsonMapper;

    public ExerciseDbService(JsonMapper jsonMapper) {
        this.jsonMapper = jsonMapper;

        this.restClient = RestClient.builder()
                .baseUrl("https://oss.exercisedb.dev")
                .build();
    }

    public List<ExerciseDbExercise> searchExercises(String exerciseName) {

        String response = restClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/api/v1/exercises/search")
                        .queryParam("search", exerciseName)
                        .build())
                .retrieve()
                .body(String.class);

        if (response == null || response.isBlank()) {
            return List.of();
        }

        JsonNode root = jsonMapper.readTree(response);
        JsonNode data = root.path("data");

        if (!data.isArray()) {
            throw new IllegalStateException(
                    "Unexpected ExerciseDB response format"
            );
        }

        List<ExerciseDbExercise> results = new ArrayList<>();

        for (JsonNode exercise : data) {

            results.add(new ExerciseDbExercise(
                    exercise.path("exerciseId").asText(""),
                    exercise.path("name").asText(""),
                    exercise.path("gifUrl").asText(""),
                    readStringList(exercise, "targetMuscles"),
                    readStringList(exercise, "secondaryMuscles"),
                    readStringList(exercise, "bodyParts"),
                    readStringList(exercise, "equipments"),
                    readStringList(exercise, "instructions")
            ));

            if (results.size() == 10) {
                break;
            }
        }

        return results;
    }

    private List<String> readStringList(
            JsonNode exercise,
            String fieldName
    ) {
        JsonNode values = exercise.path(fieldName);

        if (!values.isArray()) {
            return List.of();
        }

        List<String> results = new ArrayList<>();

        for (JsonNode value : values) {
            results.add(value.asText());
        }

        return results;
    }

    public ExerciseDbExercise getExerciseById(String exerciseId) {
        String response = restClient.get()
                .uri("/api/v1/exercises/{exerciseId}", exerciseId)
                .retrieve()
                .body(String.class);

        if (response == null || response.isBlank()) {
            throw new IllegalStateException(
                    "ExerciseDB returned an empty response"
            );
        }

        JsonNode root = jsonMapper.readTree(response);
        JsonNode exercise = root.path("data");

        // Support either a wrapped or direct exercise object.
        if (exercise.isMissingNode()) {
            exercise = root;
        }

        if (!exercise.isObject()) {
            throw new IllegalStateException(
                    "Unexpected ExerciseDB exercise response"
            );
        }

        return new ExerciseDbExercise(
                exercise.path("exerciseId").asText(""),
                exercise.path("name").asText(""),
                exercise.path("gifUrl").asText(""),
                readStringList(exercise, "targetMuscles"),
                readStringList(exercise, "secondaryMuscles"),
                readStringList(exercise, "bodyParts"),
                readStringList(exercise, "equipments"),
                readStringList(exercise, "instructions")
        );
    }

}
