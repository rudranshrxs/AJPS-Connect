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
                // For now, simulating location fetch logic:
                val simulatedLat = 28.7041 // Example Delhi Lat
                val simulatedLng = 77.1025 // Example Delhi Lng

                updateLocationInFirebase(driverId, simulatedLat, simulatedLng)
                
                // Update every 30 seconds to optimize Firebase writes
                delay(30000)
            }
        }
    }

    private fun updateLocationInFirebase(driverId: String, lat: Double, lng: Double) {
        // BHAI DHYAN DEIN: Yahan hum "driver_data" aur "location" fields use kar rahe hain
        // jo ki aapke school PWA se directly sync hoga!
        val locationData = DriverLocation(
            lat = lat,
            lng = lng,
            last_updated = Timestamp.now()
        )

        db.collection("driver_data").document(driverId)
            .update("location", locationData)
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
