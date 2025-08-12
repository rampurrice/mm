
import { GoogleGenAI, Type } from "@google/genai";
import { ReleaseOrder, KantaParchiData, CmrDepositOrder } from '../types';

// --- Paddy Lifting (RO) Functions ---

const roValidationSchema = {
    type: Type.OBJECT,
    properties: {
        isDhanDeliveryOrder: { 
            type: Type.BOOLEAN, 
            description: "True if the document title is 'Dhan Delivery Order' or 'धान डिलेवरी आर्डर', false otherwise." 
        },
    },
    required: ["isDhanDeliveryOrder"],
};

export async function validateDhanDeliveryOrder(base64Pdf: string): Promise<boolean> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const pdfPart = { inlineData: { mimeType: 'application/pdf', data: base64Pdf } };
    const textPart = { text: `Analyze the title of this document. Is this document a "धान डिलेवरी आर्डर" (Dhan Delivery Order)? It is very important that it is not a "CMR DEPOSIT ORDER". Respond with true if it is a Dhan Delivery Order, and false otherwise.` };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [textPart, pdfPart] },
            config: { responseMimeType: 'application/json', responseSchema: roValidationSchema },
        });
        const data = JSON.parse(response.text.trim());
        if (data && typeof data.isDhanDeliveryOrder === 'boolean') return data.isDhanDeliveryOrder;
        throw new Error("Could not determine document type from AI response.");
    } catch (error) {
        console.error("Error validating RO document with Gemini:", error);
        throw new Error("Failed to validate the RO document type.");
    }
}

const roSchema = {
    type: Type.OBJECT,
    properties: {
        doNo: { type: Type.STRING, description: "Delivery Order Number (e.g., 1224121212510046)" },
        doDate: { type: Type.STRING, description: "Date of the Delivery Order (e.g., 12/Mar/2025)" },
        lotNo: { type: Type.STRING, description: "The Lot Number from the table (e.g., Lot46.0000/2)" },
        issueCenter: { type: Type.STRING, description: "The name of the issuing center or 'Praday Kendra' from the table (e.g., Satna Unit-II)" },
        godown: { type: Type.STRING, description: "The name or location of the godown/warehouse from the table (e.g., JAMUNA WAREHOUSE NO. 25)" },
        quantity: { type: Type.STRING, description: "The total quantity of paddy in Quintals from the table (e.g., 433.00)" },
        validUpto: { type: Type.STRING, description: "The final validity date for a pickup (\"धान का उठाव सुनिश्चित करें\") (e.g., 22/Mar/2025)" },
        uparjanVarsh: { type: Type.STRING, description: "The procurement year, labeled 'उपार्जन वर्ष' (e.g., '2023-24')." },
    },
    required: ["doNo", "doDate", "lotNo", "issueCenter", "godown", "quantity", "validUpto", "uparjanVarsh"],
};

export async function extractRoDataFromPdf(base64Pdf: string): Promise<ReleaseOrder> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const pdfPart = { inlineData: { mimeType: 'application/pdf', data: base64Pdf } };
    const textPart = { text: `From the provided MPSCSC Paddy Delivery Order PDF, extract the following details precisely: 1. 'डी०ओ० क्रमांक' as doNo; 2. 'डी०ओ० दिनाँक' as doDate; 3. 'Lot No.' from the table as lotNo; 4. 'Issue Center' from the table as issueCenter; 5. 'Godown' from the table as godown; 6. 'Quantity (Qtls)' from the table as quantity; 7. The final date mentioned in the 'प्रतिलिपि' section for ensuring pickup ('धान का उठाव सुनिश्चित करें') as validUpto; 8. The 'उपार्जन वर्ष' (procurement year) as uparjanVarsh. Provide the response in the requested JSON format.` };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [textPart, pdfPart] },
            config: { responseMimeType: 'application/json', responseSchema: roSchema },
        });
        const data = JSON.parse(response.text.trim());
        if (data && typeof data.doNo === 'string' && typeof data.lotNo === 'string' && typeof data.uparjanVarsh === 'string') return data as ReleaseOrder;
        throw new Error("Extracted RO data is not in the expected format or is missing the 'Uparjan Varsh'.");
    } catch (error) {
        console.error("Error extracting RO data from PDF with Gemini:", error);
        throw new Error("Failed to analyze the RO PDF. Please ensure it's a valid and clear document and includes 'उपार्जन वर्ष'.");
    }
}

// --- Rice Delivery (CMR) Functions ---

const cmrValidationSchema = {
    type: Type.OBJECT,
    properties: {
        isCmrDepositOrder: { 
            type: Type.BOOLEAN, 
            description: "True if the document title is 'CMR DEPOSIT ORDER' or 'सीएमआर जमा आदेश', false otherwise. It must not be a 'Dhan Delivery Order'." 
        },
    },
    required: ["isCmrDepositOrder"],
};

