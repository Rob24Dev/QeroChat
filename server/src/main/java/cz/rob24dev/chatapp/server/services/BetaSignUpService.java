package cz.rob24dev.chatapp.server.services;

import cz.rob24dev.chatapp.server.models.BetaSignUp;
import cz.rob24dev.chatapp.server.repositories.BetaSignUpRepository;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class BetaSignUpService {


    private final BetaSignUpRepository betaSignUpRepository;

    public BetaSignUpService(BetaSignUpRepository betaSignUpRepository) {
        this.betaSignUpRepository = betaSignUpRepository;
    }

    public Optional<BetaSignUp> getSignUpByEmail(String email) {
        return betaSignUpRepository.findByEmail(email);
    }

    public void saveBetaSignUp(BetaSignUp betaSignUp) {
        betaSignUpRepository.save(betaSignUp);
    }
}
