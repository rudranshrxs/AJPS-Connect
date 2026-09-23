package com.ajps.driverapp.ui

import android.net.Uri
import android.os.Bundle
import android.util.Log
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.ajps.driverapp.models.SlipDetails
import com.google.firebase.Timestamp
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.storage.FirebaseStorage
// Gemini AI Imports (Generative AI SDK)
import com.google.ai.client.generativeai.GenerativeModel
import com.google.ai.client.generativeai.type.content
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.util.UUID
import android.graphics.Bitmap
import android.provider.MediaStore

class SlipUploadActivity : AppCompatActivity() {

    private val db = FirebaseFirestore.getInstance()
    private val storage = FirebaseStorage.getInstance()
    private val driverId = "DRIVER_123" // Example ID
    
    // API Key is now securely fetched from BuildConfig
    private val geminiApiKey = com.ajps.driverapp.BuildConfig.GEMINI_API_KEY

    private var selectedImageUri: Uri? = null

    // Register ActivityResultLauncher for picking images
    private val pickImageLauncher = registerForActivityResult(androidx.activity.result.contract.ActivityResultContracts.GetContent()) { uri: Uri? ->
        uri?.let {
            selectedImageUri = it
            findViewById<android.widget.ImageView>(com.ajps.driverapp.R.id.ivSlipPreview).setImageURI(it)
            findViewById<android.widget.Button>(com.ajps.driverapp.R.id.btnUpload).isEnabled = true
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(com.ajps.driverapp.R.layout.activity_slip_upload)

        val btnSelectSlip = findViewById<android.widget.Button>(com.ajps.driverapp.R.id.btnSelectSlip)
        val btnUpload = findViewById<android.widget.Button>(com.ajps.driverapp.R.id.btnUpload)

        btnSelectSlip.setOnClickListener {
            pickImageLauncher.launch("image/*")
        }

        btnUpload.setOnClickListener {
            selectedImageUri?.let { uri ->
                btnUpload.isEnabled = false // Disable while uploading
                extractInfoWithGeminiAndUpload(uri)
            }
        }
    }

    // Naya function: Pehle Gemini se info extract karo, phir image upload karo
    private fun extractInfoWithGeminiAndUpload(imageUri: Uri) {
        Toast.makeText(this, "AI Slip se jankari nikal raha hai...", Toast.LENGTH_LONG).show()

        CoroutineScope(Dispatchers.IO).launch {
            try {
                // 1. Image ko Bitmap mein convert karna Gemini ke liye
                val bitmap: Bitmap = MediaStore.Images.Media.getBitmap(this@SlipUploadActivity.contentResolver, imageUri)

                // 2. Gemini Generative Model setup karna (Vision model)
                val generativeModel = GenerativeModel(
                    modelName = "gemini-1.5-flash",
                    apiKey = geminiApiKey
                )

                // 3. AI se prompt puchna (Sirf extract karna hai, verify nahi)
                val prompt = "This is a bus driver slip. Extract the Date, Time, Vehicle Number, and any other important details. Return the extracted data as a clean summary."
                
                val response = generativeModel.generateContent(
                    content {
                        image(bitmap)
                        text(prompt)
                    }
                )

                val extractedInfo = response.text?.trim() ?: "No information could be extracted."
                
                withContext(Dispatchers.Main) {
                    Log.d("DriverApp", "AI Extraction Success! Uploading Image...")
                    // Extracted info ko sath mein bhejenge takki DB mein save ho
                    uploadSlipToFirebase(imageUri, extractedInfo)
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    // Agar AI fail ho jaye (e.g. internet issue), tab bhi hum image upload karenge
                    Log.e("DriverApp", "AI Extraction Error: ${e.message}")
                    Toast.makeText(this@SlipUploadActivity, "AI Error, par slip upload ki ja rahi hai.", Toast.LENGTH_SHORT).show()
                    uploadSlipToFirebase(imageUri, "Failed to extract info via AI.")
                }
            }
        }
    }

    private fun uploadSlipToFirebase(imageUri: Uri, extractedInfo: String) {
        val fileName = UUID.randomUUID().toString() + ".jpg"
        val storageRef = storage.reference.child("driver_slips/$fileName")

        storageRef.putFile(imageUri)
            .addOnSuccessListener {
                storageRef.downloadUrl.addOnSuccessListener { uri ->
                    saveSlipDetailsToDatabase(uri.toString(), extractedInfo)
                }
            }
            .addOnFailureListener {
                Toast.makeText(this, "Slip upload fail ho gayi!", Toast.LENGTH_SHORT).show()
            }
    }

    private fun saveSlipDetailsToDatabase(imageUrl: String, extractedInfo: String) {
        val slipData = SlipDetails(
            image_url = imageUrl,
            uploaded_at = Timestamp.now(),
            extracted_info = extractedInfo // Yahan AI ka data save hoga
        )

        db.collection("driver_data").document(driverId)
            .update("slip_details", slipData)
            .addOnSuccessListener {
                Toast.makeText(this, "Slip aur details successfully upload ho gaye!", Toast.LENGTH_LONG).show()
            }
    }
}
