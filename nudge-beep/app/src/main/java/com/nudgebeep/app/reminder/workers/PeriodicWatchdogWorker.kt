package com.nudgebeep.app.reminder.workers

import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import com.nudgebeep.app.data.local.AppDatabase
import com.nudgebeep.app.data.preferences.UserPreferences
import com.nudgebeep.app.reminder.NotificationHelper
import java.util.concurrent.TimeUnit

class PeriodicWatchdogWorker(
    appContext: Context,
    workerParams: WorkerParameters
) : CoroutineWorker(appContext, workerParams) {

    override suspend fun doWork(): Result {
        val prefs = UserPreferences.getInstance(applicationContext)
        if (!prefs.isGlobalRemindersEnabled()) {
            return Result.success()
        }

        val db = AppDatabase.getDatabase(applicationContext)
        val unfinished = db.taskDao().getUnfinishedTasksSync()

        // Rule: Only remind if unfinished tasks exist!
        if (unfinished.isNotEmpty()) {
            NotificationHelper.showHourlyBeepReminder(applicationContext, unfinished)
        }

        return Result.success()
    }

    companion object {
        private const val WORK_NAME = "nudge_beep_periodic_watchdog"

        fun enqueue(context: Context) {
            val workRequest = PeriodicWorkRequestBuilder<PeriodicWatchdogWorker>(
                1, TimeUnit.HOURS
            ).build()

            WorkManager.getInstance(context).enqueueUniquePeriodicWork(
                WORK_NAME,
                ExistingPeriodicWorkPolicy.KEEP,
                workRequest
            )
        }
    }
}
