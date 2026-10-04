package lk.autoflow.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Min;
import lombok.Data;
import java.time.LocalDate;

@Data
public class VehicleCreateDTO {

    @NotBlank(message = "Registration number cannot be blank")
    @Size(min = 2, max = 20, message = "Registration number must be between 2 and 20 characters")
    private String regNo;

    @NotBlank(message = "Make cannot be blank")
    private String make;

    @NotBlank(message = "Model cannot be blank")
    private String model;

    @NotNull(message = "Manufacture year cannot be null")
    @Min(value = 1900, message = "Manufacture year must be greater than 1900")
    private Integer year;

    private String fuelType;
    private Integer engineCapacity;

    @NotNull(message = "Insurance expiry date is required")
    private LocalDate insuranceExpiry;

    private Integer mileage;
    
    // Optional: Only used when an Admin is registering a vehicle for a customer
    private Integer ownerId;
}
