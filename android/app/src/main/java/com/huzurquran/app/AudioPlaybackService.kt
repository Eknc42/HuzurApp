package com.huzurquran.app

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder
import android.support.v4.media.MediaMetadataCompat
import android.support.v4.media.session.MediaSessionCompat
import android.support.v4.media.session.PlaybackStateCompat
import android.util.Log
import android.content.Context
import android.os.PowerManager
import androidx.core.app.NotificationCompat
import androidx.core.app.ServiceCompat
import androidx.media.app.NotificationCompat as MediaNotificationCompat

class AudioPlaybackService : Service() {

    companion object {
        private const val TAG = "AudioPlaybackService"
        const val CHANNEL_ID = "huzur_audio_channel"
        const val NOTIFICATION_ID = 1001
        const val ACTION_UPDATE = "com.huzurquran.app.UPDATE_NOTIFICATION"
        const val ACTION_STOP = "com.huzurquran.app.STOP_SERVICE"
        const val EXTRA_TITLE = "title"
        const val EXTRA_DESCRIPTION = "description"
        const val EXTRA_MEDIA_TYPE = "media_type"
        const val EXTRA_CAN_SKIP_NEXT = "can_skip_next"
        const val EXTRA_CAN_SKIP_PREV = "can_skip_prev"
        const val EXTRA_IS_PLAYING = "is_playing"
    }

    private var mediaSession: MediaSessionCompat? = null
    private var currentIsPlaying: Boolean = true
    private var wakeLock: PowerManager.WakeLock? = null
    private var wifiLock: android.net.wifi.WifiManager.WifiLock? = null

    override fun onCreate() {
        super.onCreate()
        val powerManager = getSystemService(Context.POWER_SERVICE) as PowerManager
        wakeLock = powerManager.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "HuzurApp::AudioPlaybackWakeLock")
        wakeLock?.acquire()
        
        val wifiManager = applicationContext.getSystemService(Context.WIFI_SERVICE) as android.net.wifi.WifiManager
        wifiLock = wifiManager.createWifiLock(android.net.wifi.WifiManager.WIFI_MODE_FULL_HIGH_PERF, "HuzurApp::AudioWifiLock")
        wifiLock?.acquire()
        
