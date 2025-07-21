# API Ekstraksi Data Kartu Keluarga Indonesia

## Overview
API untuk menganalisis dan mengekstrak data dari dokumen Kartu Keluarga (KK) Indonesia menggunakan teknologi AI Gemini. API ini dapat memproses gambar KK dan mengekstrak informasi terstruktur seperti data kepala keluarga, anggota keluarga, dan informasi administratif lainnya.

## Fitur Utama
- ✅ Ekstraksi otomatis data dari gambar Kartu Keluarga
- ✅ Validasi dokumen (memastikan yang diupload adalah KK)
- ✅ Penyimpanan otomatis ke Google Sheets
- ✅ Backup file gambar ke Google Drive
- ✅ Logging aktivitas lengkap
- ✅ Response terstruktur dalam format JSON
- ✅ Dokumentasi API built-in

## Base URL
```
https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```

## Authentication
API ini menggunakan Google Apps Script yang tidak memerlukan authentication khusus, namun perlu konfigurasi permissions untuk akses Google Drive dan Sheets.

## Endpoints

### 1. Health Check
**GET** `/`

Mengecek status API dan ketersediaan layanan.

#### Response
```json
{
  "status": "success",
  "message": "API Ekstraksi Data KK sedang berjalan. Gunakan metode POST untuk menganalisis Kartu Keluarga.",
  "documentation": "Kirim parameter \"action=docs\" untuk mendapatkan dokumentasi"
}
```

### 2. Process Kartu Keluarga
**POST** `/`

Memproses gambar Kartu Keluarga dan mengekstrak datanya.

#### Request Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| action | string | ✅ | Harus berisi "process-kk" |
| fileData | string | ✅ | Gambar dalam format base64 |
| fileName | string | ✅ | Nama file gambar |
| mimeType | string | ✅ | MIME type (image/jpeg, image/png, dll) |

#### Request Example
```bash
curl -X POST "https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "action=process-kk&fileData=iVBORw0KGgoAAAANSUhEUgAA...&fileName=kk.jpg&mimeType=image/jpeg"
```

#### Response Success (KK Valid)
```json
{
  "status": "success",
  "code": 200,
  "data": {
    "original": {
      "fileUrl": "https://drive.google.com/file/d/1abc...xyz/view",
      "fileName": "kk.jpg",
      "mimeType": "image/jpeg"
    },
    "analysis": {
      "raw": "NOMOR KK: 1234567897894563\nKODE KELUARGA: 123456789...",
      "parsed": {
        "status": "success",
        "nomor_kk": "1234567897894563",
        "kode_keluarga": "123456789",
        "kepala_keluarga": {
          "nama": "CLASSY INDONESIA",
          "nik": "000000000000",
          "alamat": "xxxxxx",
          "rt_rw": "000/000",
          "desa_kelurahan": "xx",
          "kecamatan": "xx",
          "kabupaten_kota": "xx",
          "kode_pos": "xx",
          "provinsi": "xx"
        },
        "anggota_keluarga": [
          {
            "nama": "xx",
            "nik": "00000000000",
            "jenis_kelamin": "xx",
            "tempat_lahir": "xx",
            "tanggal_lahir": "xx",
            "agama": "xx",
            "pendidikan": "xx",
            "pekerjaan": "xx"
          }
        ],
        "status_hubungan": [
          {
            "nama": "xx",
            "status_pernikahan": "xx",
            "hubungan_keluarga": "xx",
            "kewarganegaraan": "xx"
          }
        ],
        "orang_tua": [
          {
            "nama": "xx",
            "ayah": "xx",
            "ibu": "xx"
          }
        ],
        "tanggal_penerbitan": "xx"
      }
    }
  }
}
```

#### Response Success (Bukan KK)
```json
{
  "status": "success",
  "code": 200,
  "data": {
    "original": {
      "fileUrl": "https://drive.google.com/file/d/1abc...xyz/view",
      "fileName": "document.jpg",
      "mimeType": "image/jpeg"
    },
    "analysis": {
      "raw": "Dokumen ini bukan Kartu Keluarga",
      "parsed": {
        "status": "not_kk",
        "message": "Dokumen yang diberikan bukan merupakan Kartu Keluarga"
      }
    }
  }
}
```

#### Response Error
```json
{
  "status": "error",
  "message": "Parameter wajib tidak ada: fileData, fileName, dan mimeType harus disediakan",
  "code": 400
}
```

