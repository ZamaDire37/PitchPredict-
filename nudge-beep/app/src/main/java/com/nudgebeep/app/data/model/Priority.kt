package com.nudgebeep.app.data.model

import androidx.compose.ui.graphics.Color

enum class Priority(val label: String, val colorHex: Long, val rank: Int) {
    HIGH("High", 0xFFEF4444, 3),      // Vibrant Red
    MEDIUM("Medium", 0xFFF59E0B, 2),  // Amber / Orange
    LOW("Low", 0xFF10B981, 1);        // Emerald / Green

    fun composeColor(): Color = Color(colorHex)
}
