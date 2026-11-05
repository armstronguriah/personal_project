
package mil.army.moda.workoutgeneratorproject.model;

import java.util.List;

public enum EquipmentAccess {

    BODYWEIGHT(List.of(
            "Bodyweight"
    )),

    DUMBBELL(List.of(
            "Dumbbell",
            "Bodyweight"
    )),

    BARBELL(List.of(
            "Barbell",
            "Bodyweight"
    )),

    FULL_GYM(List.of(
            "Barbell",
            "Dumbbell",
            "Bodyweight",
            "Cable",
            "Machine",
            "Kettlebell",
            "Resistance Band"
    ));

    private final List<String> allowedEquipment;

    EquipmentAccess(List<String> allowedEquipment) {
        this.allowedEquipment = List.copyOf(allowedEquipment);
    }

    public List<String> allowedEquipment() {
        return allowedEquipment;
    }
}