### 3. Get API Documentation
**POST** `/`

Mendapatkan dokumentasi API lengkap.

#### Request Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| action | string | ✅ | Harus berisi "docs" |

#### Response
```json
{
  "api_name": "API Ekstraksi Data KK",
  "version": "1.0.0",
  "description": "API untuk menganalisis dan mengekstrak data dari Kartu Keluarga (KK) Indonesia menggunakan Gemini AI",
  "base_url": "https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec",
  "endpoints": [...],
  "examples": {...}
}
```

## Error Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Bad Request - Parameter tidak lengkap atau salah |
| 500 | Internal Server Error - Error sistem atau API |

## Data Storage

API ini menyimpan data ke beberapa Google Sheets:

### 1. Sheet "log"
Menyimpan log aktivitas sistem:
- Timestamp
- Action
- Message  
- Level

### 2. Sheet "metadata"
Menyimpan metadata file yang diproses:
- Timestamp
- FileName
- FileID
- FileURL
- Description
- IsKK

### 3. Sheet "data_kk"
Menyimpan data utama Kartu Keluarga:
- Nomor KK
- Kode Keluarga
- Data Kepala Keluarga
- Jumlah Anggota
- Tanggal Penerbitan

### 4. Sheet "anggota_keluarga"
Menyimpan detail setiap anggota keluarga:
- Data personal lengkap
- Status pernikahan
- Hubungan keluarga
- Data orang tua

## Setup dan Konfigurasi

### Requirements
- Google Apps Script Project
- Google Drive untuk penyimpanan file
- Google Sheets untuk database
- Gemini AI API Key

### Konfigurasi
```javascript
const GEMINI_API_KEY = 'YOUR_GEMINI_API_KEY';
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID';
const FOLDER_ID = 'YOUR_DRIVE_FOLDER_ID';
```

### Permissions
API memerlukan akses ke:
- Google Drive (untuk menyimpan file)
- Google Sheets (untuk database)
- UrlFetchApp (untuk memanggil Gemini AI)

## Contoh Implementasi

### JavaScript (Browser)
```javascript
async function processKK(file) {
  const formData = new FormData();
  formData.append('action', 'process-kk');
  formData.append('fileName', file.name);
  formData.append('mimeType', file.type);
  
  // Convert file to base64
  const base64 = await fileToBase64(file);
  formData.append('fileData', base64);
  
  const response = await fetch('YOUR_SCRIPT_URL', {
    method: 'POST',
    body: formData
  });
  
  return await response.json();
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = error => reject(error);
  });
}
```

### Python
```python
import base64
import requests

def process_kk(file_path):
    with open(file_path, 'rb') as f:
        file_data = base64.b64encode(f.read()).decode()
    
    payload = {
        'action': 'process-kk',
        'fileData': file_data,
        'fileName': 'kk.jpg',
        'mimeType': 'image/jpeg'
    }
    
    response = requests.post('YOUR_SCRIPT_URL', data=payload)
    return response.json()
```

### PHP
```php
function processKK($filePath) {
    $fileData = base64_encode(file_get_contents($filePath));
    
    $data = [
        'action' => 'process-kk',
        'fileData' => $fileData,
        'fileName' => basename($filePath),
        'mimeType' => 'image/jpeg'
    ];
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, 'YOUR_SCRIPT_URL');
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($data));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    
    $response = curl_exec($ch);
    curl_close($ch);
    
    return json_decode($response, true);
}
```

## Limitations

- Ukuran file maksimal: 50MB (batasan Google Apps Script)
- Rate limit: 100 requests per hour per user
- Format yang didukung: JPG, PNG, GIF, BMP, WEBP
- Hanya mendukung Kartu Keluarga format Indonesia
- Akurasi ekstraksi bergantung pada kualitas gambar

## Best Practices

1. **Kualitas Gambar**: Gunakan gambar dengan resolusi tinggi dan pencahayaan yang baik
2. **Format File**: Gunakan format JPG atau PNG untuk hasil terbaik
3. **Error Handling**: Selalu handle response error dari API
4. **Security**: Jangan expose API key di client-side code
5. **Caching**: Implementasikan caching untuk menghindari pemrosesan ulang

## Support & Contributing

Untuk pertanyaan, bug report, atau kontribusi, silakan buat issue di repository GitHub.

## License

MIT License - Bebas digunakan untuk keperluan komersial maupun non-komersial.
