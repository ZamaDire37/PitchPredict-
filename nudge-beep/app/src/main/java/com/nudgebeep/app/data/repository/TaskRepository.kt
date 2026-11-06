package com.nudgebeep.app.data.repository

import android.content.Context
import com.nudgebeep.app.data.local.TaskDao
import com.nudgebeep.app.data.model.TaskEntity
import com.nudgebeep.app.reminder.NotificationHelper
import com.nudgebeep.app.reminder.ReminderScheduler
import kotlinx.coroutines.flow.Flow
import java.util.Calendar

class TaskRepository(
    private val context: Context,
    private val taskDao: TaskDao
) {
    fun getAllTasks(): Flow<List<TaskEntity>> = taskDao.getAllTasks()
    fun getUnfinishedTasks(): Flow<List<TaskEntity>> = taskDao.getUnfinishedTasks()
    fun getCompletedTasks(): Flow<List<TaskEntity>> = taskDao.getCompletedTasks()
    fun getTaskById(id: Long): Flow<TaskEntity?> = taskDao.getTaskByIdFlow(id)

    suspend fun insertTask(task: TaskEntity): Long {
        val id = taskDao.insertTask(task)
        val createdTask = task.copy(id = id)
        ReminderScheduler.scheduleTaskReminder(context, createdTask)
        return id
    }

    suspend fun updateTask(task: TaskEntity) {
        taskDao.updateTask(task)
        if (task.isCompleted || !task.remindersEnabled) {
            ReminderScheduler.cancelTaskReminder(context, task.id)
            NotificationHelper.cancelNotification(context, task.id.toInt())
        } else {
            ReminderScheduler.scheduleTaskReminder(context, task)
        }
    }

    suspend fun deleteTask(task: TaskEntity) {
        taskDao.deleteTask(task)
        ReminderScheduler.cancelTaskReminder(context, task.id)
        NotificationHelper.cancelNotification(context, task.id.toInt())
    }

    suspend fun toggleTaskComplete(task: TaskEntity) {
        val newStatus = !task.isCompleted
        val completedAt = if (newStatus) System.currentTimeMillis() else null
        taskDao.setTaskCompleted(task.id, newStatus, completedAt)

        if (newStatus) {
            // Immediately stop reminders for completed task
            ReminderScheduler.cancelTaskReminder(context, task.id)
            NotificationHelper.cancelNotification(context, task.id.toInt())
        } else {
            // Unmarked completed -> reschedule reminder if active
            val updated = task.copy(isCompleted = false, completedAt = null)
            ReminderScheduler.scheduleTaskReminder(context, updated)
        }
    }

    suspend fun clearAllUnfinished() {
        val unfinished = taskDao.getUnfinishedTasksSync()
        unfinished.forEach {
            ReminderScheduler.cancelTaskReminder(context, it.id)
            NotificationHelper.cancelNotification(context, it.id.toInt())
        }
        taskDao.clearAllUnfinishedTasks()
    }

    suspend fun carryOverUnfinishedToTomorrow() {
        val cal = Calendar.getInstance().apply {
            add(Calendar.DAY_OF_YEAR, 1)
            set(Calendar.HOUR_OF_DAY, 9)
            set(Calendar.MINUTE, 0)
            set(Calendar.SECOND, 0)
        }
        taskDao.carryOverUnfinishedTasks(cal.timeInMillis)

        val updated = taskDao.getUnfinishedTasksSync()
        updated.forEach { task ->
            ReminderScheduler.scheduleTaskReminder(context, task)
        }
    }
}
