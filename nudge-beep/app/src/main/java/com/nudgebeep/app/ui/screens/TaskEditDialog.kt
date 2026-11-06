package com.nudgebeep.app.ui.screens

import android.app.Activity
import android.content.Intent
import android.media.RingtoneManager
import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Stop
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ExposedDropdownMenuBox
import androidx.compose.material3.ExposedDropdownMenuDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
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
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.nudgebeep.app.data.model.Priority
import com.nudgebeep.app.data.model.ReminderFrequency
import com.nudgebeep.app.data.model.TaskEntity
import com.nudgebeep.app.reminder.BeepSoundPlayer
import com.nudgebeep.app.ui.theme.Cyan500
import com.nudgebeep.app.ui.theme.Emerald500
import com.nudgebeep.app.ui.theme.Slate400
import com.nudgebeep.app.ui.theme.Slate700
import com.nudgebeep.app.ui.theme.Slate800
import com.nudgebeep.app.ui.theme.Slate900
import java.util.Calendar

@OptIn(ExperimentalMaterial3Api::class, ExperimentalLayoutApi::class)
@Composable
fun TaskEditDialog(
    task: TaskEntity,
    onDismiss: () -> Unit,
    onSave: (TaskEntity) -> Unit
) {
    val context = LocalContext.current

    var title by remember { mutableStateOf(task.title) }
    var description by remember { mutableStateOf(task.description ?: "") }
    var priority by remember { mutableStateOf(task.priority) }
    var frequency by remember { mutableStateOf(task.frequency) }
    var remindersEnabled by remember { mutableStateOf(task.remindersEnabled) }
    var soundUri by remember { mutableStateOf(task.soundUri) }
    var soundTitle by remember { mutableStateOf(task.soundTitle) }
    var isPlayingPreview by remember { mutableStateOf(false) }

    // Custom schedule state
    var selectedDays by remember {
        mutableStateOf(
            task.customDays?.split(",")?.mapNotNull { it.trim().toIntOrNull() }?.toSet()
                ?: setOf(Calendar.MONDAY, Calendar.TUESDAY, Calendar.WEDNESDAY, Calendar.THURSDAY, Calendar.FRIDAY)
        )
    }

    var frequencyDropdownExpanded by remember { mutableStateOf(false) }
    var titleError by remember { mutableStateOf(false) }

    // Android System Sound / Ringtone Picker Launcher
    val ringtonePickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (result.resultCode == Activity.RESULT_OK) {
            val uri: Uri? = result.data?.getParcelableExtra(RingtoneManager.EXTRA_RINGTONE_PICKED_URI)
            if (uri != null) {
                soundUri = uri.toString()
                val ringtone = RingtoneManager.getRingtone(context, uri)
                soundTitle = ringtone?.getTitle(context) ?: "Custom Sound"
            } else {
                soundUri = "beep_5x"
                soundTitle = "Default Nudge Beep (5x)"
            }
        }
    }

    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Card(
            modifier = Modifier
                .fillMaxWidth(0.92f)
                .padding(vertical = 24.dp),
            shape = RoundedCornerShape(20.dp),
            colors = CardDefaults.cardColors(containerColor = Slate900),
            border = androidx.compose.foundation.BorderStroke(1.dp, Slate700)
        ) {
            Column(
                modifier = Modifier
                    .padding(20.dp)
                    .verticalScroll(rememberScrollState())
            ) {
                Text(
                    text = if (task.id == 0L) "New Task" else "Edit Task",
                    style = MaterialTheme.typography.titleLarge,
                    color = Color.White
                )

                Spacer(modifier = Modifier.height(16.dp))

                // Title Input
                OutlinedTextField(
                    value = title,
                    onValueChange = {
                        title = it
                        if (it.isNotBlank()) titleError = false
                    },
                    label = { Text("Task Title *") },
                    isError = titleError,
                    supportingText = {
                        if (titleError) Text("Title is required", color = Color(0xFFEF4444))
                    },
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = Emerald500,
                        unfocusedBorderColor = Slate700,
                        focusedTextColor = Color.White,
                        unfocusedTextColor = Color.White
                    ),
                    shape = RoundedCornerShape(12.dp)
                )

                Spacer(modifier = Modifier.height(12.dp))

                // Description Input
                OutlinedTextField(
                    value = description,
                    onValueChange = { description = it },
                    label = { Text("Description (Optional)") },
                    modifier = Modifier.fillMaxWidth(),
                    maxLines = 3,
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = Emerald500,
                        unfocusedBorderColor = Slate700,
                        focusedTextColor = Color.White,
                        unfocusedTextColor = Color.White
                    ),
                    shape = RoundedCornerShape(12.dp)
                )

                Spacer(modifier = Modifier.height(16.dp))

                // Priority Selection
                Text(
                    text = "Priority Level",
                    style = MaterialTheme.typography.titleMedium,
                    color = Color.White
                )
                Spacer(modifier = Modifier.height(8.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Priority.entries.forEach { p ->
                        val isSelected = priority == p
                        val borderColor = if (isSelected) p.composeColor() else Slate700
                        val bgColor = if (isSelected) p.composeColor().copy(alpha = 0.2f) else Slate800

                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .clip(RoundedCornerShape(10.dp))
                                .background(bgColor)
                                .border(1.dp, borderColor, RoundedCornerShape(10.dp))
                                .clickable { priority = p }
                                .padding(vertical = 10.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = p.label,
                                color = if (isSelected) p.composeColor() else Slate400,
                                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                                fontSize = 13.sp
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(18.dp))

                // Reminders Toggle
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Column {
                        Text(
                            text = "Enable Reminders",
                            style = MaterialTheme.typography.titleMedium,
                            color = Color.White
                        )
                        Text(
                            text = if (remindersEnabled) "Reminds when unfinished" else "Silent task",
                            fontSize = 12.sp,
                            color = Slate400
                        )
                    }
                    Switch(
                        checked = remindersEnabled,
                        onCheckedChange = { remindersEnabled = it },
                        colors = SwitchDefaults.colors(
                            checkedThumbColor = Emerald500,
                            checkedTrackColor = Slate800
                        )
                    )
                }

                if (remindersEnabled) {
                    Spacer(modifier = Modifier.height(14.dp))

                    // Reminder Frequency Dropdown
                    Text(
                        text = "Reminder Frequency",
                        style = MaterialTheme.typography.titleMedium,
                        color = Color.White
                    )
                    Spacer(modifier = Modifier.height(8.dp))

                    ExposedDropdownMenuBox(
                        expanded = frequencyDropdownExpanded,
                        onExpandedChange = { frequencyDropdownExpanded = !frequencyDropdownExpanded }
                    ) {
                        OutlinedTextField(
                            value = frequency.label,
                            onValueChange = {},
                            readOnly = true,
                            trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = frequencyDropdownExpanded) },
                            modifier = Modifier
                                .fillMaxWidth()
                                .menuAnchor(),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = Emerald500,
                                unfocusedBorderColor = Slate700,
                                focusedTextColor = Color.White,
                                unfocusedTextColor = Color.White
                            ),
                            shape = RoundedCornerShape(12.dp)
                        )
                        ExposedDropdownMenu(
                            expanded = frequencyDropdownExpanded,
                            onDismissRequest = { frequencyDropdownExpanded = false },
                            modifier = Modifier.background(Slate800)
                        ) {
                            ReminderFrequency.entries.forEach { f ->
                                DropdownMenuItem(
                                    text = { Text(f.label, color = Color.White) },
                                    onClick = {
                                        frequency = f
                                        frequencyDropdownExpanded = false
                                    }
                                )
                            }
                        }
                    }

                    // Custom Days Selector if CUSTOM frequency selected
                    if (frequency == ReminderFrequency.CUSTOM) {
                        Spacer(modifier = Modifier.height(12.dp))
                        Text(
                            text = "Repeat Days",
                            style = MaterialTheme.typography.bodyMedium,
                            color = Slate400
                        )
                        Spacer(modifier = Modifier.height(6.dp))
                        val daysMap = listOf(
                            Pair("M", Calendar.MONDAY),
                            Pair("T", Calendar.TUESDAY),
                            Pair("W", Calendar.WEDNESDAY),
                            Pair("T", Calendar.THURSDAY),
                            Pair("F", Calendar.FRIDAY),
                            Pair("S", Calendar.SATURDAY),
                            Pair("S", Calendar.SUNDAY)
                        )
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            daysMap.forEach { (label, dayConst) ->
                                val selected = selectedDays.contains(dayConst)
                                Box(
                                    modifier = Modifier
                                        .size(36.dp)
                                        .clip(CircleShape)
                                        .background(if (selected) Emerald500 else Slate800)
                                        .clickable {
                                            selectedDays = if (selected) {
                                                selectedDays - dayConst
                                            } else {
                                                selectedDays + dayConst
                                            }
                                        },
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                        text = label,
                                        color = if (selected) Slate900 else Color.White,
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 12.sp
                                    )
                                }
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    // Notification Sound Selector
                    Text(
                        text = "Notification Sound",
                        style = MaterialTheme.typography.titleMedium,
                        color = Color.White
                    )
                    Spacer(modifier = Modifier.height(8.dp))

                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(12.dp))
                            .background(Slate800)
                            .padding(horizontal = 12.dp, vertical = 8.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.weight(1f)
                        ) {
                            Icon(
                                imageVector = Icons.Default.Notifications,
                                contentDescription = null,
                                tint = Cyan500,
                                modifier = Modifier.size(20.dp)
                            )
                            Spacer(modifier = Modifier.width(10.dp))
                            Column {
                                Text(
                                    text = soundTitle,
                                    color = Color.White,
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.Medium
                                )
                                Text(
                                    text = "Tap to choose from phone",
                                    color = Slate400,
                                    fontSize = 11.sp
                                )
                            }
                        }

                        // Preview button
                        IconButton(
                            onClick = {
                                if (isPlayingPreview) {
                                    BeepSoundPlayer.stopPreview()
                                    isPlayingPreview = false
                                } else {
                                    isPlayingPreview = true
                                    BeepSoundPlayer.previewSound(context, soundUri) {
                                        isPlayingPreview = false
                                    }
                                }
                            }
                        ) {
                            Icon(
                                imageVector = if (isPlayingPreview) Icons.Default.Stop else Icons.Default.PlayArrow,
                                contentDescription = "Preview",
                                tint = Emerald500
                            )
                        }

                        // Button to launch system ringtone picker
                        Button(
                            onClick = {
                                val intent = Intent(RingtoneManager.ACTION_RINGTONE_PICKER).apply {
                                    putExtra(RingtoneManager.EXTRA_RINGTONE_TYPE, RingtoneManager.TYPE_NOTIFICATION)
                                    putExtra(RingtoneManager.EXTRA_RINGTONE_TITLE, "Select Reminder Sound")
                                    putExtra(RingtoneManager.EXTRA_RINGTONE_SHOW_DEFAULT, true)
                                    putExtra(RingtoneManager.EXTRA_RINGTONE_SHOW_SILENT, false)
                                    if (!soundUri.isNullOrBlank() && soundUri != "beep_5x") {
                                        putExtra(RingtoneManager.EXTRA_RINGTONE_EXISTING_URI, Uri.parse(soundUri))
                                    }
                                }
                                ringtonePickerLauncher.launch(intent)
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = Slate700),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Text("Change", fontSize = 12.sp)
                        }
                    }
                }

                Spacer(modifier = Modifier.height(24.dp))

                // Actions: Cancel & Save
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.End
                ) {
                    OutlinedButton(
                        onClick = onDismiss,
                        shape = RoundedCornerShape(10.dp),
                        colors = ButtonDefaults.outlinedButtonColors(contentColor = Slate400)
                    ) {
                        Text("Cancel")
                    }
                    Spacer(modifier = Modifier.width(10.dp))
                    Button(
                        onClick = {
                            if (title.isBlank()) {
                                titleError = true
                                return@Button
                            }
                            val customDaysStr = if (frequency == ReminderFrequency.CUSTOM) {
                                selectedDays.joinToString(",")
                            } else null

                            onSave(
                                task.copy(
                                    title = title.trim(),
                                    description = description.trim().takeIf { it.isNotBlank() },
                                    priority = priority,
                                    frequency = frequency,
                                    remindersEnabled = remindersEnabled,
                                    soundUri = soundUri,
                                    soundTitle = soundTitle,
                                    customDays = customDaysStr
                                )
                            )
                        },
                        shape = RoundedCornerShape(10.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = Emerald500)
                    ) {
                        Text("Save Task", color = Slate900, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}
