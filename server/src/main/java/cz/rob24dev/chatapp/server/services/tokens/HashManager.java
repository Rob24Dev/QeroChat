package cz.rob24dev.chatapp.server.services.tokens;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.security.DigestInputStream;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;

public class HashManager {

    private static final MessageDigest SHA_256;

    static {
        try {
            SHA_256 = MessageDigest.getInstance("SHA-256");
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("Invalid hashing algorithm", e);
        }
    }

    public static String hashText(String input) {
        byte[] hash = SHA_256.digest(input.getBytes(StandardCharsets.UTF_8));
        return HexFormat.of().formatHex(hash);
    }

    public static String hashFileName(File file) {
        byte[] hash;
        try {
            InputStream inputStream = Files.newInputStream(file.toPath());
            DigestInputStream digestInputStream = new DigestInputStream(inputStream, SHA_256);
            hash = SHA_256.digest(digestInputStream.readAllBytes());
            inputStream.close();
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
        return HexFormat.of().formatHex(hash);
    }
}