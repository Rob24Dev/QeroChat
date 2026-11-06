/*
 *
 * Copyright (c) 2026 Robert Darvaš. All rights reserved.
 *
 * Part of the QeroChat project.
 * Written by Rob24Dev <https://github.com/Rob24Dev>
 *
 */

package cz.rob24dev.chatapp.server.models;

public class UserStates {

    public enum UserState {
        OFFLINE,
        ONLINE,
        AWAY,
        BUSY
    }

    public static UserState findStateByString(String state) {
        for(UserState userState : UserState.values()) {
            if(userState.name().equalsIgnoreCase(state)) return userState;
        }
        return null;
    }
}
