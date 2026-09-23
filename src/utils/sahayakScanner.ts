/// <reference types="vite/client" />

/**
 * Sahayak Scanner — uses Google Gemini to extract
 * student records from images or photos of physical registers.
 */
export async function scanFuelReceiptWithGemini(base64Data: string, mimeType: string) {
  try {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) throw new Error("Scanner core is not configured (VITE_GEMINI_API_KEY missing).");

    let rawBase64 = base64Data;
    if (rawBase64.startsWith("data:")) {
      rawBase64 = rawBase64.split(",")[1];
    }

    const requestBody = {
      contents: [{
        role: "user",
        parts: [
          { text: `Extract the following details from this fuel receipt image and return ONLY a raw JSON object with no markdown or formatting:\n{"totalAmount": number, "liters": number, "date": "YYYY-MM-DD"}\nIf any field is missing or illegible, set its value to null.` },
          { inlineData: { mimeType: mimeType, data: rawBase64 } }
        ]
      }],
      generationConfig: { temperature: 0.1, maxOutputTokens: 200 }
    };

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(requestBody) }
    );

    if (!response.ok) throw new Error("Gemini API error");

    const data = await response.json();
    let cleanJsonStr = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "{}";
    if (cleanJsonStr.startsWith("```json")) cleanJsonStr = cleanJsonStr.substring(7);
    if (cleanJsonStr.startsWith("```")) cleanJsonStr = cleanJsonStr.substring(3);
    if (cleanJsonStr.endsWith("```")) cleanJsonStr = cleanJsonStr.substring(0, cleanJsonStr.length - 3);

    return JSON.parse(cleanJsonStr.trim());
  } catch (error: any) {
    console.error("[FuelScanner] failed:", error);
    return { totalAmount: null, liters: null, date: null };
  }
}

export async function scanDocumentWithSahayak(base64Data: string, mimeType: string): Promise<any[]> {
  try {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("Scanner core is not configured (VITE_GEMINI_API_KEY missing).");
    }

    // Ensure we have raw base64 without the data-URL prefix for Gemini inlineData
    let rawBase64 = base64Data;
    if (rawBase64.startsWith("data:")) {
      rawBase64 = rawBase64.split(",")[1];
    }

    console.log("[SahayakScanner] Requesting Gemini model for document scan");

    const requestBody = {
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `You are an expert data extraction engine. I am providing you with a document (image of a physical register, spreadsheet, or handwritten list). Extract the list of students from it.
Map the data strictly to this JSON array schema:
Extract the following exact JSON schema: [{ "student_name": "String", "guardian_name": "String", "phone_number": "String (Must extract this exactly, even if it looks like a generic number)", "academic_grade": "String", "academic_section": "String" }]. Do NOT miss the phone_number. If missing, put '-'.
Respond ONLY with the raw JSON array. Do NOT include markdown formatting, markdown blocks (\`\`\`json), or conversational text.`,
            },
            {
              inlineData: {
                mimeType: mimeType,
                data: rawBase64,
              },
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 4096,
      },
    };

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(`Gemini API error ${response.status}: ${JSON.stringify(errData)}`);
    }

    const data = await response.json();
    const responseText =
      data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Clean up potential markdown blocks if the model ignores the instruction
    let cleanJsonStr = responseText.trim();
    if (cleanJsonStr.startsWith("```json")) {
      cleanJsonStr = cleanJsonStr.substring(7);
    }
    if (cleanJsonStr.startsWith("```")) {
      cleanJsonStr = cleanJsonStr.substring(3);
    }
    if (cleanJsonStr.endsWith("```")) {
      cleanJsonStr = cleanJsonStr.substring(0, cleanJsonStr.length - 3);
    }
    cleanJsonStr = cleanJsonStr.trim();

    const parsedData = JSON.parse(cleanJsonStr);

    if (!Array.isArray(parsedData)) {
      throw new Error("Invalid format received from scanner.");
    }

    return parsedData;
  } catch (error: any) {
    console.error("[SahayakScanner] failed:", error);
    throw new Error(
      "Failed to scan document. Ensure the file is a clear image and try again."
    );
  }
}

/**
 * Normalizes text for fuzzy matching
 */
function normalizeForMatch(str: string | undefined): string {
  if (!str) return '';
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Checks for duplicates against the existing user base
 */
export function markDuplicates(scannedRows: any[], existingUsers: any[]): any[] {
  return scannedRows.map(row => {
    const normName = normalizeForMatch(row.student_name);
    const grade = row.academic_grade ? row.academic_grade.toString().trim() : '';
    
    // Find matching user (same name and class)
    const match = existingUsers.find(u => {
      if (u.role !== 'Student') return false;
      const uName = normalizeForMatch(u.name);
      
      // Match name and class
      // Grade could be "10" and className "Class 10"
      const uGrade = u.className?.replace(/[^0-9]/g, '') || '';
      const rGrade = grade.replace(/[^0-9]/g, '');
      
      const gradeMatches = (!rGrade || !uGrade) || (rGrade === uGrade);
      
      return uName === normName && gradeMatches;
    });

    if (match) {
      return {
        ...row,
        isDuplicate: true,
        matchedUserId: match.id,
        action: 'Update Existing' // default action for duplicates
      };
    }
    
    return { ...row, isDuplicate: false, action: 'Add as New' };
  });
}
