package lk.autoflow.backend.booking;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import lombok.RequiredArgsConstructor;
import java.util.List;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;
    private final lk.autoflow.backend.user.UserRepository userRepository;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'CUSTOMER_SERVICE_OFFICER', 'WORKSHOP_OPERATIONS_MANAGER', 'SCHEDULING_OFFICER', 'FINANCE_OFFICER')")
    public ResponseEntity<List<Booking>> getAllBookings() {
        return ResponseEntity.ok(bookingService.getAllBookings());
    }

    @GetMapping("/ref/{ref}")
    @PreAuthorize("hasAnyRole('ADMIN', 'CUSTOMER_SERVICE_OFFICER', 'WORKSHOP_OPERATIONS_MANAGER', 'SCHEDULING_OFFICER', 'FINANCE_OFFICER')")
    public ResponseEntity<Booking> getBookingByRef(@PathVariable String ref) {
        return bookingService.getBookingByRef(ref)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/my-bookings")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'USER')")
    public ResponseEntity<List<Booking>> getMyBookings(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(bookingService.getMyBookings(userDetails.getUsername(), userRepository));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'CUSTOMER_SERVICE_OFFICER', 'CUSTOMER', 'USER')")
    public ResponseEntity<?> createBooking(@RequestBody Booking booking, @org.springframework.security.core.annotation.AuthenticationPrincipal org.springframework.security.core.userdetails.UserDetails userDetails, org.springframework.security.core.Authentication authentication) {
        try {
            return ResponseEntity.ok(bookingService.createBooking(booking, userDetails.getUsername(), authentication));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(409).body(e.getMessage());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PatchMapping("/{bookingId}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'CUSTOMER_SERVICE_OFFICER', 'WORKSHOP_OPERATIONS_MANAGER', 'SCHEDULING_OFFICER') or @accessPolicy.canAccessBooking(#bookingId, authentication)")
    public ResponseEntity<?> updateBookingStatus(@PathVariable Integer bookingId, @RequestParam String status, org.springframework.security.core.Authentication authentication) {
        try {
            return ResponseEntity.ok(bookingService.updateBookingStatus(bookingId, status, authentication));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteBooking(@PathVariable Integer id) {
        bookingService.deleteBooking(id);
        return ResponseEntity.ok().build();
    }
}
