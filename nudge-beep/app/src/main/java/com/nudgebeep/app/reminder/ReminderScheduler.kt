package com.nudgebeep.app.reminder

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log
import com.nudgebeep.app.data.local.AppDatabase
import com.nudgebeep.app.data.model.ReminderFrequency
import com.nudgebeep.app.data.model.TaskEntity
import com.nudgebeep.app.data.preferences.UserPreferences
import com.nudgebeep.app.reminder.receivers.DailySummaryReceiver
import com.nudgebeep.app.reminder.receivers.HourlyWatchdogReceiver
import com.nudgebeep.app.reminder.receivers.TaskReminderReceiver
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.util.Calendar

object ReminderScheduler {

    private const val TAG = "ReminderScheduler"
    private const val HOURLY_WATCHDOG_REQUEST_CODE = 9001
    private const val DAILY_SUMMARY_REQUEST_CODE = 9002
    private const val TEST_REMINDER_REQUEST_CODE = 9003

    fun scheduleTaskReminder(context: Context, task: TaskEntity) {
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager

        // If completed or reminders disabled -> cancel alarm
        if (!task.isActiveForReminders()) {
            cancelTaskReminder(context, task.id)
            return
        }

        val triggerAtMillis = calculateNextTriggerTime(task)
        if (triggerAtMillis <= System.currentTimeMillis()) return

        val intent = Intent(context, TaskReminderReceiver::class.java).apply {
            putExtra(NotificationHelper.EXTRA_TASK_ID, task.id)
        }
        val pendingIntent = PendingIntent.getBroadcast(
            context,
            task.id.toInt(),
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        setAlarmExact(alarmManager, triggerAtMillis, pendingIntent)
        Log.d(TAG, "Scheduled reminder for task ${task.id} (${task.title}) at $triggerAtMillis")
    }

    fun cancelTaskReminder(context: Context, taskId: Long) {
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        val intent = Intent(context, TaskReminderReceiver::class.java)
        val pendingIntent = PendingIntent.getBroadcast(
            context,
            taskId.toInt(),
            intent,
            PendingIntent.FLAG_NO_CREATE or PendingIntent.FLAG_IMMUTABLE
        )
        if (pendingIntent != null) {
            alarmManager.cancel(pendingIntent)
            pendingIntent.cancel()
            Log.d(TAG, "Cancelled reminder for task $taskId")
        }
    }

    fun scheduleHourlyWatchdog(context: Context) {
        val prefs = UserPreferences.getInstance(context)
        if (!prefs.isGlobalRemindersEnabled()) return

        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        val intent = Intent(context, HourlyWatchdogReceiver::class.java)
        val pendingIntent = PendingIntent.getBroadcast(
            context,
            HOURLY_WATCHDOG_REQUEST_CODE,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // Schedule next check at the start of the next hour
        val cal = Calendar.getInstance().apply {
            add(Calendar.HOUR_OF_DAY, 1)
            set(Calendar.MINUTE, 0)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
        }

        setAlarmExact(alarmManager, cal.timeInMillis, pendingIntent)
        Log.d(TAG, "Scheduled Hourly Watchdog at ${cal.time}")
    }

    fun scheduleDailySummary(context: Context, hour: Int = 19, minute: Int = 0) {
        val prefs = UserPreferences.getInstance(context)
        if (!prefs.isGlobalRemindersEnabled() || !prefs.isDailySummaryEnabled()) return

        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        val intent = Intent(context, DailySummaryReceiver::class.java)
        val pendingIntent = PendingIntent.getBroadcast(
            context,
            DAILY_SUMMARY_REQUEST_CODE,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val cal = Calendar.getInstance().apply {
            set(Calendar.HOUR_OF_DAY, hour)
            set(Calendar.MINUTE, minute)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
            // If time today already passed, schedule for tomorrow
            if (timeInMillis <= System.currentTimeMillis()) {
                add(Calendar.DAY_OF_YEAR, 1)
            }
        }

        setAlarmExact(alarmManager, cal.timeInMillis, pendingIntent)
        Log.d(TAG, "Scheduled Daily Summary at ${cal.time}")
    }

    /**
     * Reschedules all active reminders (called after boot, settings changes, or app launch)
     */
    fun rescheduleAllReminders(context: Context) {
        CoroutineScope(Dispatchers.IO).launch {
            val db = AppDatabase.getDatabase(context)
            val unfinished = db.taskDao().getUnfinishedTasksSync()
            unfinished.forEach { task ->
                scheduleTaskReminder(context, task)
            }

            val prefs = UserPreferences.getInstance(context)
            scheduleHourlyWatchdog(context)
            scheduleDailySummary(context, prefs.getDailySummaryHour(), prefs.getDailySummaryMinute())
        }
    }

    /**
     * Quick QA testing method: Triggers an exact reminder in specified seconds.
     */
    fun scheduleTestReminder(context: Context, delaySeconds: Int = 5) {
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        val intent = Intent(context, HourlyWatchdogReceiver::class.java).apply {
            putExtra("is_test", true)
        }
        val pendingIntent = PendingIntent.getBroadcast(
            context,
            TEST_REMINDER_REQUEST_CODE,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        val triggerAt = System.currentTimeMillis() + (delaySeconds * 1000L)
        setAlarmExact(alarmManager, triggerAt, pendingIntent)
    }

    private fun setAlarmExact(
        alarmManager: AlarmManager,
        triggerAtMillis: Long,
        pendingIntent: PendingIntent
    ) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                alarmManager.setExactAndAllowWhileIdle(
                    AlarmManager.RTC_WAKEUP,
                    triggerAtMillis,
                    pendingIntent
                )
            } else {
                alarmManager.setExact(AlarmManager.RTC_WAKEUP, triggerAtMillis, pendingIntent)
            }
        } catch (e: SecurityException) {
            // If SCHEDULE_EXACT_ALARM is revoked by user, fallback to setAndAllowWhileIdle
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                alarmManager.setAndAllowWhileIdle(
                    AlarmManager.RTC_WAKEUP,
                    triggerAtMillis,
                    pendingIntent
                )
            } else {
                alarmManager.set(AlarmManager.RTC_WAKEUP, triggerAtMillis, pendingIntent)
            }
        }
    }

