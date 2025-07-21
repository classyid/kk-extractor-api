
```markdown
# 🇮🇩 KK Extractor API

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Google Apps Script](https://img.shields.io/badge/Google%20Apps%20Script-4285F4?logo=google&logoColor=white)](https://script.google.com/)
[![Gemini AI](https://img.shields.io/badge/Gemini%20AI-8E75B2?logo=google&logoColor=white)](https://ai.google.dev/)

> **API untuk ekstraksi data otomatis dari Kartu Keluarga (KK) Indonesia menggunakan teknologi AI**

API ini memungkinkan Anda untuk menganalisis gambar Kartu Keluarga Indonesia dan mengekstrak data terstruktur seperti informasi kepala keluarga, anggota keluarga, dan detail administratif lainnya secara otomatis.

## ✨ Fitur

- 🤖 **AI-Powered**: Menggunakan Gemini AI untuk analisis dokumen
- 📊 **Auto Storage**: Penyimpanan otomatis ke Google Sheets
- 💾 **File Backup**: Backup gambar ke Google Drive
- ✅ **Document Validation**: Validasi otomatis dokumen KK
- 📝 **Structured Output**: Output data terstruktur dalam JSON
- 🔄 **Real-time Processing**: Pemrosesan real-time tanpa antrian
- 📋 **Comprehensive Logging**: Log aktivitas lengkap
- 🛡️ **Error Handling**: Penanganan error yang robust

## 🚀 Demo

**Live API Endpoint:**
```
https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```

**Contoh Request:**
```bash
curl -X POST "https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "action=process-kk&fileData=iVBORw0KGgo...&fileName=kk.jpg&mimeType=image/jpeg"
```

## 📋 Prerequisites

- Google Account dengan akses ke:
  - Google Apps Script
  - Google Drive
  - Google Sheets
- Gemini AI API Key
- Kartu Keluarga Indonesia (untuk testing)

## 🛠️ Setup

### 1. Clone Repository
```bash
git clone https://github.com/yourusername/kk-extractor-api.git
cd kk-extractor-api
```

### 2. Buat Google Apps Script Project
1. Buka [Google Apps Script](https://script.google.com/)
2. Buat project baru
3. Copy-paste kode dari `src/main.js`

### 3. Konfigurasi
Edit bagian konfigurasi di file:
```javascript
const GEMINI_API_KEY = 'your-gemini-api-key';
const SPREADSHEET_ID = 'your-spreadsheet-id';
const FOLDER_ID = 'your-drive-folder-id';
```

### 4. Deploy
1. Klik "Deploy" > "New deployment"
2. Pilih "Web app"
3. Set execute as "Me" dan access to "Anyone"
4. Copy deployment URL

## 📖 Dokumentasi API

### Endpoints

#### Health Check
```http
GET /
```

#### Process Kartu Keluarga
```http
POST /
Content-Type: application/x-www-form-urlencoded

action=process-kk
fileData=base64_encoded_image
fileName=kk.jpg
mimeType=image/jpeg
```

#### Get Documentation
```http
POST /
Content-Type: application/x-www-form-urlencoded

