package com.nudgebeep.app.ui.screens

import android.Manifest
import android.os.Build
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.NotificationsActive
import androidx.compose.material.icons.filled.NotificationsOff
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.nudgebeep.app.data.model.TaskEntity
import com.nudgebeep.app.ui.components.TaskItemCard
import com.nudgebeep.app.ui.theme.Cyan500
import com.nudgebeep.app.ui.theme.Emerald400
import com.nudgebeep.app.ui.theme.Emerald500
import com.nudgebeep.app.ui.theme.Slate400
import com.nudgebeep.app.ui.theme.Slate700
import com.nudgebeep.app.ui.theme.Slate800
import com.nudgebeep.app.ui.theme.Slate900
import com.nudgebeep.app.ui.theme.Slate950
import com.nudgebeep.app.ui.viewmodel.TaskFilter
import com.nudgebeep.app.ui.viewmodel.TaskViewModel
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale

@Composable
fun DashboardScreen(
    viewModel: TaskViewModel,
    onNavigateToSettings: () -> Unit
) {
    val context = LocalContext.current

    // Request Android 13+ Notification Permission
    val notificationPermissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission()
    ) { /* Permission granted/denied callback */ }

    LaunchedEffect(Unit) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            notificationPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
        }
    }

    val tasks by viewModel.filteredTasks.collectAsState()
    val allTasks by viewModel.allTasks.collectAsState()
    val unfinishedTasks by viewModel.unfinishedTasks.collectAsState()
    val currentFilter by viewModel.currentFilter.collectAsState()
    val globalRemindersEnabled by viewModel.globalRemindersEnabled.collectAsState()
    val editingTask by viewModel.editingTask.collectAsState()
    val showDailySummary by viewModel.showDailySummaryDialog.collectAsState()

    var quickAddText by remember { mutableStateOf("") }

    val todayDateFormatted = remember {
        SimpleDateFormat("EEEE, MMM d", Locale.getDefault()).format(Date())
    }

    Scaffold(
        floatingActionButton = {
            FloatingActionButton(
                onClick = { viewModel.openCreateTaskDialog() },
                containerColor = Emerald500,
                contentColor = Slate950,
                shape = CircleShape
            ) {
                Icon(Icons.Default.Add, contentDescription = "Add Task", modifier = Modifier.size(28.dp))
            }
        },
        containerColor = Slate950
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(horizontal = 16.dp)
        ) {
            Spacer(modifier = Modifier.height(14.dp))

            // App Header Bar
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .size(10.dp)
                                .clip(CircleShape)
                                .background(if (unfinishedTasks.isNotEmpty()) Emerald500 else Cyan500)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "Nudge Beep",
                            style = MaterialTheme.typography.headlineMedium.copy(fontWeight = FontWeight.ExtraBold),
                            color = Color.White
                        )
                    }
                    Text(
                        text = todayDateFormatted,
                        style = MaterialTheme.typography.bodyMedium,
                        color = Slate400
                    )
                }

                Row(verticalAlignment = Alignment.CenterVertically) {
                    // Daily Summary Icon Shortcut
                    IconButton(
                        onClick = { viewModel.openDailySummaryDialog() },
                        modifier = Modifier
                            .clip(CircleShape)
                            .background(Slate900)
                    ) {
                        Icon(
                            imageVector = Icons.Default.CalendarMonth,
                            contentDescription = "Daily Summary",
                            tint = Cyan500
                        )
                    }

                    Spacer(modifier = Modifier.width(8.dp))

                    // Settings Button
                    IconButton(
                        onClick = onNavigateToSettings,
                        modifier = Modifier
                            .clip(CircleShape)
                            .background(Slate900)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Settings,
                            contentDescription = "Settings",
                            tint = Color.White
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(14.dp))

            // Next Reminder Status Banner
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(14.dp),
                colors = CardDefaults.cardColors(
                    containerColor = if (unfinishedTasks.isEmpty()) Slate900 else Color(0xFF0F261F)
                ),
                border = androidx.compose.foundation.BorderStroke(
                    1.dp,
                    if (unfinishedTasks.isEmpty()) Slate800 else Emerald500.copy(alpha = 0.4f)
                )
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 14.dp, vertical = 10.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = if (!globalRemindersEnabled) {
                            Icons.Default.NotificationsOff
                        } else if (unfinishedTasks.isEmpty()) {
                            Icons.Default.CheckCircle
                        } else {
                            Icons.Default.NotificationsActive
                        },
                        contentDescription = null,
                        tint = if (!globalRemindersEnabled) Slate400 else if (unfinishedTasks.isEmpty()) Cyan500 else Emerald400,
                        modifier = Modifier.size(20.dp)
                    )
                    Spacer(modifier = Modifier.width(10.dp))
                    Column {
                        Text(
                            text = if (!globalRemindersEnabled) {
                                "Reminders paused"
                            } else if (unfinishedTasks.isEmpty()) {
                                "All tasks completed! App is quiet."
                            } else {
                                "Active: Next hourly nudge at top of the hour"
                            },
                            color = Color.White,
                            fontSize = 13.sp,
                            fontWeight = FontWeight.SemiBold
                        )
                        Text(
                            text = if (unfinishedTasks.isEmpty()) {
                                "No unfinished tasks = No notifications."
                            } else {
                                "${unfinishedTasks.size} unfinished task(s) remaining"
                            },
                            color = Slate400,
                            fontSize = 11.sp
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(14.dp))

            // Quick Add Input Bar
            OutlinedTextField(
                value = quickAddText,
                onValueChange = { quickAddText = it },
                placeholder = { Text("Quick add a task...", color = Slate400, fontSize = 14.sp) },
                singleLine = true,
                keyboardOptions = KeyboardOptions(imeAction = ImeAction.Done),
                keyboardActions = KeyboardActions(onDone = {
                    if (quickAddText.isNotBlank()) {
                        viewModel.quickAddTask(quickAddText)
                        quickAddText = ""
                    }
                }),
                trailingIcon = {
                    if (quickAddText.isNotBlank()) {
                        IconButton(
                            onClick = {
                                viewModel.quickAddTask(quickAddText)
                                quickAddText = ""
                            }
                        ) {
                            Icon(Icons.Default.Add, contentDescription = "Add", tint = Emerald500)
                        }
                    }
                },
                modifier = Modifier.fillMaxWidth(),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = Emerald500,
                    unfocusedBorderColor = Slate800,
                    focusedTextColor = Color.White,
                    unfocusedTextColor = Color.White,
                    focusedContainerColor = Slate900,
                    unfocusedContainerColor = Slate900
                ),
                shape = RoundedCornerShape(12.dp)
            )

            Spacer(modifier = Modifier.height(14.dp))

            // Filter Tabs (Today, Active, Completed)
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                TaskFilter.entries.forEach { filter ->
                    val isSelected = currentFilter == filter
                    val count = when (filter) {
                        TaskFilter.TODAY -> allTasks.count { !it.isCompleted && it.isToday() }
                        TaskFilter.ALL_ACTIVE -> allTasks.count { !it.isCompleted }
                        TaskFilter.COMPLETED -> allTasks.count { it.isCompleted }
                    }

                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .clip(RoundedCornerShape(10.dp))
                            .background(if (isSelected) Slate800 else Color.Transparent)
                            .clickable { viewModel.setFilter(filter) }
                            .padding(vertical = 8.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(
                                text = filter.title,
                                color = if (isSelected) Emerald400 else Slate400,
                                fontSize = 13.sp,
                                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(10.dp))
                                    .background(if (isSelected) Emerald500.copy(alpha = 0.2f) else Slate900)
                                    .padding(horizontal = 6.dp, vertical = 1.dp)
                            ) {
                                Text(
                                    text = count.toString(),
                                    color = if (isSelected) Emerald400 else Slate400,
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            // Task List
            if (tasks.isEmpty()) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .weight(1f),
                    contentAlignment = Alignment.Center
                ) {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        modifier = Modifier.padding(32.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(64.dp)
                                .clip(CircleShape)
                                .background(Slate900),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.CheckCircle,
                                contentDescription = null,
                                tint = Emerald500,
                                modifier = Modifier.size(36.dp)
                            )
                        }
                        Spacer(modifier = Modifier.height(14.dp))
                        Text(
                            text = when (currentFilter) {
                                TaskFilter.TODAY -> "No unfinished tasks today"
                                TaskFilter.ALL_ACTIVE -> "No active tasks"
                                TaskFilter.COMPLETED -> "No completed tasks yet"
                            },
                            style = MaterialTheme.typography.titleMedium,
                            color = Color.White
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = "Nudge Beep remains completely quiet when you're caught up.",
                            style = MaterialTheme.typography.bodyMedium,
                            color = Slate400,
                            modifier = Modifier.padding(horizontal = 16.dp)
                        )
                    }
                }
            } else {
                LazyColumn(
                    modifier = Modifier.weight(1f),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    items(tasks, key = { it.id }) { task ->
                        TaskItemCard(
                            task = task,
                            onToggleComplete = { viewModel.toggleTaskComplete(task) },
                            onEdit = { viewModel.openEditTaskDialog(task) },
                            onDelete = { viewModel.deleteTask(task) }
                        )
                    }
                    item {
                        Spacer(modifier = Modifier.height(72.dp)) // padding for FAB
                    }
                }
            }
        }
    }

    // Task Create / Edit Dialog
    editingTask?.let { task ->
        TaskEditDialog(
            task = task,
            onDismiss = { viewModel.dismissEditTaskDialog() },
            onSave = { updatedTask -> viewModel.saveTask(updatedTask) }
        )
    }

    // Daily Summary Review Dialog
    if (showDailySummary) {
        DailySummaryDialog(
            unfinishedTasks = unfinishedTasks,
            onDismiss = { viewModel.dismissDailySummaryDialog() },
            onClearAll = { viewModel.clearAllUnfinishedTasks() },
            onKeepForTomorrow = { viewModel.carryOverUnfinishedToTomorrow() }
        )
    }
}
