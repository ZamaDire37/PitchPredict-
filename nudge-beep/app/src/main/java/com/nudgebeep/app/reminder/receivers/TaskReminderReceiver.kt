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

class TaskReminderReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        val taskId = intent.getLongExtra(NotificationHelper.EXTRA_TASK_ID, -1L)
        if (taskId == -1L) return

        val pendingResult = goAsync()

        CoroutineScope(Dispatchers.IO).launch {
            try {
                val prefs = UserPreferences.getInstance(context)
                if (!prefs.isGlobalRemindersEnabled()) {
                    Log.d("TaskReminderReceiver", "Global reminders disabled. Skipping task $taskId")
                    return@launch
                }

                val db = AppDatabase.getDatabase(context)
                val task = db.taskDao().getTaskById(taskId)

                // CRITICAL RULE: If task completed, deleted, or reminders disabled -> DO NOTHING!
                if (task == null || task.isCompleted || !task.remindersEnabled) {
                    Log.d("TaskReminderReceiver", "Task $taskId is completed, deleted or silent. Skipping.")
                    ReminderScheduler.cancelTaskReminder(context, taskId)
                    return@launch
                }

                val now = System.currentTimeMillis()
                db.taskDao().updateLastNotified(taskId, now)

                // Show notification and play selected sound
                NotificationHelper.showTaskReminder(context, task)

                // Reschedule for next reminder interval
                ReminderScheduler.scheduleTaskReminder(context, task.copy(lastNotifiedAt = now))

            } catch (e: Exception) {
                Log.e("TaskReminderReceiver", "Error processing task reminder", e)
            } finally {
                pendingResult.finish()
            }
        }
    }
}