export async function validateCmrDepositOrder(base64Pdf: string): Promise<boolean> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const pdfPart = { inlineData: { mimeType: 'application/pdf', data: base64Pdf } };
    const textPart = { text: `Analyze the title of this document. Is this document a "CMR DEPOSIT ORDER" or "सीएमआर जमा आदेश"? Respond with true if it is, and false otherwise.` };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [textPart, pdfPart] },
            config: { responseMimeType: 'application/json', responseSchema: cmrValidationSchema },
        });
        const data = JSON.parse(response.text.trim());
        if (data && typeof data.isCmrDepositOrder === 'boolean') return data.isCmrDepositOrder;
        throw new Error("Could not determine document type from AI response.");
    } catch (error) {
        console.error("Error validating CMR document with Gemini:", error);
        throw new Error("Failed to validate the CMR document type.");
    }
}

const cmroSchema = {
    type: Type.OBJECT,
    properties: {
        doNo: { type: Type.STRING, description: "The Delivery Order Number (डी०ओ० क्रमांक) this CMR is generated against." },
        orderNo: { type: Type.STRING, description: "The unique order or reference number (e.g., 'Order No.', 'CMR Deposit No.')." },
        depositDate: { type: Type.STRING, description: "The date of the deposit order (e.g., 15/Apr/2025)." },
        depositedAt: { type: Type.STRING, description: "The name of the godown or location where the rice is to be deposited (e.g., FCI, CWC)." },
    },
    required: ["doNo", "orderNo", "depositDate", "depositedAt"],
};

export async function extractCmroDataFromPdf(base64Pdf: string): Promise<Partial<CmrDepositOrder>> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const pdfPart = { inlineData: { mimeType: 'application/pdf', data: base64Pdf } };
    const textPart = { text: `From the provided CMR Deposit Order PDF, extract only these essential details: 1. The Delivery Order number it is issued against, often labeled 'डी०ओ० क्रमांक', as doNo; 2. The CMR order or reference number as orderNo; 3. The date of the order as depositDate; 4. The name of the godown or center where the rice should be deposited as depositedAt. Do not extract vehicle number or quantities. Provide the response in the requested JSON format.` };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [textPart, pdfPart] },
            config: { responseMimeType: 'application/json', responseSchema: cmroSchema },
        });
        const data = JSON.parse(response.text.trim());
        if (data && typeof data.orderNo === 'string' && typeof data.doNo === 'string') return data as Partial<CmrDepositOrder>;
        throw new Error("Extracted CMR data is not in the expected format or is missing the DO Number.");
    } catch (error) {
        console.error("Error extracting CMR data from PDF with Gemini:", error);
        throw new Error("Failed to analyze the CMR Deposit Order PDF. Please ensure it's a valid and clear document and includes a DO Number.");
    }
}


// --- Kanta Parchi (Weighing Slip) Functions ---

const kantaParchiSchema = {
    type: Type.OBJECT,
    properties: {
        rstNo: { type: Type.STRING, description: "The receipt or slip number, usually a 5-digit number at the top left of the slip (e.g., '12800', '12805')." },
        truckNo: { type: Type.STRING, description: "The vehicle number, labelled as 'VEHICLE NO' (e.g., 'MP19HA4165')." },
        liftedQuantityInKg: { type: Type.STRING, description: "The 'NET Wt' value in Kilograms. This is the third weight value listed (e.g., '22555')." },
        numberOfBags: { type: Type.STRING, description: "The number of bags. This is often handwritten on the slip, sometimes with the word 'बोरी'. If not found, return an empty string." },
    },
    required: ["rstNo", "truckNo", "liftedQuantityInKg", "numberOfBags"],
};

export async function extractKantaParchiData(base64Image: string, mimeType: string): Promise<KantaParchiData> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const imagePart = { inlineData: { mimeType, data: base64Image } };
    const textPart = { text: `You are an expert OCR system for low-quality, dot-matrix printed Kanta Parchi (weighing slips). Analyze the image and extract the following:
1.  **rstNo**: Find the slip number. This is usually a 5-digit number at the top, sometimes to the left of the vehicle number (e.g., '12800', '12915').
2.  **truckNo**: Find the 'VEHICLE NO'. It looks like 'MP19HA4165' or 'UP64T8002'.
3.  **liftedQuantityInKg**: Find the 'NET Wt'. This is the third and lowest weight value, representing the net weight in Kilograms (kg). Extract only the numeric value.
4.  **numberOfBags**: Look for handwritten numbers on or near the slip, often circled or with the word 'बोरी' (bori). This is the number of bags. If no handwritten value is found, return an empty string for this field.
Return the response in the requested JSON format. Do not guess any values.` };
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [textPart, imagePart] },
            config: { responseMimeType: 'application/json', responseSchema: kantaParchiSchema },
        });
        const data = JSON.parse(response.text.trim());
        return data as KantaParchiData;
    } catch (error) {
        console.error("Error extracting Kanta Parchi data with Gemini:", error);
        throw new Error("Failed to analyze the weighing slip. Please check the image quality or enter the data manually.");
    }
}