        createNotificationChannel()
        initMediaSession()
    }

    private fun initMediaSession() {
        mediaSession = MediaSessionCompat(this, "HuzurMediaSession").apply {
            setCallback(object : MediaSessionCompat.Callback() {
                override fun onPlay() {
                    AudioServiceModule.emitAudioControlAction(AudioServiceModule.CONTROL_PLAY)
                }
                override fun onPause() {
                    AudioServiceModule.emitAudioControlAction(AudioServiceModule.CONTROL_PAUSE)
                }
                override fun onStop() {
                    AudioServiceModule.emitAudioControlAction(AudioServiceModule.CONTROL_STOP)
                }
                override fun onSkipToNext() {
                    AudioServiceModule.emitAudioControlAction(AudioServiceModule.CONTROL_NEXT)
                }
                override fun onSkipToPrevious() {
                    AudioServiceModule.emitAudioControlAction(AudioServiceModule.CONTROL_PREVIOUS)
                }
            })
            isActive = true
        }
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        promoteToForegroundSafely("Huzur", "Ses çalınıyor...")

        try {
            if (intent?.action == ACTION_STOP) {
                stopSelfSafely()
                return START_NOT_STICKY
            }
            val title = intent?.getStringExtra(EXTRA_TITLE) ?: "Huzur"
            val description = intent?.getStringExtra(EXTRA_DESCRIPTION) ?: "Ses çalınıyor..."
            val mediaType = intent?.getStringExtra(EXTRA_MEDIA_TYPE) ?: ""
            val canSkipNext = intent?.getBooleanExtra(EXTRA_CAN_SKIP_NEXT, false) ?: false
            val canSkipPrev = intent?.getBooleanExtra(EXTRA_CAN_SKIP_PREV, false) ?: false
            val isPlaying = intent?.getBooleanExtra(EXTRA_IS_PLAYING, true) ?: true
            currentIsPlaying = isPlaying

            updateMediaSessionMetadata(title, description)
            updateMediaSessionPlaybackState(isPlaying)
            promoteToForegroundSafely(title, description, mediaType, canSkipNext, canSkipPrev, isPlaying)
            return START_STICKY
        } catch (e: Exception) {
            Log.e(TAG, "Error in onStartCommand", e)
            stopSelfSafely()
            return START_NOT_STICKY
        }
    }

    private fun updateMediaSessionMetadata(title: String, description: String) {
        val metadata = MediaMetadataCompat.Builder()
            .putString(MediaMetadataCompat.METADATA_KEY_TITLE, title)
            .putString(MediaMetadataCompat.METADATA_KEY_ARTIST, description)
            .putString(MediaMetadataCompat.METADATA_KEY_ALBUM, "Huzur")
            .build()
        mediaSession?.setMetadata(metadata)
    }

    private fun updateMediaSessionPlaybackState(isPlaying: Boolean) {
        val state = if (isPlaying) PlaybackStateCompat.STATE_PLAYING else PlaybackStateCompat.STATE_PAUSED
        val playbackState = PlaybackStateCompat.Builder()
            .setActions(
                PlaybackStateCompat.ACTION_PLAY or
                PlaybackStateCompat.ACTION_PAUSE or
                PlaybackStateCompat.ACTION_STOP or
                PlaybackStateCompat.ACTION_SKIP_TO_NEXT or
                PlaybackStateCompat.ACTION_SKIP_TO_PREVIOUS
            )
            .setState(state, PlaybackStateCompat.PLAYBACK_POSITION_UNKNOWN, 1f)
            .build()
        mediaSession?.setPlaybackState(playbackState)
    }

    private fun promoteToForegroundSafely(
        title: String,
        description: String,
        mediaType: String = "",
        canSkipNext: Boolean = false,
        canSkipPrev: Boolean = false,
        isPlaying: Boolean = true
    ) {
        val notification = try {
            buildNotification(title, description, mediaType, canSkipNext, canSkipPrev, isPlaying)
        } catch (e: Exception) {
            Log.e(TAG, "Notification build failed, using fallback", e)
            buildFallbackNotification()
        }
        try {
            ServiceCompat.startForeground(
                this,
                NOTIFICATION_ID,
                notification,
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK
                } else 0
            )
        } catch (e: Exception) {
            Log.e(TAG, "startForeground failed", e)
            try {
                @Suppress("DEPRECATION")
                startForeground(NOTIFICATION_ID, notification)
            } catch (e2: Exception) {
                Log.e(TAG, "Plain startForeground also failed", e2)
            }
        }
    }

    private fun buildFallbackNotification(): Notification {
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Huzur")
            .setContentText("Ses çalınıyor...")
            .setSmallIcon(android.R.drawable.ic_media_play)
            .setOngoing(true)
            .setSilent(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        super.onDestroy()
        if (wakeLock?.isHeld == true) {
            wakeLock?.release()
        }
        wakeLock = null
        if (wifiLock?.isHeld == true) {
            wifiLock?.release()
        }
        wifiLock = null
        mediaSession?.isActive = false
        mediaSession?.release()
        mediaSession = null
        try {
            @Suppress("DEPRECATION")
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                stopForeground(STOP_FOREGROUND_REMOVE)
            } else {
                stopForeground(true)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error stopping foreground", e)
        }
    }

    private fun stopSelfSafely() {
        mediaSession?.isActive = false
        try {
            @Suppress("DEPRECATION")
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                stopForeground(STOP_FOREGROUND_REMOVE)
            } else {
                stopForeground(true)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error stopping foreground", e)
        }
        stopSelf()
    }

    override fun onTaskRemoved(rootIntent: Intent?) {
        super.onTaskRemoved(rootIntent)
        AudioServiceModule.emitAudioControlAction(AudioServiceModule.CONTROL_STOP)
        stopSelfSafely()
        android.os.Process.killProcess(android.os.Process.myPid())
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Huzur Ses Oynatıcı",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Kur'an tilaveti ve radyo arka plan bildirimi"
                setShowBadge(false)
                lockscreenVisibility = Notification.VISIBILITY_PUBLIC
            }
            val manager = getSystemService(NotificationManager::class.java)
            manager?.createNotificationChannel(channel)
        }
    }

    private fun buildAudioControlIntent(action: String, requestCode: Int): PendingIntent {
        val intent = Intent(this, AudioControlReceiver::class.java).apply {
            this.action = AudioControlReceiver.ACTION_AUDIO_CONTROL
            putExtra(AudioControlReceiver.EXTRA_CONTROL_ACTION, action)
        }
        return PendingIntent.getBroadcast(
            this,
            requestCode,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
    }

    private fun buildNotification(
        title: String,
        description: String,
        mediaType: String,
        canSkipNext: Boolean,
        canSkipPrev: Boolean = false,
        isPlaying: Boolean = true
    ): Notification {
        val openAppIntent = packageManager.getLaunchIntentForPackage(packageName)?.apply {
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        val pendingOpenApp = PendingIntent.getActivity(
            this, 0, openAppIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val pendingStop = buildAudioControlIntent(AudioServiceModule.CONTROL_STOP, 1)
        val pendingNext = buildAudioControlIntent(AudioServiceModule.CONTROL_NEXT, 2)
        val pendingPrev = buildAudioControlIntent(AudioServiceModule.CONTROL_PREVIOUS, 3)
        val pendingPlay = buildAudioControlIntent(AudioServiceModule.CONTROL_PLAY, 4)
        val pendingPause = buildAudioControlIntent(AudioServiceModule.CONTROL_PAUSE, 5)

        val actionIndices = mutableListOf<Int>()
        var actionIndex = 0

        val builder = NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle(title)
            .setContentText(description)
            .setSmallIcon(if (isPlaying) android.R.drawable.ic_media_play else android.R.drawable.ic_media_pause)
            .setContentIntent(pendingOpenApp)
            .setOngoing(isPlaying) // Allow swipe-to-dismiss when paused
            .setShowWhen(false)
            .setSilent(true)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setPriority(NotificationCompat.PRIORITY_LOW)

        // Previous action
        if (mediaType == "quran" && canSkipPrev) {
            builder.addAction(
                android.R.drawable.ic_media_previous,
                "Önceki Sure",
                pendingPrev
            )
            actionIndices.add(actionIndex)
            actionIndex++
        }

        // Play/Pause action
        if (isPlaying) {
            builder.addAction(
                android.R.drawable.ic_media_pause,
                "Duraklat",
                pendingPause
            )
        } else {
            builder.addAction(
                android.R.drawable.ic_media_play,
                "Oynat",
                pendingPlay
            )
        }
        actionIndices.add(actionIndex)
        actionIndex++

        // Next action
        if (mediaType == "quran" && canSkipNext) {
            builder.addAction(
                android.R.drawable.ic_media_next,
                "Sonraki Sure",
                pendingNext
            )
            actionIndices.add(actionIndex)
            actionIndex++
        }

        val sessionToken = mediaSession?.sessionToken
        if (sessionToken != null) {
            val mediaStyle = MediaNotificationCompat.MediaStyle()
                .setMediaSession(sessionToken)
                .setShowActionsInCompactView(*actionIndices.toIntArray())
            builder.setStyle(mediaStyle)
        }

        return builder.build()
    }
}
