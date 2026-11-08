# Nudge Beep 🔔⚡
> **Lightweight, background-persistent task manager & periodic reminder app for Android.**

Nudge Beep operates on one central rule:
> **"If you have unfinished tasks, the app reminds you. If there are no unfinished tasks, the app stays completely quiet."**

---

## 📱 Features

1. **Clean & Minimal Dashboard**:
   - Modern, high-contrast dark theme built with Jetpack Compose & Material 3.
   - Live **Next Reminder Status Banner**: Tells you when the next nudge will fire, or shows "All caught up! App is quiet".
   - Fast **1-Click Quick Add bar**: Type a title and hit Enter to add immediately.
   - Custom Checkbox: Instant completion toggle with strikethrough animation.
   - Priority Badges: **High** (Red), **Medium** (Amber), **Low** (Emerald).
   - Filter views: **Today**, **Active**, and **Completed** with dynamic counters.

2. **Hourly & Periodic Background Reminders**:
   - Background operation without needing foreground services.
   - Runs independently even when the app is closed or the device is locked.
   - **Signature 5-Beep Audio Pattern**: Plays short, recognizable reminder beeps using Android's native audio engine (`ToneGenerator`).
   - If there are no unfinished tasks, the hourly check does **nothing** (zero battery drain, zero notification spam).

3. **Individual Task Reminder Settings**:
   - Each task has independent scheduling:
     - Every hour
     - Every 2 hours
     - Every 3 hours
     - Every 5 hours
     - Every 6 hours
     - Once a day
     - Custom schedule (specific days of week + time)
     - Once a week
     - No reminders (Silent task)
   - Completed or deleted tasks **immediately stop generating reminders**.
   - Disabling reminders leaves tasks visible and intact.

4. **Custom Notification Sounds & System Sound Picker**:
   - Integrated with Android's system sound/ringtone picker (`RingtoneManager.ACTION_RINGTONE_PICKER`).
   - Allows users to select any notification tone or ringtone installed on their device.
   - In-app **▶ Sound Preview** button to audition sounds before saving.
   - Fallback to the signature 5-beep pattern if no custom sound is selected.

5. **Daily Summary & Unfinished Tasks (Default 7:00 PM)**:
   - Evaluates active tasks at end of day.
   - Notifies user: *"You still have X unfinished tasks today. Would you like to review them?"*
   - Interactive Summary Dialog:
     - **Option A: Clear All** — Dismisses/clears all unfinished tasks from today's active list.
     - **Option B: Keep for Tomorrow** — Carries over unfinished tasks to tomorrow's schedule.
   - Never auto-deletes tasks without user choice.

6. **Notification Direct Actions**:
   - **"✓ Mark as Done"**: Users can complete a task directly from the notification shade without even opening the app.
   - Tapping the notification takes the user directly to the relevant task.

7. **Developer / Instant QA Testing**:
   - In **Settings > Instant Testing Controls**:
     - **"▶ Play Signature 5-Beep Pattern"**: Test the audio tone immediately.
     - **"⚡ Test Reminder in 5 Seconds"**: Schedules an exact alarm in 5s so you can lock your phone and verify the notification, sound, and wake behavior immediately without waiting an hour.

---

## 🛠 Technical Architecture

- **Language & Platform**: Kotlin, Native Android (Min SDK 26 / Target SDK 34).
- **User Interface**: Jetpack Compose, Material 3, Navigation Compose.
- **Local Storage**: Room Database with SQLite (`TaskEntity`, `TaskDao`, Type Converters).
- **Background Execution**:
  - `AlarmManager.setExactAndAllowWhileIdle(...)` for exact task nudges and watchdog checks.
  - `WorkManager` (`PeriodicWatchdogWorker`) as a periodic safety net.
  - `BroadcastReceiver`s:
    - `TaskReminderReceiver`: Triggers individual task notifications with custom sounds.
    - `HourlyWatchdogReceiver`: Evaluates unfinished tasks every hour; triggers 5-beep nudge if tasks remain.
    - `DailySummaryReceiver`: Evaluates unfinished tasks at 7:00 PM.
    - `NotificationActionReceiver`: Handles inline "Mark Done" action.
    - `BootReceiver`: Listens to `BOOT_COMPLETED` and reschedules all reminders upon phone restart.

---

## 📦 Installable APK Location

The debug APK is compiled and ready to install:
```
nudge-beep/release/NudgeBeep-v1.0.0-debug.apk
```

---

## 🚀 How to Build and Run

### Option 1: Using Android Studio (Recommended)
1. Open **Android Studio**.
2. Select **Open** and browse to:
   ```
   c:\Users\nvkgo\Documents\antigravity\mysterious-borg\nudge-beep
   ```
3. Allow Gradle to sync.
4. Connect an Android phone via USB (with USB Debugging enabled) or start an Android Emulator.
5. Click **Run (▶)** or press **Shift + F10**.

### Option 2: Command Line (Gradle)
```bash
cd nudge-beep
.\gradlew.bat assembleDebug
```
The newly compiled APK will be at:
`app/build/outputs/apk/debug/app-debug.apk`
