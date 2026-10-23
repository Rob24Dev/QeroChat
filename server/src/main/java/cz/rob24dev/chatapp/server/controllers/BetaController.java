package cz.rob24dev.chatapp.server.controllers;

import cz.rob24dev.chatapp.server.dto.requests.BetaSignUpRequest;
import cz.rob24dev.chatapp.server.exceptions.BadRequestException;
import cz.rob24dev.chatapp.server.models.BetaSignUp;
import cz.rob24dev.chatapp.server.models.logs.LogType;
import cz.rob24dev.chatapp.server.services.AuditLogsService;
import cz.rob24dev.chatapp.server.services.BetaSignUpService;
import cz.rob24dev.chatapp.server.services.EmailSenderService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;


@RestController
@RequestMapping("/v1/beta")
public class BetaController {

    private final BetaSignUpService betaSignUpService;
    private final EmailSenderService emailSenderService;
    private final AuditLogsService auditLogsService;

    public BetaController(BetaSignUpService betaSignUpService, EmailSenderService emailSenderService, AuditLogsService auditLogsService) {
        this.betaSignUpService = betaSignUpService;
        this.emailSenderService = emailSenderService;
        this.auditLogsService = auditLogsService;
    }

    @PostMapping("/signup")
    public ResponseEntity<?> betaSignUp(@Valid @RequestBody BetaSignUpRequest betaSignUpRequest) {
        String email = betaSignUpRequest.getEmail();
        Optional<BetaSignUp> optionalBetaSignUp = betaSignUpService.getSignUpByEmail(email);
        if (optionalBetaSignUp.isPresent()) throw new BadRequestException("Tento e-mail je již zaregistrován.");
        BetaSignUp betaSignUp = new BetaSignUp();
        betaSignUp.setEmail(email);
        betaSignUp.setAgreeNews(betaSignUpRequest.isAgreeNews());
        betaSignUpService.saveBetaSignUp(betaSignUp);
        emailSenderService.sendBetaSignUpVerifyEmail(betaSignUpRequest.getEmail());
        auditLogsService.log(
                LogType.BETA_SIGN_UP,
                null,
                UUID.randomUUID().toString(),
                Map.of(
                        "email", email)
        );
        return ResponseEntity.ok(Map.of("message", "Registrace do beta programu proběhla úspěšně. Na e-mail ti přišlo potvrzení."));
    }
}
