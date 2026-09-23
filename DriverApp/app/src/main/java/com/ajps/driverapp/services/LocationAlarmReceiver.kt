package com.ajps.driverapp.services

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import androidx.core.content.ContextCompat

class LocationAlarmReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        val action = intent.action
        Log.d("DriverApp", "Alarm Received! Action: $action")

        // Agar holiday hai, toh hum location tracking start nahi karenge.
        // Yahan ek API call ya local database check hoga holiday verification ke liye.
        val isHoliday = checkIsHoliday()
        if (isHoliday) {
            Log.d("DriverApp", "Aaj holiday hai, location tracking start nahi hogi.")
            return
        }

        val serviceIntent = Intent(context, DriverLocationService::class.java).apply {
            putExtra("DRIVER_ID", "DRIVER_123")
        }

        when (action) {
            "START_LOCATION" -> {
                Log.d("DriverApp", "Starting Foreground Location Service")
                ContextCompat.startForegroundService(context, serviceIntent)
            }
            "STOP_LOCATION" -> {
                Log.d("DriverApp", "Stopping Foreground Location Service")
                context.stopService(serviceIntent)
            }
        }
    }

    private fun checkIsHoliday(): Boolean {
        // TODO: Timetable engine ya Firebase se aaj ka status check karna hai.
        // Filhal ise false rakhte hain (matlab tracking chalegi).
        return false
    }
}