action=docs
```

### Response Format
```json
{
  "status": "success",
  "code": 200,
  "data": {
    "original": {
      "fileUrl": "https://drive.google.com/file/d/...",
      "fileName": "kk.jpg",
      "mimeType": "image/jpeg"
    },
    "analysis": {
      "raw": "...",
      "parsed": {
        "status": "success",
        "nomor_kk": "3571021511100006",
        "kepala_keluarga": { ... },
        "anggota_keluarga": [ ... ]
      }
    }
  }
}
```

## 💻 Contoh Implementasi

### JavaScript (Frontend)
```javascript
async function processKK(file) {
  const formData = new FormData();
  formData.append('action', 'process-kk');
  formData.append('fileName', file.name);
  formData.append('mimeType', file.type);
  
  const base64 = await fileToBase64(file);
  formData.append('fileData', base64);
  
  const response = await fetch('YOUR_API_URL', {
    method: 'POST',
    body: formData
  });
  
  return await response.json();
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
    
    response = requests.post('YOUR_API_URL', data=payload)
    return response.json()
```

## 📁 Struktur Project

```
kk-extractor-api/
├── src/
│   └── main.js              # Google Apps Script code
├── docs/
│   ├── API_DOCUMENTATION.md # Dokumentasi lengkap API
│   └── SETUP_GUIDE.md       # Panduan setup detail
├── examples/
│   ├── javascript/          # Contoh implementasi JS
│   ├── python/             # Contoh implementasi Python
│   └── php/                # Contoh implementasi PHP
├── tests/
│   └── sample-kk/          # Sample Kartu Keluarga untuk testing
├── README.md
└── LICENSE
```

## 🔧 Configuration

### Google Sheets Structure

API akan membuat 4 sheet otomatis:

1. **log** - Activity logs
2. **metadata** - File metadata
3. **data_kk** - Main KK data
4. **anggota_keluarga** - Family members details

### Permissions Required

- `https://www.googleapis.com/auth/spreadsheets`
- `https://www.googleapis.com/auth/drive`
- `https://www.googleapis.com/auth/script.external_request`

## 🎯 Use Cases

- **Digitalisasi Arsip**: Konversi arsip KK fisik ke digital
- **Aplikasi Pendaftaran**: Otomasi input data dari KK
- **Sistem Administrasi**: Integrasi dengan sistem pemerintahan
- **Research & Analytics**: Analisis data demografi
- **Document Management**: Sistem manajemen dokumen

## 🚧 Limitations

- Ukuran file maksimal: 50MB
- Rate limit: 100 requests/hour/user
- Format: JPG, PNG, GIF, BMP, WEBP
- Khusus format KK Indonesia

## 🤝 Contributing

Kontribusi sangat welcome! Silakan:

1. Fork repository
2. Buat feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push ke branch (`git push origin feature/AmazingFeature`)
5. Buat Pull Request

## 📝 Changelog

### v1.0.0 (2024-01-01)
- Initial release
- Basic KK data extraction
- Google Sheets integration
- API documentation

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

## 🙏 Acknowledgments

- [Google Gemini AI](https://ai.google.dev/) - AI processing
- [Google Apps Script](https://script.google.com/) - Backend platform
- [Google Workspace](https://workspace.google.com/) - Storage & database

## 📞 Support

Jika Anda mengalami masalah atau memiliki pertanyaan:

- 📧 Email: your.email@domain.com
- 💬 Discussions: [GitHub Discussions](https://github.com/yourusername/kk-extractor-api/discussions)
- 🐛 Bug Reports: [GitHub Issues](https://github.com/yourusername/kk-extractor-api/issues)

---

<div align="center">
  <sub>Built with ❤️ for Indonesia's digital transformation</sub>
</div>
```

## Struktur Folder Recommended

```
kk-extractor-api/
├── .github/
│   ├── workflows/
│   │   └── ci.yml
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.md
│   │   └── feature_request.md
│   └── PULL_REQUEST_TEMPLATE.md
├── src/
│   ├── main.js              # Main Google Apps Script code
│   ├── config.js            # Configuration file
│   └── utils.js             # Utility functions
├── docs/
│   ├── API_DOCUMENTATION.md
│   ├── SETUP_GUIDE.md
│   ├── DEPLOYMENT.md
│   └── TROUBLESHOOTING.md
├── examples/
│   ├── javascript/
│   │   ├── basic-usage.html
│   │   └── advanced-usage.js
│   ├── python/
│   │   ├── basic_example.py
│   │   └── batch_processing.py
│   └── php/
│       └── example.php
├── tests/
│   ├── sample-kk/
│   │   ├── valid-kk-1.jpg
│   │   ├── valid-kk-2.jpg
│   │   └── invalid-document.jpg
│   └── test-cases.md
├── assets/
│   ├── images/
│   │   ├── logo.png
│   │   ├── demo.gif
│   │   └── architecture.png
│   └── diagrams/
├── .gitignore
├── LICENSE
├── README.md
├── CHANGELOG.md
└── CONTRIBUTING.md
```
