/*
 *
 * Copyright (c) 2026 Robert Darvaš. All rights reserved.
 *
 * Part of the QeroChat project.
 * Written by Rob24Dev <https://github.com/Rob24Dev>
 *
 */

package cz.rob24dev.chatapp.server.dto.requests;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateProfileRequest {
    @NotBlank
    @Size(min = 3, max = 20)
    String name;
    String avatarUrl;
    String bannerUrl;
    @NotBlank
    String status;
    String statusText;

    public UpdateProfileRequest(String name, String avatarUrl, String bannerUrl, String status, String statusText) {
        this.name =name;
        this.avatarUrl = avatarUrl;
        this.bannerUrl = bannerUrl;
        this.status = status;
        this.statusText = statusText;
    }
}