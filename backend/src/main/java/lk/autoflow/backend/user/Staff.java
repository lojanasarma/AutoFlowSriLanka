package lk.autoflow.backend.user;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.PrimaryKeyJoinColumn;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Entity
@Table(name = "Staff")
@PrimaryKeyJoinColumn(name = "staff_id")
@Data
@EqualsAndHashCode(callSuper = true)
public class Staff extends User {

    @Column(nullable = false, length = 50)
    private String department;
}
