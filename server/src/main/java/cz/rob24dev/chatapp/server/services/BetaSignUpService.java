/*
 *
 * Copyright (c) 2026 Robert Darvaš. All rights reserved.
 *
 * Part of the QeroChat project.
 * Written by Rob24Dev <https://github.com/Rob24Dev>
 *
 */

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
