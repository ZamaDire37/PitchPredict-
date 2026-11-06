package com.nudgebeep.app.data.local

import androidx.room.Dao
import androidx.room.Delete
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import com.nudgebeep.app.data.model.TaskEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface TaskDao {

    @Query("SELECT * FROM tasks ORDER BY isCompleted ASC, priority DESC, createdAt DESC")
    fun getAllTasks(): Flow<List<TaskEntity>>

    @Query("SELECT * FROM tasks WHERE isCompleted = 0 ORDER BY priority DESC, createdAt DESC")
    fun getUnfinishedTasks(): Flow<List<TaskEntity>>

    @Query("SELECT * FROM tasks WHERE isCompleted = 1 ORDER BY completedAt DESC, createdAt DESC")
    fun getCompletedTasks(): Flow<List<TaskEntity>>

    @Query("SELECT * FROM tasks WHERE id = :id")
    fun getTaskByIdFlow(id: Long): Flow<TaskEntity?>

    @Query("SELECT * FROM tasks WHERE id = :id")
    suspend fun getTaskById(id: Long): TaskEntity?

    @Query("SELECT * FROM tasks WHERE isCompleted = 0 ORDER BY priority DESC")
    suspend fun getUnfinishedTasksSync(): List<TaskEntity>

    @Query("SELECT COUNT(*) FROM tasks WHERE isCompleted = 0")
    suspend fun getUnfinishedCountSync(): Int

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertTask(task: TaskEntity): Long

    @Update
    suspend fun updateTask(task: TaskEntity)

    @Delete
    suspend fun deleteTask(task: TaskEntity)

    @Query("DELETE FROM tasks WHERE id = :id")
    suspend fun deleteTaskById(id: Long)

    @Query("UPDATE tasks SET isCompleted = :isCompleted, completedAt = :completedAt WHERE id = :id")
    suspend fun setTaskCompleted(id: Long, isCompleted: Boolean, completedAt: Long?)

    @Query("UPDATE tasks SET lastNotifiedAt = :timestamp WHERE id = :id")
    suspend fun updateLastNotified(id: Long, timestamp: Long)

    /**
     * Option A: Clear all unfinished tasks from today (mark them dismissed / archived)
     */
    @Query("DELETE FROM tasks WHERE isCompleted = 0")
    suspend fun clearAllUnfinishedTasks()

    /**
     * Option B: Keep unfinished tasks for tomorrow (carry over)
     */
    @Query("UPDATE tasks SET dueDate = :tomorrowDate, isCarriedOver = 1 WHERE isCompleted = 0")
    suspend fun carryOverUnfinishedTasks(tomorrowDate: Long)
}
