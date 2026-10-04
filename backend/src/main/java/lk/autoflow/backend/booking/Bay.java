package lk.autoflow.backend.booking;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.ToString;

@Entity
@Table(name = "Bay")
@Data
@EqualsAndHashCode(exclude = "centre")
@ToString(exclude = "centre")
public class Bay {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "bay_id")
    private Integer bayId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "centre_id", nullable = false)
    private Centre centre;

    @Column(nullable = false, length = 50)
    private String name;

    @Column(length = 20)
    private String status = "AVAILABLE";
}
