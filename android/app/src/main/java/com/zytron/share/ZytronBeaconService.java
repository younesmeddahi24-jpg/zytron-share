package com.zytron.share;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.os.IBinder;
import android.os.PowerManager;
import android.util.Log;

import androidx.core.app.NotificationCompat;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.UUID;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

public class ZytronBeaconService extends Service {
    private static final String TAG = "ZytronBeaconService";
    private static final String CHANNEL_ID = "zytron_share_bg_channel";
    private static final int NOTIFICATION_ID = 1001;

    private PowerManager.WakeLock wakeLock;
    private ScheduledExecutorService scheduler;
    private String persistentPeerId;
    private String deviceName;
    private String brand;
    private String brandLabel;

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
        initDeviceInfo();
        acquireWakeLock();
        startForeground(NOTIFICATION_ID, buildForegroundNotification());
        startHeartbeatLoop();
    }

    private void initDeviceInfo() {
        SharedPreferences prefs = getSharedPreferences("zytron_prefs", MODE_PRIVATE);
        persistentPeerId = prefs.getString("persistent_peer_id", null);
        if (persistentPeerId == null) {
            persistentPeerId = "zytron-node-" + UUID.randomUUID().toString().substring(0, 8);
            prefs.edit().putString("persistent_peer_id", persistentPeerId).apply();
        }

        String manufacturer = Build.MANUFACTURER != null ? Build.MANUFACTURER.toLowerCase() : "android";
        String model = Build.MODEL != null ? Build.MODEL : "Telefoon";

        if (manufacturer.contains("samsung")) {
            brand = "samsung";
            brandLabel = "Samsung Galaxy";
        } else if (manufacturer.contains("xiaomi") || manufacturer.contains("redmi")) {
            brand = "xiaomi";
            brandLabel = "Xiaomi HyperOS";
        } else if (manufacturer.contains("huawei") || manufacturer.contains("honor")) {
            brand = "huawei";
            brandLabel = "Huawei EMUI";
        } else {
            brand = "android";
            brandLabel = "Android Toestel";
        }

        deviceName = prefs.getString("custom_device_name", null);
        if (deviceName == null || deviceName.trim().isEmpty()) {
            deviceName = (Build.MANUFACTURER != null ? Build.MANUFACTURER : "") + " " + model;
            deviceName = deviceName.trim();
        }
    }

    private void acquireWakeLock() {
        try {
            PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
            if (pm != null) {
                wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "ZytronShare:BackgroundBeacon");
                wakeLock.acquire(12 * 60 * 60 * 1000L); // 12 hours
            }
        } catch (Exception e) {
            Log.w(TAG, "WakeLock acquisition warning: " + e.getMessage());
        }
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "Zytron Share Achtergrondservice",
                    NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Houdt Zytron Share zichtbaar voor apparaten in de buurt");
            NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm != null) {
                nm.createNotificationChannel(channel);
            }
        }
    }

    private Notification buildForegroundNotification() {
        Intent launchIntent = new Intent(this, MainActivity.class);
        launchIntent.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent pendingIntent = PendingIntent.getActivity(
                this,
                0,
                launchIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0)
        );

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("Zytron Share is Actief")
                .setContentText("Je toestel (" + deviceName + ") is zichtbaar in de buurt")
                .setSmallIcon(R.mipmap.ic_launcher)
                .setOngoing(true)
                .setContentIntent(pendingIntent)
                .setPriority(NotificationCompat.PRIORITY_LOW);

        return builder.build();
    }

    private void showIncomingDropNotification(String sender, String fileName) {
        Intent launchIntent = new Intent(this, MainActivity.class);
        launchIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent pendingIntent = PendingIntent.getActivity(
                this,
                1002,
                launchIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0)
        );

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("📥 Nieuw Bestand Ontvangen!")
                .setContentText(fileName + " van " + sender + " — Tik om te openen")
                .setSmallIcon(R.mipmap.ic_launcher)
                .setAutoCancel(true)
                .setContentIntent(pendingIntent)
                .setPriority(NotificationCompat.PRIORITY_HIGH);

        NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm != null) {
            nm.notify(1003, builder.build());
        }
    }

    private void startHeartbeatLoop() {
        scheduler = Executors.newSingleThreadScheduledExecutor();
        scheduler.scheduleWithFixedDelay(new Runnable() {
            @Override
            public void run() {
                try {
                    sendRadarHeartbeat();
                } catch (Exception e) {
                    Log.w(TAG, "Radar heartbeat error: " + e.getMessage());
                }
            }
        }, 1, 4, TimeUnit.SECONDS);
    }

    private void sendRadarHeartbeat() {
        HttpURLConnection conn = null;
        try {
            URL url = new URL("https://zytron-share.vercel.app/api/radar");
            conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "application/json; charset=UTF-8");
            conn.setRequestProperty("Accept", "application/json");
            conn.setConnectTimeout(5000);
            conn.setReadTimeout(5000);
            conn.setDoOutput(true);

            JSONObject payload = new JSONObject();
            payload.put("peerId", persistentPeerId);
            payload.put("name", deviceName);
            payload.put("brand", brand);
            payload.put("brandLabel", brandLabel);
            payload.put("modelName", deviceName);
            payload.put("osSkin", "Android Native Service");
            payload.put("tenMinActive", true);
            payload.put("tenMinRemaining", 600);

            byte[] bytes = payload.toString().getBytes(StandardCharsets.UTF_8);
            try (OutputStream os = conn.getOutputStream()) {
                os.write(bytes);
                os.flush();
            }

            int responseCode = conn.getResponseCode();
            if (responseCode == 200) {
                BufferedReader br = new BufferedReader(new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8));
                StringBuilder sb = new StringBuilder();
                String line;
                while ((line = br.readLine()) != null) {
                    sb.append(line);
                }
                br.close();

                JSONObject res = new JSONObject(sb.toString());
                if (res.optBoolean("ok") && res.has("incomingDrops")) {
                    JSONArray incoming = res.getJSONArray("incomingDrops");
                    if (incoming.length() > 0) {
                        JSONObject firstDrop = incoming.getJSONObject(0);
                        String sender = firstDrop.optString("senderName", "Toestel");
                        String file = firstDrop.optString("fileName", "Bestand");
                        showIncomingDropNotification(sender, file);
                    }
                }
            }
        } catch (Exception e) {
            // Heartbeat retry
        } finally {
            if (conn != null) {
                conn.disconnect();
            }
        }
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        return START_STICKY;
    }

    @Override
    public void onDestroy() {
        if (scheduler != null && !scheduler.isShutdown()) {
            scheduler.shutdownNow();
        }
        if (wakeLock != null && wakeLock.isHeld()) {
            wakeLock.release();
        }
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
