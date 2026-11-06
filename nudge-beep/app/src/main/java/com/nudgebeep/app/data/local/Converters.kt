package com.nudgebeep.app.data.local

import androidx.room.TypeConverter
import com.nudgebeep.app.data.model.Priority
import com.nudgebeep.app.data.model.ReminderFrequency

class Converters {
    @TypeConverter
    fun fromPriority(priority: Priority): String = priority.name

    @TypeConverter
    fun toPriority(value: String): Priority = runCatching { Priority.valueOf(value) }.getOrDefault(Priority.MEDIUM)

    @TypeConverter
    fun fromFrequency(frequency: ReminderFrequency): String = frequency.name

    @TypeConverter
    fun toFrequency(value: String): ReminderFrequency = runCatching { ReminderFrequency.valueOf(value) }.getOrDefault(ReminderFrequency.HOURLY)
}
