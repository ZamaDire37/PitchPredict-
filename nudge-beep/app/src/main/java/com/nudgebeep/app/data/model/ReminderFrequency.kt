package com.nudgebeep.app.data.model

enum class ReminderFrequency(val label: String, val minutes: Long) {
    HOURLY("Every hour", 60L),
    EVERY_2_HOURS("Every 2 hours", 120L),
    EVERY_3_HOURS("Every 3 hours", 180L),
    EVERY_5_HOURS("Every 5 hours", 300L),
    EVERY_6_HOURS("Every 6 hours", 360L),
    DAILY("Once a day", 1440L),
    CUSTOM("Custom schedule", 0L),
    WEEKLY("Once a week", 10080L),
    NONE("No reminders", -1L);

    fun intervalMillis(): Long = if (minutes > 0) minutes * 60 * 1000L else 0L

    companion object {
        fun fromMinutes(minutes: Long): ReminderFrequency {
            return entries.firstOrNull { it.minutes == minutes } ?: HOURLY
        }
    }
}
