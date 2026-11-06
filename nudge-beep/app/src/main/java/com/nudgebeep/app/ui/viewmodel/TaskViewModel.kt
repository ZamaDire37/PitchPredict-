package com.nudgebeep.app.ui.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.nudgebeep.app.NudgeBeepApp
import com.nudgebeep.app.data.model.Priority
import com.nudgebeep.app.data.model.ReminderFrequency
import com.nudgebeep.app.data.model.TaskEntity
import com.nudgebeep.app.reminder.BeepSoundPlayer
import com.nudgebeep.app.reminder.ReminderScheduler
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

enum class TaskFilter(val title: String) {
    TODAY("Today"),
    ALL_ACTIVE("Active"),
    COMPLETED("Completed")
}

class TaskViewModel(application: Application) : AndroidViewModel(application) {

    private val app = application as NudgeBeepApp
    private val repository = app.repository
    private val preferences = app.userPreferences

    val allTasks = repository.getAllTasks()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val unfinishedTasks = repository.getUnfinishedTasks()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    private val _currentFilter = MutableStateFlow(TaskFilter.TODAY)
    val currentFilter: StateFlow<TaskFilter> = _currentFilter.asStateFlow()

    val filteredTasks: StateFlow<List<TaskEntity>> = combine(allTasks, _currentFilter) { tasks, filter ->
        when (filter) {
            TaskFilter.TODAY -> tasks.filter { !it.isCompleted && it.isToday() }
            TaskFilter.ALL_ACTIVE -> tasks.filter { !it.isCompleted }
            TaskFilter.COMPLETED -> tasks.filter { it.isCompleted }
        }
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val globalRemindersEnabled = preferences.globalRemindersEnabled

    private val _editingTask = MutableStateFlow<TaskEntity?>(null)
    val editingTask: StateFlow<TaskEntity?> = _editingTask.asStateFlow()

    private val _showDailySummaryDialog = MutableStateFlow(false)
    val showDailySummaryDialog: StateFlow<Boolean> = _showDailySummaryDialog.asStateFlow()

    fun setFilter(filter: TaskFilter) {
        _currentFilter.value = filter
    }

    fun openCreateTaskDialog() {
        _editingTask.value = TaskEntity(
            title = "",
            priority = Priority.MEDIUM,
            frequency = preferences.getDefaultFrequency(),
            soundTitle = "Default Nudge Beep (5x)",
            remindersEnabled = true
        )
    }

    fun openEditTaskDialog(task: TaskEntity) {
        _editingTask.value = task
    }

    fun dismissEditTaskDialog() {
        _editingTask.value = null
        BeepSoundPlayer.stopPreview()
    }

    fun openDailySummaryDialog() {
        _showDailySummaryDialog.value = true
    }

    fun dismissDailySummaryDialog() {
        _showDailySummaryDialog.value = false
    }

    /**
     * Quick 1-click task creation from the dashboard header
     */
    fun quickAddTask(title: String) {
        if (title.isBlank()) return
        viewModelScope.launch {
            val task = TaskEntity(
                title = title.trim(),
                priority = Priority.MEDIUM,
                frequency = preferences.getDefaultFrequency(),
                soundTitle = "Default Nudge Beep (5x)",
                remindersEnabled = true
            )
            repository.insertTask(task)
        }
    }

    fun saveTask(task: TaskEntity) {
        if (task.title.isBlank()) return
        viewModelScope.launch {
            if (task.id == 0L) {
                repository.insertTask(task)
            } else {
                repository.updateTask(task)
            }
            _editingTask.value = null
            BeepSoundPlayer.stopPreview()
        }
    }

    fun toggleTaskComplete(task: TaskEntity) {
        viewModelScope.launch {
            repository.toggleTaskComplete(task)
        }
    }

    fun deleteTask(task: TaskEntity) {
        viewModelScope.launch {
            repository.deleteTask(task)
        }
    }

    fun clearAllUnfinishedTasks() {
        viewModelScope.launch {
            repository.clearAllUnfinished()
            _showDailySummaryDialog.value = false
        }
    }

    fun carryOverUnfinishedToTomorrow() {
        viewModelScope.launch {
            repository.carryOverUnfinishedToTomorrow()
            _showDailySummaryDialog.value = false
        }
    }

    fun toggleGlobalReminders(enabled: Boolean) {
        preferences.setGlobalRemindersEnabled(enabled)
        if (enabled) {
            ReminderScheduler.rescheduleAllReminders(getApplication())
        }
    }

    fun testReminderIn5Seconds() {
        ReminderScheduler.scheduleTestReminder(getApplication(), 5)
    }

    fun play5BeepPreview() {
        BeepSoundPlayer.playBeepPattern(getApplication(), 5)
    }
}
