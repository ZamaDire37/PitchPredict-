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

class HourlyWatchdogReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        val isTest = intent.getBooleanExtra("is_test", false)
        val pendingResult = goAsync()

        CoroutineScope(Dispatchers.IO).launch {
            try {
                val prefs = UserPreferences.getInstance(context)
                if (!prefs.isGlobalRemindersEnabled() && !isTest) {
                    Log.d("HourlyWatchdogReceiver", "Reminders globally disabled. Skipping check.")
                    return@launch
                }

                val db = AppDatabase.getDatabase(context)
                val unfinished = db.taskDao().getUnfinishedTasksSync()

                // CRITICAL RULE 1:
                // If NO unfinished tasks exist -> DO ABSOLUTELY NOTHING. STAY QUIET.
                if (unfinished.isEmpty()) {
                    Log.d("HourlyWatchdogReceiver", "No unfinished tasks found. App remains quiet.")
                } else {
                    Log.d("HourlyWatchdogReceiver", "Found ${unfinished.size} unfinished tasks. Triggering 5-beep nudge!")
                    NotificationHelper.showHourlyBeepReminder(context, unfinished)
                }

                // Reschedule next hourly check (unless this was a one-off test reminder)
                if (!isTest) {
                    ReminderScheduler.scheduleHourlyWatchdog(context)
                }

            } catch (e: Exception) {
                Log.e("HourlyWatchdogReceiver", "Error in hourly reminder watchdog", e)
            } finally {
                pendingResult.finish()
            }
        }
    }
}
