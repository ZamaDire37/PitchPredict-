package com.nudgebeep.app.reminder

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.os.Build
import androidx.core.app.NotificationCompat
import com.nudgebeep.app.R
import com.nudgebeep.app.data.model.TaskEntity
import com.nudgebeep.app.reminder.receivers.NotificationActionReceiver
import com.nudgebeep.app.ui.MainActivity

object NotificationHelper {

    const val CHANNEL_TASK_REMINDERS = "nudge_beep_task_reminders"
    const val CHANNEL_HOURLY_BEEP = "nudge_beep_hourly_nudges"
    const val CHANNEL_DAILY_SUMMARY = "nudge_beep_daily_summary"

    const val EXTRA_TASK_ID = "extra_task_id"
    const val EXTRA_ACTION = "extra_action"
    const val EXTRA_OPEN_DAILY_SUMMARY = "extra_open_daily_summary"
    const val ACTION_MARK_DONE = "com.nudgebeep.app.ACTION_MARK_DONE"

    fun createNotificationChannels(context: Context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val notificationManager =
                context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

            // Task Reminders Channel
            val taskChannel = NotificationChannel(
                CHANNEL_TASK_REMINDERS,
                context.getString(R.string.channel_task_reminders_name),
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = context.getString(R.string.channel_task_reminders_desc)
                enableLights(true)
                lightColor = Color.GREEN
                enableVibration(true)
                vibrationPattern = longArrayOf(0, 150, 100, 150, 100, 150)
                setShowBadge(true)
            }

            // Hourly Nudge Beep Channel
            val hourlyChannel = NotificationChannel(
                CHANNEL_HOURLY_BEEP,
                context.getString(R.string.channel_hourly_beep_name),
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = context.getString(R.string.channel_hourly_beep_desc)
                enableLights(true)
                lightColor = Color.CYAN
                enableVibration(true)
                vibrationPattern = longArrayOf(0, 120, 120, 120, 120, 120, 120, 120)
                setShowBadge(true)
            }

            // Daily Summary Channel
            val summaryChannel = NotificationChannel(
                CHANNEL_DAILY_SUMMARY,
                context.getString(R.string.channel_daily_summary_name),
                NotificationManager.IMPORTANCE_DEFAULT
            ).apply {
                description = context.getString(R.string.channel_daily_summary_desc)
                enableLights(true)
                setShowBadge(true)
            }

            notificationManager.createNotificationChannels(
                listOf(taskChannel, hourlyChannel, summaryChannel)
            )
        }
    }

    /**
     * Shows a reminder for an individual task.
     */
    fun showTaskReminder(context: Context, task: TaskEntity) {
        val notificationManager =
            context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        // Content intent to open app to this specific task
        val openIntent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            putExtra(EXTRA_TASK_ID, task.id)
        }
        val contentPendingIntent = PendingIntent.getActivity(
            context,
            task.id.toInt(),
            openIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // Action intent to mark task as done directly from notification
        val markDoneIntent = Intent(context, NotificationActionReceiver::class.java).apply {
            action = ACTION_MARK_DONE
            putExtra(EXTRA_TASK_ID, task.id)
        }
        val markDonePendingIntent = PendingIntent.getBroadcast(
            context,
            (task.id + 10000).toInt(),
            markDoneIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val priorityText = "[${task.priority.label.uppercase()} PRIORITY]"
        val notification = NotificationCompat.Builder(context, CHANNEL_TASK_REMINDERS)
            .setSmallIcon(R.drawable.ic_notification)
            .setContentTitle("Reminder: ${task.title}")
            .setContentText(task.description?.takeIf { it.isNotBlank() } ?: "$priorityText Complete your unfinished task.")
            .setStyle(NotificationCompat.BigTextStyle().bigText(
                (task.description?.let { "$it\n" } ?: "") + "$priorityText Reminding per your ${task.frequency.label} schedule."
            ))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_REMINDER)
            .setAutoCancel(true)
            .setContentIntent(contentPendingIntent)
            .addAction(0, "✓ Mark as Done", markDonePendingIntent)
            .build()

        notificationManager.notify(task.id.toInt(), notification)

        // Play the task's custom sound or signature beep pattern
        BeepSoundPlayer.playSound(context, task.soundUri)
    }

    /**
     * Shows hourly check notification when unfinished tasks exist.
     */
    fun showHourlyBeepReminder(context: Context, unfinishedTasks: List<TaskEntity>) {
        if (unfinishedTasks.isEmpty()) return

        val notificationManager =
            context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        val openIntent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        val contentPendingIntent = PendingIntent.getActivity(
            context,
            9998,
            openIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val count = unfinishedTasks.size
        val taskTitles = unfinishedTasks.take(3).joinToString(", ") { it.title }
        val moreText = if (count > 3) " and ${count - 3} more" else ""

        val notification = NotificationCompat.Builder(context, CHANNEL_HOURLY_BEEP)
            .setSmallIcon(R.drawable.ic_notification)
            .setContentTitle("Hey! You still have unfinished tasks")
            .setContentText("$count tasks remaining: $taskTitles$moreText")
            .setStyle(NotificationCompat.BigTextStyle().bigText(
                "You have $count unfinished task(s):\n• " +
                        unfinishedTasks.joinToString("\n• ") { it.title }
            ))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_REMINDER)
            .setAutoCancel(true)
            .setContentIntent(contentPendingIntent)
            .build()

        notificationManager.notify(9998, notification)

        // Distinctive 5-beep audio pattern as specified in requirements
        BeepSoundPlayer.playBeepPattern(context, 5)
    }

    /**
     * Shows Daily Summary notification at 7:00 PM (or user set time)
     */
    fun showDailySummaryNotification(context: Context, unfinishedTasks: List<TaskEntity>) {
        if (unfinishedTasks.isEmpty()) return

        val notificationManager =
            context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        val openSummaryIntent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            putExtra(EXTRA_OPEN_DAILY_SUMMARY, true)
        }
        val pendingIntent = PendingIntent.getActivity(
            context,
            9999,
            openSummaryIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val count = unfinishedTasks.size
        val notification = NotificationCompat.Builder(context, CHANNEL_DAILY_SUMMARY)
            .setSmallIcon(R.drawable.ic_notification)
            .setContentTitle("Daily Summary: Unfinished Tasks")
            .setContentText("You still have $count unfinished tasks today. Tap to review them.")
            .setStyle(NotificationCompat.BigTextStyle().bigText(
                "You still have $count unfinished tasks today:\n• " +
                        unfinishedTasks.joinToString("\n• ") { it.title } +
                        "\n\nTap to Clear All or Keep for Tomorrow."
            ))
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .setAutoCancel(true)
            .setContentIntent(pendingIntent)
            .build()

        notificationManager.notify(9999, notification)
        BeepSoundPlayer.playBeepPattern(context, 3)
    }

    fun cancelNotification(context: Context, notificationId: Int) {
        val notificationManager =
            context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        notificationManager.cancel(notificationId)
    }
}
