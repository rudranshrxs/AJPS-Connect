package com.ajps.driverapp.services

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.util.Log
import java.util.Calendar

class TimetableAlarmManager(private val context: Context) {

    private val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager

    // Yeh function Firebase se timetable read karke alarms set karega
    fun scheduleLocationTrackingAlarms(
        assemblyStartTimeStr: String, // e.g., "08:00"
        firstPeriodEndTimeStr: String, // e.g., "09:00"
        schoolEndTimeStr: String // e.g., "14:00"
    ) {
        Log.d("DriverApp", "Setting up auto-location alarms based on Timetable")

        // 1. Morning Start (Assembly se 2 ghante pehle)
        val morningStartCal = getCalendarTime(assemblyStartTimeStr)
        morningStartCal.add(Calendar.HOUR_OF_DAY, -2)
        setAlarm(morningStartCal, "START_LOCATION", 101)

        // 2. Morning End (1st period khatam hone par)
        val morningEndCal = getCalendarTime(firstPeriodEndTimeStr)
        setAlarm(morningEndCal, "STOP_LOCATION", 102)

        // 3. Evening Start (Chhutti se 5 minute pehle)
        val eveningStartCal = getCalendarTime(schoolEndTimeStr)
        eveningStartCal.add(Calendar.MINUTE, -5)
        setAlarm(eveningStartCal, "START_LOCATION", 103)

        // 4. Evening End (Chhutti ke 3 ghante baad)
        val eveningEndCal = getCalendarTime(schoolEndTimeStr)
        eveningEndCal.add(Calendar.HOUR_OF_DAY, 3)
        setAlarm(eveningEndCal, "STOP_LOCATION", 104)
    }

    private fun setAlarm(calendar: Calendar, action: String, requestCode: Int) {
        // Agar time nikal chuka hai, toh agle din ka set karo
        if (calendar.timeInMillis < System.currentTimeMillis()) {
            calendar.add(Calendar.DAY_OF_YEAR, 1)
        }

        val intent = Intent(context, LocationAlarmReceiver::class.java).apply {
            this.action = action
        }
        val pendingIntent = PendingIntent.getBroadcast(
            context,
            requestCode,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // Exact time par alarm bajana
        alarmManager.setExactAndAllowWhileIdle(
            AlarmManager.RTC_WAKEUP,
            calendar.timeInMillis,
            pendingIntent
        )
    }

    private fun getCalendarTime(timeString: String): Calendar {
        val parts = timeString.split(":")
        val cal = Calendar.getInstance()
        cal.set(Calendar.HOUR_OF_DAY, parts[0].toInt())
        cal.set(Calendar.MINUTE, parts[1].toInt())
        cal.set(Calendar.SECOND, 0)
        return cal
    }
}
