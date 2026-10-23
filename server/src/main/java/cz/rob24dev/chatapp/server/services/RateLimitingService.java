package cz.rob24dev.chatapp.server.services;

import io.github.bucket4j.Bucket;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class RateLimitingService {

    private final Map<String, Bucket> cache = new ConcurrentHashMap<>();

    private Bucket createNewBucket() {
        return Bucket.builder()
                .addLimit(limit -> limit.capacity(50).refillGreedy(1, Duration.ofSeconds(2)))
                .build();
    }

    public Bucket resolveBucket(String key) {
        return cache.computeIfAbsent(key, _ -> createNewBucket());
    }
}
