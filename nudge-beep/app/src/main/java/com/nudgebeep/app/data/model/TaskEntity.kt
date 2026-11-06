package com.nudgebeep.app.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "tasks")
data class TaskEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val title: String,
    val description: String? = null,
    val createdAt: Long = System.currentTimeMillis(),
    val dueDate: Long? = null,
    val priority: Priority = Priority.MEDIUM,
    val frequency: ReminderFrequency = ReminderFrequency.HOURLY,
    val customDays: String? = null,     // comma-separated Calendar.DAY_OF_WEEK e.g. "2,3,4,5,6" (Mon-Fri)
    val customHour: Int? = null,        // 0-23
    val customMinute: Int? = null,      // 0-59
    val soundUri: String? = null,       // null = system default or default beep pattern
    val soundTitle: String = "Default Nudge Beep (5x)",
    val remindersEnabled: Boolean = true,
    val isCompleted: Boolean = false,
    val completedAt: Long? = null,
    val lastNotifiedAt: Long? = null,
    val isCarriedOver: Boolean = false
) {
    /**
     * Checks if task is due or active today
     */
    fun isToday(): Boolean {
        if (dueDate == null) return true
        val calNow = java.util.Calendar.getInstance()
        val calDue = java.util.Calendar.getInstance().apply { timeInMillis = dueDate }
        return calNow.get(java.util.Calendar.YEAR) == calDue.get(java.util.Calendar.YEAR) &&
                calNow.get(java.util.Calendar.DAY_OF_YEAR) == calDue.get(java.util.Calendar.DAY_OF_YEAR)
    }

    /**
     * Returns true if task needs attention and reminders can be dispatched
     */
    fun isActiveForReminders(): Boolean {
        return !isCompleted && remindersEnabled && frequency != ReminderFrequency.NONE
    }
}
