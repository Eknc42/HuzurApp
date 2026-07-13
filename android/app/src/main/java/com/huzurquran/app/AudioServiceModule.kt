package com.huzurquran.app

import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.util.Log
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.Arguments
import com.facebook.react.modules.core.DeviceEventManagerModule
import android.provider.Settings
import android.net.Uri
import android.content.Context

class AudioServiceModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    companion object {
        private const val TAG = "AudioServiceModule"
        private const val AUDIO_CONTROL_EVENT = "HuzurAudioControl"
        const val CONTROL_STOP = "stop"
        const val CONTROL_NEXT = "next"
        const val CONTROL_PREVIOUS = "previous"
        const val CONTROL_PLAY = "play"
        const val CONTROL_PAUSE = "pause"
        private var moduleReactContext: ReactApplicationContext? = null

        fun emitAudioControlAction(action: String) {
            try {
                val payload = Arguments.createMap().apply {
                    putString("action", action)
                }
                moduleReactContext
                    ?.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                    ?.emit(AUDIO_CONTROL_EVENT, payload)
            } catch (e: Exception) {
                Log.e(TAG, "Error emitting audio control action", e)
            }
        }
    }

    override fun getName(): String = "AudioServiceModule"

    init {
        moduleReactContext = reactApplicationContext
    }

    private fun getStringOption(options: ReadableMap?, key: String, fallback: String): String {
        return if (options?.hasKey(key) == true && !options.isNull(key)) {
            options.getString(key) ?: fallback
        } else {
            fallback
        }
    }

    private fun getBooleanOption(options: ReadableMap?, key: String, fallback: Boolean): Boolean {
        return if (options?.hasKey(key) == true && !options.isNull(key)) {
            options.getBoolean(key)
        } else {
            fallback
        }
    }

    private fun hasNotificationPermission(): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            ContextCompat.checkSelfPermission(
                reactApplicationContext,
                android.Manifest.permission.POST_NOTIFICATIONS
            ) == PackageManager.PERMISSION_GRANTED
        } else {
            true
        }
    }

    @ReactMethod
    fun startService(title: String, description: String, options: ReadableMap?) {
        try {
            if (!hasNotificationPermission()) {
                Log.w(TAG, "No notification permission, skipping foreground service")
                return
            }

            val context = reactApplicationContext
            val intent = Intent(context, AudioPlaybackService::class.java).apply {
                putExtra(AudioPlaybackService.EXTRA_TITLE, title)
                putExtra(AudioPlaybackService.EXTRA_DESCRIPTION, description)
                putExtra(AudioPlaybackService.EXTRA_MEDIA_TYPE, getStringOption(options, "mediaType", ""))
                putExtra(AudioPlaybackService.EXTRA_CAN_SKIP_NEXT, getBooleanOption(options, "canSkipNext", false))
                putExtra(AudioPlaybackService.EXTRA_CAN_SKIP_PREV, getBooleanOption(options, "canSkipPrev", false))
                putExtra(AudioPlaybackService.EXTRA_IS_PLAYING, getBooleanOption(options, "isPlaying", true))
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error starting foreground service", e)
        }
    }

    @ReactMethod
    fun requestBatteryOptimization() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            try {
                val pm = reactApplicationContext.getSystemService(Context.POWER_SERVICE) as android.os.PowerManager
                if (!pm.isIgnoringBatteryOptimizations(reactApplicationContext.packageName)) {
                    val intent = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS).apply {
                        data = Uri.parse("package:${reactApplicationContext.packageName}")
                        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    }
                    reactApplicationContext.startActivity(intent)
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error requesting battery optimization", e)
            }
        }
    }

    @ReactMethod
    fun updateNotification(title: String, description: String, options: ReadableMap?) {
        try {
            if (!hasNotificationPermission()) return

            val context = reactApplicationContext
            val intent = Intent(context, AudioPlaybackService::class.java).apply {
                action = AudioPlaybackService.ACTION_UPDATE
                putExtra(AudioPlaybackService.EXTRA_TITLE, title)
                putExtra(AudioPlaybackService.EXTRA_DESCRIPTION, description)
                putExtra(AudioPlaybackService.EXTRA_MEDIA_TYPE, getStringOption(options, "mediaType", ""))
                putExtra(AudioPlaybackService.EXTRA_CAN_SKIP_NEXT, getBooleanOption(options, "canSkipNext", false))
                putExtra(AudioPlaybackService.EXTRA_CAN_SKIP_PREV, getBooleanOption(options, "canSkipPrev", false))
                putExtra(AudioPlaybackService.EXTRA_IS_PLAYING, getBooleanOption(options, "isPlaying", true))
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error updating notification", e)
        }
    }

    @ReactMethod
    fun stopService() {
        try {
            val context = reactApplicationContext
            val intent = Intent(context, AudioPlaybackService::class.java).apply {
                action = AudioPlaybackService.ACTION_STOP
            }
            context.startService(intent)
        } catch (e: Exception) {
            Log.e(TAG, "Error stopping foreground service", e)
        }
    }

    @ReactMethod
    fun addListener(eventName: String) = Unit

    @ReactMethod
    fun removeListeners(count: Int) = Unit
}
