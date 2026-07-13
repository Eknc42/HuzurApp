package com.huzurquran.app

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log

class AudioControlReceiver : BroadcastReceiver() {
    companion object {
        private const val TAG = "AudioControlReceiver"
        const val ACTION_AUDIO_CONTROL = "com.huzurquran.app.AUDIO_CONTROL"
        const val EXTRA_CONTROL_ACTION = "control_action"
    }

    override fun onReceive(context: Context, intent: Intent?) {
        val action = intent?.getStringExtra(EXTRA_CONTROL_ACTION) ?: return

        try {
            // Just emit to JS — service lifecycle is managed by JS (dismissNotification)
            AudioServiceModule.emitAudioControlAction(action)
        } catch (e: Exception) {
            Log.e(TAG, "Error handling audio control action", e)
        }
    }
}
