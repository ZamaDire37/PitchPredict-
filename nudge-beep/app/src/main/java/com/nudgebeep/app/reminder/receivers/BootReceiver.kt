package com.nudgebeep.app.reminder.receivers

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import com.nudgebeep.app.reminder.ReminderScheduler

class BootReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        val action = intent.action
        if (action == Intent.ACTION_BOOT_COMPLETED ||
            action == Intent.ACTION_MY_PACKAGE_REPLACED ||
            action == Intent.ACTION_TIME_CHANGED ||
            action == Intent.ACTION_TIMEZONE_CHANGED
        ) {
            Log.d("BootReceiver", "Device restarted or time changed ($action). Rescheduling all Nudge Beep reminders.")
            ReminderScheduler.rescheduleAllReminders(context)
        }
    }
}
