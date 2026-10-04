package lk.autoflow.backend.notification;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Integer> {
    List<Notification> findByUser_UserId(Integer userId);
    List<Notification> findByUser_UserIdOrderByCreatedAtDesc(Integer userId);
    boolean existsByNotifIdAndUser_UserId(Integer notifId, Integer userId);
    List<Notification> findByStatus(String status);
    
    long countByUser_UserIdAndStatus(Integer userId, String status);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("UPDATE Notification n SET n.status = 'READ' WHERE n.user.userId = :userId AND n.status = 'SENT'")
    void markAllAsReadByUser(@org.springframework.data.repository.query.Param("userId") Integer userId);
}
