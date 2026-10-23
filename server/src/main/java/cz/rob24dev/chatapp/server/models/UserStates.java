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
