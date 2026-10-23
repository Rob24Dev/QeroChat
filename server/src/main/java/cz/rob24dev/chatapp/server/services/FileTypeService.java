package cz.rob24dev.chatapp.server.services;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;

@Service
//Thanks https://github.com/pavelkalas for teaching me about file validation
public class FileTypeService {
    private final ArrayList<FileType> fileTypes = new ArrayList<>();

    public enum State {
        Valid, Unknown, EmptyFile, UndefinedError
    }

    public FileTypeService() {
        fileTypes.add(new FileType("JPG", new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF}));
        fileTypes.add(new FileType("PNG", new byte[]{(byte) 0x89, (byte) 0x50, (byte) 0x4E}));
        fileTypes.add(new FileType("JPEG", new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF}));
        fileTypes.add(new FileType("WEBP", new byte[]{(byte) 0x52, (byte) 0x49, (byte) 0x46}));
    }

    public boolean validateFile(MultipartFile file) {
        return getFileState(file) == State.Valid;
    }

    public State getFileState(MultipartFile file) {
        try {
            int maxHeaderLength = 0;

            for (FileType type : fileTypes) {
                maxHeaderLength = Math.max(maxHeaderLength, type.minFileLength);
            }

            byte[] header = new byte[maxHeaderLength];

            int bytesRead = file.getInputStream().read(header);
            if (bytesRead <= 0) {
                return State.EmptyFile;
            }

            if (bytesRead < header.length) {
                header = Arrays.copyOf(header, bytesRead);
            }

            for (FileType type : fileTypes) {
                if (type.isValid(header)) {
                    return State.Valid;
                }
            }

            return State.Unknown;
        } catch (IOException e) {
            return State.UndefinedError;
        }
    }

    static class FileType {
        public final byte[] flags;
        public final int minFileLength;
        public final String extension;

        public FileType(String extension, byte[] flags) {
            this.extension = extension;
            this.flags = flags;
            this.minFileLength = flags.length;
        }

        @Override
        public String toString() {
            return extension.toUpperCase();
        }

        public boolean isValid(byte[] header) {
            if (header.length < minFileLength) {
                return false;
            }

            for (int i = 0; i < minFileLength; i++) {
                if ((header[i] & 0xFF) != (flags[i] & 0xFF)) {
                    return false;
                }
            }
            return true;
        }
    }
}