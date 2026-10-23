package cz.rob24dev.chatapp.server.services;

import cz.rob24dev.chatapp.server.exceptions.FileUploadFailedException;
import cz.rob24dev.chatapp.server.models.FileType;
import cz.rob24dev.chatapp.server.models.logs.LogType;
import cz.rob24dev.chatapp.server.services.tokens.HashManager;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.minio.StatObjectArgs;
import io.minio.StatObjectResponse;
import io.minio.errors.MinioException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@Configuration
public class FileUploadService {
    private final AuditLogsService auditLogsService;
    private final FileTypeService fileTypeService;
    @Value("${minio.access.key}")
    private String accessKey;
    @Value("${minio.secret.key}")
    private String secretKey;
    @Value("${minio.endpoint}")
    private String minioUrl;

    public FileUploadService(AuditLogsService auditLogsService, FileTypeService fileTypeService) {
        this.auditLogsService = auditLogsService;
        this.fileTypeService = fileTypeService;
    }

    @Bean
    public MinioClient minioClient() {
        return MinioClient.builder()
                .endpoint(minioUrl)
                .credentials(accessKey, secretKey)
                .build();
    }

    public File validateFileAndGetValidFile(MultipartFile file, FileType fileType) {
        BufferedImage originalImage;
        try {
            if (!fileTypeService.validateFile(file)) {
                throw new FileUploadFailedException("Neplatný soubor");
            }
            originalImage = ImageIO.read(file.getInputStream());
        } catch (IOException e) {
            throw new RuntimeException(e);
        }

        if (!checkSizeAndRatio(originalImage, fileType)) throw new FileUploadFailedException("Neplatné rozlišení.");

        File outputFile = new File("output.jpg");
        try {
            ImageIO.write(originalImage, "jpg", outputFile);
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
        return outputFile;
    }

    private boolean checkSizeAndRatio(BufferedImage originalImage, FileType fileType) {
        float aspectRatio = (float) originalImage.getWidth() / originalImage.getHeight();

        if (fileType == FileType.BANNER) {
            return (originalImage.getWidth() <= 2000 && originalImage.getHeight() <= 1200
                    && originalImage.getWidth() >= 600 && originalImage.getHeight() >= 150)
                    && ((aspectRatio >= 3 && aspectRatio <= 10) || aspectRatio == (float) 16 / 9);
        } else if (fileType == FileType.CHAT_ICON || fileType == FileType.PROFILE_PICTURE) {
            return (originalImage.getWidth() <= 256 && originalImage.getHeight() <= 256
                    && originalImage.getWidth() >= 64 && originalImage.getHeight() >= 64)
                    && aspectRatio == 1;
        }
        return false;
    }

    public String uploadFileToMinio(File file, UUID requestorId) {
        if (file == null) throw new FileUploadFailedException("Neplatný soubor.");
        try {
            String fileName = HashManager.hashFileName(file);
            InputStream fileInputStream = Files.newInputStream(file.toPath());

            String objectUrlIfExist = getObjectUrlIfExist(fileName);
            if (objectUrlIfExist != null) return objectUrlIfExist;
            minioClient().putObject(
                    PutObjectArgs.builder()
                            .bucket("chatapp-uploads")
                            .object(fileName)
                            .stream(fileInputStream, file.length(), -1L)
                            .contentType("image/jpg")
                            .build());
            fileInputStream.close();

            auditLogsService.log(
                    LogType.FILE_UPLOAD,
                    requestorId,
                    UUID.randomUUID().toString(),
                    Map.of(
                            "fileName:", fileName
                    )
            );
            return minioUrl + "/chatapp-uploads/" + fileName;
        } catch (IOException | MinioException e) {
            log.error("Failed to upload file: {}", e.getMessage());
        }
        return null;
    }

    public String getObjectUrlIfExist(String fileName) {
        try {
            StatObjectResponse statObject =
                    minioClient().statObject(
                            StatObjectArgs.builder()
                                    .bucket("chatapp-uploads")
                                    .object(fileName).build());
            return minioUrl + "/chatapp-uploads/" + statObject.object();
        } catch (MinioException ex) {
            return null;
        }
    }
}