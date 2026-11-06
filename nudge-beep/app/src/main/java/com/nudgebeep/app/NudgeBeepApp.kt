package com.nudgebeep.app

import android.app.Application
import com.nudgebeep.app.data.local.AppDatabase
import com.nudgebeep.app.data.preferences.UserPreferences
import com.nudgebeep.app.data.repository.TaskRepository
import com.nudgebeep.app.reminder.NotificationHelper
import com.nudgebeep.app.reminder.ReminderScheduler
import com.nudgebeep.app.reminder.workers.PeriodicWatchdogWorker

class NudgeBeepApp : Application() {

    val database by lazy { AppDatabase.getDatabase(this) }
    val userPreferences by lazy { UserPreferences.getInstance(this) }
    val repository by lazy { TaskRepository(this, database.taskDao()) }

    override fun onCreate() {
        super.onCreate()

        // 1. Initialize Notification Channels
        NotificationHelper.createNotificationChannels(this)

        // 2. Schedule Hourly Watchdog & Daily Summary
        ReminderScheduler.scheduleHourlyWatchdog(this)
        val summaryHour = userPreferences.getDailySummaryHour()
        val summaryMinute = userPreferences.getDailySummaryMinute()
        ReminderScheduler.scheduleDailySummary(this, summaryHour, summaryMinute)

        // 3. Register WorkManager Periodic Watchdog as fallback
        PeriodicWatchdogWorker.enqueue(this)

        // 4. Reschedule all individual active alarms
        ReminderScheduler.rescheduleAllReminders(this)
    }
}
