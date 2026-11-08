package com.nudgebeep.app.reminder

import android.content.Context
import android.media.AudioAttributes
import android.media.AudioManager
import android.media.Ringtone
import android.media.RingtoneManager
import android.media.ToneGenerator
import android.net.Uri
import android.os.Build
import android.os.Handler
import android.os.Looper
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

object BeepSoundPlayer {

    private var activeRingtone: Ringtone? = null
    private var previewJob: Job? = null

    /**
     * Plays the signature 5-beep nudge pattern using ToneGenerator.
     * Short, crisp, and unmistakable.
     */
    fun playBeepPattern(context: Context, repeats: Int = 5) {
        CoroutineScope(Dispatchers.Default).launch {
            var toneGen: ToneGenerator? = null
            try {
                toneGen = ToneGenerator(AudioManager.STREAM_NOTIFICATION, 95)
                repeat(repeats) {
                    toneGen.startTone(ToneGenerator.TONE_PROP_BEEP, 120)
                    delay(200)
                }
            } catch (e: Exception) {
                // Fallback to default notification ringtone
                playSystemNotificationSound(context)
            } finally {
                toneGen?.release()
            }
        }
    }

    /**
     * Plays custom task sound, or falls back to the 5-beep pattern / default notification tone.
     */
    fun playSound(context: Context, soundUriString: String?) {
        if (soundUriString.isNullOrBlank() || soundUriString == "beep_5x") {
            playBeepPattern(context, 5)
            return
        }

        try {
            val uri = Uri.parse(soundUriString)
            val ringtone = RingtoneManager.getRingtone(context, uri)
            if (ringtone != null) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                    ringtone.audioAttributes = AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_NOTIFICATION_EVENT)
                        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                        .build()
                }
                ringtone.play()
                // Stop after 3 seconds if it's a long ringtone
                Handler(Looper.getMainLooper()).postDelayed({
                    runCatching {
                        if (ringtone.isPlaying) ringtone.stop()
                    }
                }, 3000)
            } else {
                playBeepPattern(context, 5)
            }
        } catch (e: Exception) {
            playBeepPattern(context, 5)
        }
    }

    /**
     * Preview sound inside task edit dialog or settings
     */
    fun previewSound(context: Context, soundUriString: String?, onComplete: () -> Unit = {}) {
        stopPreview()

        if (soundUriString.isNullOrBlank() || soundUriString == "beep_5x") {
            previewJob = CoroutineScope(Dispatchers.Default).launch {
                playBeepPattern(context, 5)
                delay(1200)
                Handler(Looper.getMainLooper()).post { onComplete() }
            }
            return
        }

        try {
            val uri = Uri.parse(soundUriString)
            val ringtone = RingtoneManager.getRingtone(context, uri)
            if (ringtone != null) {
                activeRingtone = ringtone
                ringtone.play()
                previewJob = CoroutineScope(Dispatchers.Default).launch {
                    delay(3000)
                    stopPreview()
                    Handler(Looper.getMainLooper()).post { onComplete() }
                }
            } else {
                playBeepPattern(context, 5)
                onComplete()
            }
        } catch (e: Exception) {
            playBeepPattern(context, 5)
            onComplete()
        }
    }

    fun stopPreview() {
        previewJob?.cancel()
        previewJob = null
        try {
            activeRingtone?.let {
                if (it.isPlaying) it.stop()
            }
        } catch (ignored: Exception) {}
        activeRingtone = null
    }

    private fun playSystemNotificationSound(context: Context) {
        try {
            val notificationUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)
            val r = RingtoneManager.getRingtone(context, notificationUri)
            r?.play()
        } catch (ignored: Exception) {}
    }
}
