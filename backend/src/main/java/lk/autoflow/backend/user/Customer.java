package lk.autoflow.backend.user;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.PrimaryKeyJoinColumn;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Entity
@Table(name = "Customer")
@PrimaryKeyJoinColumn(name = "customer_id")
@Data
@EqualsAndHashCode(callSuper = true)
public class Customer extends User {

    @Column(name = "loyalty_points")
    private Integer loyaltyPoints = 0;
}
