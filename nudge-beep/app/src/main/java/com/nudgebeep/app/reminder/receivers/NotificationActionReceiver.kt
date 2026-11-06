package com.nudgebeep.app.reminder.receivers

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import com.nudgebeep.app.data.local.AppDatabase
import com.nudgebeep.app.reminder.NotificationHelper
import com.nudgebeep.app.reminder.ReminderScheduler
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class NotificationActionReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == NotificationHelper.ACTION_MARK_DONE) {
            val taskId = intent.getLongExtra(NotificationHelper.EXTRA_TASK_ID, -1L)
            if (taskId == -1L) return

            val pendingResult = goAsync()

            CoroutineScope(Dispatchers.IO).launch {
                try {
                    val db = AppDatabase.getDatabase(context)
                    db.taskDao().setTaskCompleted(
                        id = taskId,
                        isCompleted = true,
                        completedAt = System.currentTimeMillis()
                    )

                    // Immediately cancel upcoming reminder for this task
                    ReminderScheduler.cancelTaskReminder(context, taskId)

                    // Dismiss the active notification
                    NotificationHelper.cancelNotification(context, taskId.toInt())

                    Log.d("NotificationActionReceiver", "Task $taskId marked as completed from notification")
                } catch (e: Exception) {
                    Log.e("NotificationActionReceiver", "Failed to mark task $taskId done", e)
                } finally {
                    pendingResult.finish()
                }
            }
        }
    }
}
