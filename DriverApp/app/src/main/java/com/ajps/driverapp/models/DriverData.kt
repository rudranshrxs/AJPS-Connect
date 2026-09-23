package com.ajps.driverapp.models

import com.google.firebase.Timestamp

// BHAI, YAHAN DHYAN DIJIYE: Yeh bilkul wahi names hain jo PWA mein use honge!
// Collection name Firestore mein hoga: "driver_data"

data class DriverLocation(
    val lat: Double = 0.0,
    val lng: Double = 0.0,
    val last_updated: Timestamp = Timestamp.now()
)

data class SlipDetails(
    val image_url: String = "",
    val uploaded_at: Timestamp = Timestamp.now(),
    val extracted_info: String? = null // Gemini Dwara nikali gayi jaankari
)

data class DriverData(
    val location: DriverLocation? = null,
    val slip_details: SlipDetails? = null
)