    private fun calculateNextTriggerTime(task: TaskEntity): Long {
        val now = System.currentTimeMillis()

        return when (task.frequency) {
            ReminderFrequency.HOURLY,
            ReminderFrequency.EVERY_2_HOURS,
            ReminderFrequency.EVERY_3_HOURS,
            ReminderFrequency.EVERY_5_HOURS,
            ReminderFrequency.EVERY_6_HOURS -> {
                val interval = task.frequency.intervalMillis()
                val last = task.lastNotifiedAt ?: task.createdAt
                var next = last + interval
                while (next <= now) {
                    next += interval
                }
                next
            }
            ReminderFrequency.DAILY -> {
                val cal = Calendar.getInstance().apply {
                    if (task.dueDate != null) {
                        timeInMillis = task.dueDate
                    } else {
                        // Default to 19:00 or current hour + 24
                        set(Calendar.HOUR_OF_DAY, 19)
                        set(Calendar.MINUTE, 0)
                        set(Calendar.SECOND, 0)
                    }
                    if (timeInMillis <= now) {
                        add(Calendar.DAY_OF_YEAR, 1)
                    }
                }
                cal.timeInMillis
            }
            ReminderFrequency.WEEKLY -> {
                val cal = Calendar.getInstance().apply {
                    if (task.dueDate != null) {
                        timeInMillis = task.dueDate
                    }
                    if (timeInMillis <= now) {
                        add(Calendar.WEEK_OF_YEAR, 1)
                    }
                }
                cal.timeInMillis
            }
            ReminderFrequency.CUSTOM -> {
                calculateNextCustomScheduleTime(task, now)
            }
            ReminderFrequency.NONE -> 0L
        }
    }

    private fun calculateNextCustomScheduleTime(task: TaskEntity, now: Long): Long {
        val hour = task.customHour ?: 9
        val minute = task.customMinute ?: 0
        val targetDays = task.customDays
            ?.split(",")
            ?.mapNotNull { it.trim().toIntOrNull() }
            ?: listOf(Calendar.MONDAY, Calendar.TUESDAY, Calendar.WEDNESDAY, Calendar.THURSDAY, Calendar.FRIDAY)

        val cal = Calendar.getInstance()
        for (dayOffset in 0..14) {
            val candidate = Calendar.getInstance().apply {
                add(Calendar.DAY_OF_YEAR, dayOffset)
                set(Calendar.HOUR_OF_DAY, hour)
                set(Calendar.MINUTE, minute)
                set(Calendar.SECOND, 0)
                set(Calendar.MILLISECOND, 0)
            }
            val dayOfWeek = candidate.get(Calendar.DAY_OF_WEEK)
            if (targetDays.contains(dayOfWeek) && candidate.timeInMillis > now) {
                return candidate.timeInMillis
            }
        }
        return now + (24 * 60 * 60 * 1000L)
    }
}
