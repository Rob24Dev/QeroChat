package cz.rob24dev.chatapp.server.controllers;

import cz.rob24dev.chatapp.server.config.WebConfig;
import cz.rob24dev.chatapp.server.dto.UserDto;
import cz.rob24dev.chatapp.server.dto.requests.ChangeEmailRequest;
import cz.rob24dev.chatapp.server.dto.requests.ChangePasswordRequest;
import cz.rob24dev.chatapp.server.dto.requests.ConfirmEmailRequest;
import cz.rob24dev.chatapp.server.dto.requests.UpdateProfileRequest;
import cz.rob24dev.chatapp.server.exceptions.BadCredentialsException;
import cz.rob24dev.chatapp.server.exceptions.BadRequestException;
import cz.rob24dev.chatapp.server.exceptions.ConflictException;
import cz.rob24dev.chatapp.server.models.User;
import cz.rob24dev.chatapp.server.models.UserStates;
import cz.rob24dev.chatapp.server.models.conversation.Contact;
import cz.rob24dev.chatapp.server.models.logs.LogType;
import cz.rob24dev.chatapp.server.models.tokens.ActionToken;
import cz.rob24dev.chatapp.server.models.tokens.TokenType;
import cz.rob24dev.chatapp.server.repositories.UserRepository;
import cz.rob24dev.chatapp.server.services.*;
import cz.rob24dev.chatapp.server.services.tokens.ActionTokensService;
import cz.rob24dev.chatapp.server.services.tokens.HashManager;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/v1/users")
public class UserController {

    private final WebConfig webConfig;
    private final UserService userService;
    private final AuditLogsService auditLogsService;
    private final ActionTokensService actionTokensService;
    private final ContactService contactService;
    private final UserRepository userRepository;
    private final FileUploadService fileUploadService;

    public UserController(WebConfig webConfig, UserService userService, AuditLogsService auditLogsService, ActionTokensService actionTokensService, ContactService contactService, UserRepository userRepository, FileUploadService fileUploadService) {
        this.webConfig = webConfig;
        this.userService = userService;
        this.auditLogsService = auditLogsService;
        this.actionTokensService = actionTokensService;
        this.contactService = contactService;
        this.userRepository = userRepository;
        this.fileUploadService = fileUploadService;
    }

    @GetMapping("/me")
    public ResponseEntity<?> getProfile(@RequestAttribute("authenticatedUserId") UUID userId) {
        User user = userService.getUserById(userId);
        return ResponseEntity.ok(Map.of("user", UserDto.from(user)));
    }


    @PatchMapping("/me")
    public ResponseEntity<?> updateProfile(@Valid @RequestBody UpdateProfileRequest updateProfileRequest, @RequestAttribute("authenticatedUserId") UUID userId) {
        User user = userService.getUserById(userId);
        UserStates.UserState state = UserStates.findStateByString(updateProfileRequest.getStatus());

        if(state == null) throw new BadRequestException("Neplatný status.");
        else user.setStatus(state);

        if(updateProfileRequest.getBannerUrl() != null && !updateProfileRequest.getBannerUrl().isEmpty()) {
            String[] bannerUrl = updateProfileRequest.getBannerUrl().split("/");
            if(bannerUrl.length == 0) throw new BadRequestException("Neplatný banner, zkuste ho nahrát znovu.");
            String bannerFileName = bannerUrl[bannerUrl.length - 1];
            if(fileUploadService.getObjectUrlIfExist(bannerFileName) != null) user.setBannerUrl(updateProfileRequest.getBannerUrl());
            else throw new BadRequestException("Neplatný banner, zkuste ho nahrát znovu.");
        }
        if(updateProfileRequest.getAvatarUrl() != null && !updateProfileRequest.getAvatarUrl().isEmpty()) {
            String[] avatarUrl = updateProfileRequest.getAvatarUrl().split("/");
            if(avatarUrl.length == 0) throw new BadRequestException("Neplatná profilovka, zkuste ji nahrát znovu.");
            String avatarFileName = avatarUrl[avatarUrl.length - 1];
            if(fileUploadService.getObjectUrlIfExist(avatarFileName) != null) user.setAvatarUrl(updateProfileRequest.getAvatarUrl());
            else throw new BadRequestException("Neplatná profilovka, zkuste ji nahrát znovu.");
        }

        if(updateProfileRequest.getStatusText() != null) user.setStatusText(updateProfileRequest.getStatusText());
        if(!updateProfileRequest.getName().equalsIgnoreCase(user.getName())) user.setName(updateProfileRequest.getName());

        userService.save(user);
        return ResponseEntity.ok(Map.of("user", UserDto.from(user)));
    }

