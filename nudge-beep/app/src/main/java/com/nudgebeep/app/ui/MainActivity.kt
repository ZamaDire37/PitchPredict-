package com.nudgebeep.app.ui

import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.compose.runtime.LaunchedEffect
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.nudgebeep.app.reminder.NotificationHelper
import com.nudgebeep.app.ui.screens.DashboardScreen
import com.nudgebeep.app.ui.screens.SettingsScreen
import com.nudgebeep.app.ui.theme.NudgeBeepTheme
import com.nudgebeep.app.ui.viewmodel.TaskViewModel

class MainActivity : ComponentActivity() {

    private val viewModel: TaskViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        handleNotificationIntent(intent)

        setContent {
            NudgeBeepTheme {
                val navController = rememberNavController()

                NavHost(
                    navController = navController,
                    startDestination = "dashboard"
                ) {
                    composable("dashboard") {
                        DashboardScreen(
                            viewModel = viewModel,
                            onNavigateToSettings = { navController.navigate("settings") }
                        )
                    }
                    composable("settings") {
                        SettingsScreen(
                            viewModel = viewModel,
                            onBack = { navController.popBackStack() }
                        )
                    }
                }
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        handleNotificationIntent(intent)
    }

    private fun handleNotificationIntent(intent: Intent?) {
        if (intent == null) return

        if (intent.getBooleanExtra(NotificationHelper.EXTRA_OPEN_DAILY_SUMMARY, false)) {
            viewModel.openDailySummaryDialog()
        }

        val taskId = intent.getLongExtra(NotificationHelper.EXTRA_TASK_ID, -1L)
        if (taskId != -1L) {
            // Find task and open edit dialog
            val task = viewModel.allTasks.value.firstOrNull { it.id == taskId }
            if (task != null) {
                viewModel.openEditTaskDialog(task)
            }
        }
    }
}
