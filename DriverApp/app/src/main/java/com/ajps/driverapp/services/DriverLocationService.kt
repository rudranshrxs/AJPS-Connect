package com.ajps.driverapp.services

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.location.Location
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import com.ajps.driverapp.models.DriverLocation
import com.google.firebase.Timestamp
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.SetOptions
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

class DriverLocationService : Service() {

    private val db = FirebaseFirestore.getInstance()
    private val scope = CoroutineScope(Dispatchers.IO)
    private var isTracking = false

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val driverId = intent?.getStringExtra("DRIVER_ID") ?: return START_NOT_STICKY

        val notification = createNotification()
        startForeground(1, notification)

        if (!isTracking) {
            isTracking = true
            startLocationUpdates(driverId)
        }

        return START_STICKY
    }

    private fun startLocationUpdates(driverId: String) {
        scope.launch {
            while (isTracking) {
                // In a real app, use FusedLocationProviderClient here.
                // Simulated location fetch logic:
                val simulatedLat = 26.35 // School route example
                val simulatedLng = 78.93

                updateLocationInFirebase(driverId, simulatedLat, simulatedLng)
                
                // Update every 8 seconds (optimized 5-10s live tracking interval)
                delay(8000)
            }
        }
    }

    private fun updateLocationInFirebase(driverId: String, lat: Double, lng: Double) {
        val locationData = hashMapOf(
            "lat" to lat,
            "latitude" to lat,
            "lng" to lng,
            "longitude" to lng,
            "updatedAt" to Timestamp.now(),
            "last_updated" to Timestamp.now()
        )

        db.collection("driver_locations").document(driverId)
            .set(locationData, SetOptions.merge())
            .addOnSuccessListener {
                // Location updated successfully
            }
            .addOnFailureListener { e ->
                // Log or handle the error quietly
                e.printStackTrace()
            }
    }

    private fun createNotification(): Notification {
        return NotificationCompat.Builder(this, "DRIVER_LOCATION_CHANNEL")
            .setContentTitle("AJPS Driver Duty Active")
            .setContentText("Aapki location background mein track ho rahi hai...")
            .setSmallIcon(android.R.drawable.ic_menu_mylocation)
            .setOngoing(true)
            .build()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                "DRIVER_LOCATION_CHANNEL",
                "Driver Location Tracking",
                NotificationManager.IMPORTANCE_LOW
            )
            val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            manager.createNotificationChannel(channel)
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        isTracking = false
    }

    override fun onBind(intent: Intent?): IBinder? {
        return null
    }
}
