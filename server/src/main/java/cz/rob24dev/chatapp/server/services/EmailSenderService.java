package cz.rob24dev.chatapp.server.services;

import cz.rob24dev.chatapp.server.models.User;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Component;
import org.springframework.util.StreamUtils;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

@Component
@Slf4j
public class EmailSenderService {

    private final JavaMailSender javaMailSender;

    @Value("${spring.mail.username}")
    private String sender;
    @Value("${application.frontend}")
    private String url;

    public EmailSenderService(JavaMailSender javaMailSender) {
        this.javaMailSender = javaMailSender;
    }

    public void sendResetPasswordEmail(User user, String token) {
        if (user == null) return;
        MimeMessage mimeMessage = javaMailSender.createMimeMessage();
        try {
            String emailTemplate = StreamUtils.copyToString(
                            new ClassPathResource("email/reset-password.html").getInputStream(), StandardCharsets.UTF_8)
                    .replace("{{name}}", user.getName())
                    .replace("{{resetUrl}}", url + "/?reset=" + token)
                    .replace("{{expiry}}", "15");
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage);
            helper.setFrom(sender);
            helper.setTo(user.getEmail());
            helper.setSubject("QeroChat - Obnova hesla");
            helper.setText(emailTemplate, true);
            javaMailSender.send(mimeMessage);
        } catch (IOException | MessagingException ex) {
            log.error("Error while sending reset password mail:{}", ex.getMessage());
        }
    }

    public void sendVerifyEmail(User user, String token, String to) {
        if (user == null) return;
        MimeMessage mimeMessage = javaMailSender.createMimeMessage();
        try {
            String emailTemplate = StreamUtils.copyToString(
                            new ClassPathResource("email/verify-email.html").getInputStream(), StandardCharsets.UTF_8)
                    .replace("{{name}}", user.getName())
                    .replace("{{confirmUrl}}", url + "/?confirm-email=" + token)
                    .replace("{{expiry}}", "30");
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage);
            helper.setFrom(sender);
            helper.setTo(to);
            helper.setSubject("QeroChat - Ověření emailu");
            helper.setText(emailTemplate, true);
            javaMailSender.send(mimeMessage);
        } catch (IOException | MessagingException ex) {
            log.error("Error while sending verify mail:{}", ex.getMessage());
        }
    }

    public void sendBetaSignUpVerifyEmail(String to) {
        MimeMessage mimeMessage = javaMailSender.createMimeMessage();
        try {
            String emailTemplate = StreamUtils.copyToString(
                            new ClassPathResource("email/verify-beta.html").getInputStream(), StandardCharsets.UTF_8)
                    .replace("{{email}}", to);
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage);
            helper.setFrom(sender);
            helper.setTo(to);
            helper.setSubject("QeroChat - Potvrzení o přihlášení do beta programu");
            helper.setText(emailTemplate, true);
            javaMailSender.send(mimeMessage);
        } catch (IOException | MessagingException ex) {
            log.error("Error while sending beta sign up mail:{}", ex.getMessage());
        }
    }
}