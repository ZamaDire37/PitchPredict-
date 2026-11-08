package com.nudgebeep.app.data.preferences

import android.content.Context
import android.content.SharedPreferences
import com.nudgebeep.app.data.model.ReminderFrequency
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

class UserPreferences(context: Context) {

    private val prefs: SharedPreferences =
        context.getSharedPreferences("nudge_beep_prefs", Context.MODE_PRIVATE)

    private val _globalRemindersEnabled = MutableStateFlow(isGlobalRemindersEnabled())
    val globalRemindersEnabled: StateFlow<Boolean> = _globalRemindersEnabled.asStateFlow()

    private val _dailySummaryTime = MutableStateFlow(Pair(getDailySummaryHour(), getDailySummaryMinute()))
    val dailySummaryTime: StateFlow<Pair<Int, Int>> = _dailySummaryTime.asStateFlow()

    fun isGlobalRemindersEnabled(): Boolean {
        return prefs.getBoolean(KEY_GLOBAL_REMINDERS, true)
    }

    fun setGlobalRemindersEnabled(enabled: Boolean) {
        prefs.edit().putBoolean(KEY_GLOBAL_REMINDERS, enabled).apply()
        _globalRemindersEnabled.value = enabled
    }

    fun getDailySummaryHour(): Int = prefs.getInt(KEY_DAILY_SUMMARY_HOUR, 19) // 7:00 PM
    fun getDailySummaryMinute(): Int = prefs.getInt(KEY_DAILY_SUMMARY_MINUTE, 0)

    fun setDailySummaryTime(hour: Int, minute: Int) {
        prefs.edit()
            .putInt(KEY_DAILY_SUMMARY_HOUR, hour)
            .putInt(KEY_DAILY_SUMMARY_MINUTE, minute)
            .apply()
        _dailySummaryTime.value = Pair(hour, minute)
    }

    fun isDailySummaryEnabled(): Boolean {
        return prefs.getBoolean(KEY_DAILY_SUMMARY_ENABLED, true)
    }

    fun setDailySummaryEnabled(enabled: Boolean) {
        prefs.edit().putBoolean(KEY_DAILY_SUMMARY_ENABLED, enabled).apply()
    }

    fun getDefaultFrequency(): ReminderFrequency {
        val name = prefs.getString(KEY_DEFAULT_FREQUENCY, ReminderFrequency.DAILY.name)
        return runCatching { ReminderFrequency.valueOf(name ?: ReminderFrequency.DAILY.name) }
            .getOrDefault(ReminderFrequency.DAILY)
    }

    fun setDefaultFrequency(frequency: ReminderFrequency) {
        prefs.edit().putString(KEY_DEFAULT_FREQUENCY, frequency.name).apply()
    }

    fun getHourlyBeepCount(): Int {
        return prefs.getInt(KEY_HOURLY_BEEP_COUNT, 5)
    }

    fun setHourlyBeepCount(count: Int) {
        prefs.edit().putInt(KEY_HOURLY_BEEP_COUNT, count).apply()
    }

    companion object {
        private const val KEY_GLOBAL_REMINDERS = "key_global_reminders"
        private const val KEY_DAILY_SUMMARY_HOUR = "key_daily_summary_hour"
        private const val KEY_DAILY_SUMMARY_MINUTE = "key_daily_summary_minute"
        private const val KEY_DAILY_SUMMARY_ENABLED = "key_daily_summary_enabled"
        private const val KEY_DEFAULT_FREQUENCY = "key_default_frequency"
        private const val KEY_HOURLY_BEEP_COUNT = "key_hourly_beep_count"

        @Volatile
        private var INSTANCE: UserPreferences? = null

        fun getInstance(context: Context): UserPreferences {
            return INSTANCE ?: synchronized(this) {
                val instance = UserPreferences(context.applicationContext)
                INSTANCE = instance
                instance
            }
        }
    }
}
