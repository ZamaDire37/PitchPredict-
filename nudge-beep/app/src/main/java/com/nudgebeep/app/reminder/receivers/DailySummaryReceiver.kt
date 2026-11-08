package com.nudgebeep.app.reminder.receivers

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import com.nudgebeep.app.data.local.AppDatabase
import com.nudgebeep.app.data.preferences.UserPreferences
import com.nudgebeep.app.reminder.NotificationHelper
import com.nudgebeep.app.reminder.ReminderScheduler
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class DailySummaryReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        val pendingResult = goAsync()

        CoroutineScope(Dispatchers.IO).launch {
            try {
                val prefs = UserPreferences.getInstance(context)
                if (!prefs.isGlobalRemindersEnabled() || !prefs.isDailySummaryEnabled()) {
                    return@launch
                }

                val db = AppDatabase.getDatabase(context)
                val unfinished = db.taskDao().getUnfinishedTasksSync()

                // Only notify if there are unfinished tasks
                if (unfinished.isNotEmpty()) {
                    Log.d("DailySummaryReceiver", "Sending daily summary for ${unfinished.size} unfinished tasks")
                    NotificationHelper.showDailySummaryNotification(context, unfinished)
                }

                // Reschedule for next day
                ReminderScheduler.scheduleDailySummary(
                    context,
                    prefs.getDailySummaryHour(),
                    prefs.getDailySummaryMinute()
                )

            } catch (e: Exception) {
                Log.e("DailySummaryReceiver", "Error in daily summary receiver", e)
            } finally {
                pendingResult.finish()
            }
        }
    }
}
