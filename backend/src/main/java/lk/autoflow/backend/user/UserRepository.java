package lk.autoflow.backend.user;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Integer> {
    Optional<User> findByEmail(String email);
    Optional<User> findByMobile(String mobile);
    java.util.List<User> findByRole(String role);
    java.util.List<User> findByStatus(String status);
    java.util.List<User> findByRoleAndStatus(String role, String status);
}