    @DeleteMapping("/me")
    public ResponseEntity<?> deleteProfile(@RequestAttribute("authenticatedUserId") UUID userId) {
        User user = userService.getUserById(userId);
        userService.deleteUser();
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/block")
    public ResponseEntity<?> blockUser(@PathVariable("id") UUID contactId, @RequestAttribute("authenticatedUserId") UUID userId) {
        User user = userService.getUserById(userId);
        Contact contact = contactService.getContactById(contactId);
        contactService.blockContact(contact, user);
        return ResponseEntity.ok(Map.of("message", "Blocknutí proběhlo úspěšně."));
    }
    @PostMapping("/{id}/unblock")
    public ResponseEntity<?> unblockUser(@PathVariable("id") UUID contactId, @RequestAttribute("authenticatedUserId") UUID userId) {
        User user = userService.getUserById(userId);
        Contact contact = contactService.getContactById(contactId);
        contactService.unblockContact(contact, user);
        return ResponseEntity.ok(Map.of("message", "Odblokování proběhlo úspěšně."));
    }

    @PostMapping("/me/change-password")
    public ResponseEntity<?> changePassword(@Valid @RequestBody ChangePasswordRequest changePasswordRequest, @RequestAttribute("authenticatedUserId") UUID userId) {
        User user = userService.getUserById(userId);
        if(!webConfig.passwordEncoder().matches(changePasswordRequest.getOldPassword(), user.getPasswordHash())) throw new BadRequestException("Staré heslo není správné.");
        if(webConfig.passwordEncoder().matches(changePasswordRequest.getNewPassword(), user.getPasswordHash())) throw new ConflictException("Staré heslo je stejné jako nové.");

        user.setPasswordHash(webConfig.passwordEncoder().encode(changePasswordRequest.getNewPassword()));
        userService.save(user);

        return ResponseEntity.ok(Map.of("message", "Změna hesla proběhla úspěšně."));
    }

    @PostMapping("/me/change-email")
    public ResponseEntity<?> changeEmail(@Valid @RequestBody ChangeEmailRequest changeEmailRequest, @RequestAttribute("authenticatedUserId") UUID userId) {
        User user = userService.getUserById(userId);
        if(userRepository.findUserByEmail(changeEmailRequest.getNewEmail()).isPresent()) {
            throw new ConflictException("E-mail je již zaregistrovaný!");
        }
        if(!webConfig.passwordEncoder().matches(changeEmailRequest.getPassword(), user.getPasswordHash())) throw new BadCredentialsException("Heslo není správně.");
        auditLogsService.log(
                LogType.CHANGE_EMAIL_REQUEST,
                user.getId(),
                UUID.randomUUID().toString(),
                new HashMap<>()
        );
        actionTokensService.actionRequest(user, TokenType.VERIFY_EMAIL, Map.of("newData", changeEmailRequest.getNewEmail()));

        return ResponseEntity.ok(Map.of("message", "Na nový email byla zaslána žádost o ověření."));
    }

    @PostMapping("/me/confirm-email")
    public ResponseEntity<?> confirmEmail(@Valid @RequestBody ConfirmEmailRequest confirmEmailRequest) {
        String tokenHash =  HashManager.hashText(confirmEmailRequest.getToken());
        ActionToken actionToken = actionTokensService.getActionTokenByTokenHash(tokenHash).orElse(null);
        actionTokensService.useToken(actionToken);
        return ResponseEntity.ok(Map.of("message", "Změna emailu proběhla úspěšně."));
    }
}
