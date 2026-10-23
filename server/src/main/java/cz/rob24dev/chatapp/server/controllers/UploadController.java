package cz.rob24dev.chatapp.server.controllers;

import cz.rob24dev.chatapp.server.models.FileType;
import cz.rob24dev.chatapp.server.services.FileUploadService;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.awt.*;
import java.io.*;
import java.util.Map;
import java.util.UUID;

@RestController
@Slf4j
@RequestMapping("/v1")
public class UploadController {

    private final FileUploadService fileUploadService;

    public UploadController(FileUploadService fileUploadService) {
        this.fileUploadService = fileUploadService;
    }

    @PostMapping("/upload")
    public ResponseEntity<?> uploadFile(@Valid @RequestParam("file") MultipartFile file, @RequestParam("fileType") FileType fileType, @RequestAttribute("authenticatedUserId") UUID userId) {
        File outputFile = fileUploadService.validateFileAndGetValidFile(file, fileType);
        return ResponseEntity.ok(Map.of("url", fileUploadService.uploadFileToMinio(outputFile, userId)));
    }
}