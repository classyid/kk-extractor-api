// Config
const GEMINI_API_KEY = '<APIKEY-GEMINI>';
const GEMINI_MODEL = 'gemini-2.0-flash';
const SPREADSHEET_ID = '<SPREDSHEET-ID>';
const LOG_SHEET_NAME = 'log';
const METADATA_SHEET_NAME = 'metadata';
const KK_DATA_SHEET_NAME = 'data_kk';
const ANGGOTA_SHEET_NAME = 'anggota_keluarga';
const FOLDER_ID = '<FOLDER-ID>';

// Prompt template untuk parsing Kartu Keluarga
const PROMPT_TEMPLATE = ``;

/**
 * Handle GET requests - Return API status
 */
function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: 'success',
    message: 'API Ekstraksi Data KK sedang berjalan. Gunakan metode POST untuk menganalisis Kartu Keluarga.',
    documentation: 'Kirim parameter "action=docs" untuk mendapatkan dokumentasi'
  })).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Handle OPTIONS requests for CORS preflight
 */
function doOptions(e) {
  return ContentService.createTextOutput('');
}

/**
 * Handle POST requests - Process image and return JSON response
 */
function doPost(e) {
  try {
    // Get parameters from form data or JSON
    let data;
    
    if (e.postData && e.postData.contents) {
      try {
        // Try parsing as JSON first
        data = JSON.parse(e.postData.contents);
      } catch (error) {
        // If not JSON, fall back to form parameters
        data = e.parameter;
      }
    } else {
      // Use form parameters directly
      data = e.parameter;
    }
    
    // Check if action is provided
    if (!data.action) {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'error',
        message: 'Parameter wajib tidak ada: action',
        code: 400
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // Handle different API actions
    let result;
    
    switch(data.action) {
      case 'process-kk':
        result = processKKAPI(data);
        break;
      case 'docs':
        result = getApiDocumentation();
        break;
      default:
        result = {
          status: 'error',
          message: `Action tidak dikenal: ${data.action}`,
          code: 400
        };
    }
    
    // Return result
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    logAction('API Error', `Error di endpoint API: ${error.toString()}`, 'ERROR');
    
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString(),
      code: 500
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * API endpoint to process Kartu Keluarga
 */
function processKKAPI(data) {
  try {
    // Validate required parameters
    if (!data.fileData || !data.fileName || !data.mimeType) {
      return {
        status: 'error',
        message: 'Parameter wajib tidak ada: fileData, fileName, dan mimeType harus disediakan',
        code: 400
      };
    }
    
    // Log the request 
    logAction('Request', 'Permintaan pemrosesan KK diterima', 'INFO');
    
    // Process the KK image
    const result = processImage(data.fileData, data.fileName, data.mimeType);
    
    // If successful, structure the response
    if (result.success) {
      // Check if the image was not a KK
      if (result.description === "Dokumen ini bukan Kartu Keluarga") {
        return {
          status: 'success',
          code: 200,
          data: {
            original: {
              fileUrl: result.fileUrl,
              fileName: data.fileName,
              mimeType: data.mimeType
            },
            analysis: {
              raw: result.description,
              parsed: {
                status: 'not_kk',
                message: 'Dokumen yang diberikan bukan merupakan Kartu Keluarga'
              }
            }
          }
        };
      } else {
        // Parse KK data into structured format
        const kkData = parseKKData(result.description);
        
        return {
          status: 'success',
          code: 200,
          data: {
            original: {
              fileUrl: result.fileUrl,
              fileName: data.fileName,
              mimeType: data.mimeType
            },
            analysis: {
              raw: result.description,
              parsed: {
                status: 'success',
                nomor_kk: kkData.nomor_kk,
                kode_keluarga: kkData.kode_keluarga,
                kepala_keluarga: kkData.kepala_keluarga,
                anggota_keluarga: kkData.anggota_keluarga,
                status_hubungan: kkData.status_hubungan,
                orang_tua: kkData.orang_tua,
                tanggal_penerbitan: kkData.tanggal_penerbitan
              }
            }
          }
        };
      }
    } else {
      return {
        status: 'error',
        message: result.error,
        code: 500
      };
    }
  } catch (error) {
    logAction('API Error', `Error in processKKAPI: ${error.toString()}`, 'ERROR');
    return {
      status: 'error',
      message: error.toString(),
      code: 500
    };
  }
}

/**
 * Return API documentation in JSON format
 */
function getApiDocumentation() {
  const docs = {
    api_name: "API Ekstraksi Data KK",
    version: "1.0.0",
    description: "API untuk menganalisis dan mengekstrak data dari Kartu Keluarga (KK) Indonesia menggunakan Gemini AI",
    base_url: ScriptApp.getService().getUrl(),
    endpoints: [
      {
        path: "/",
        method: "GET",
        description: "Pemeriksaan status API",
        parameters: {}
      },
      {
        path: "/",
        method: "POST",
        description: "Proses gambar Kartu Keluarga dan ekstrak datanya",
        parameters: {
          action: {
            type: "string",
            required: true,
            description: "Aksi API yang akan dilakukan",
            value: "process-kk"
          }
        },
        body: {
          type: "application/x-www-form-urlencoded atau application/json",
          required: true,
          schema: {
            fileData: {
              type: "string (base64)",
              required: true,
              description: "Data gambar KK yang di-encode dalam format base64"
            },
            fileName: {
              type: "string",
              required: true,
              description: "Nama file"
            },
            mimeType: {
              type: "string",
              required: true,
              description: "MIME type dari gambar (e.g., image/jpeg, image/png)"
            }
          }
        },
        responses: {
          "200": {
            description: "Operasi berhasil",
            schema: {
              status: "success",
              code: 200,
              data: {
                original: {
                  fileUrl: "URL ke file yang disimpan di Google Drive",
                  fileName: "Nama file yang diunggah",
                  mimeType: "MIME type dari file"
                },
                analysis: {
                  raw: "Deskripsi mentah dari Gemini AI",
                  parsed: {
                    status: "success atau not_kk",
                    nomor_kk: "Nomor Kartu Keluarga",
                    kode_keluarga: "Kode Keluarga (K-code)",
                    kepala_keluarga: {
                      nama: "Nama lengkap kepala keluarga",
                      nik: "NIK kepala keluarga",
                      alamat: "Alamat lengkap",
                      rt_rw: "RT/RW",
                      desa_kelurahan: "Desa/Kelurahan",
                      kecamatan: "Kecamatan",
                      kabupaten_kota: "Kabupaten/Kota",
                      kode_pos: "Kode Pos",
                      provinsi: "Provinsi"
                    },
                    anggota_keluarga: [
                      {
                        nama: "Nama lengkap anggota",
                        nik: "NIK anggota",
                        jenis_kelamin: "Jenis kelamin",
                        tempat_lahir: "Tempat lahir",
                        tanggal_lahir: "Tanggal lahir",
                        agama: "Agama",
                        pendidikan: "Pendidikan",
                        pekerjaan: "Pekerjaan"
                      }
                    ],
                    status_hubungan: [
                      {
                        nama: "Nama anggota",
                        status_pernikahan: "Status pernikahan",
                        hubungan_keluarga: "Hubungan dalam keluarga",
                        kewarganegaraan: "Kewarganegaraan"
                      }
                    ],
                    orang_tua: [
                      {
                        nama: "Nama anggota",
                        ayah: "Nama ayah",
                        ibu: "Nama ibu"
                      }
                    ],
                    tanggal_penerbitan: "Tanggal penerbitan KK"
                  }
                }
              }
            }
          },
          "400": {
            description: "Bad request",
            schema: {
              status: "error",
              message: "Detail error",
              code: 400
            }
          },
          "500": {
            description: "Server error",
            schema: {
              status: "error",
              message: "Detail error",
              code: 500
            }
          }
        }
      },
      {
        path: "/",
        method: "POST",
        description: "Dapatkan dokumentasi API",
        parameters: {
          action: {
            type: "string",
            required: true,
            description: "Aksi API yang akan dilakukan",
            value: "docs"
          }
        },
        responses: {
          "200": {
            description: "Dokumentasi API",
            schema: "Objek dokumentasi ini"
          }
        }
      }
    ],
    examples: {
      "process-kk": {
        request: {
          method: "POST",
          url: ScriptApp.getService().getUrl(),
          headers: {
            "Content-Type": "application/x-www-form-urlencoded"
          },
          body: "action=process-kk&fileData=base64_encoded_kk_image&fileName=kk.jpg&mimeType=image/jpeg"
        },
        response: {
          status: "success",
          code: 200,
          data: {
            original: {
              fileUrl: "https://drive.google.com/file/d/xxx/view",
              fileName: "kk.jpg",
              mimeType: "image/jpeg"
            },
            analysis: {
              raw: "NOMOR KK: 3571021511100006\nKODE KELUARGA: 3571010965\n\nKEPALA KELUARGA:\nNama: ANDRI WIRATMONO\nNIK: 3571022311520001\nAlamat: JLN REJOMULYO VII / 322\nRT/RW: 003/006\nDesa/Kelurahan: REJOMULYO\nKecamatan: KOTA KEDIRI\nKabupaten/Kota: KOTA KEDIRI\nKode Pos: 64129\nProvinsi: JAWA TIMUR\n\nANGGOTA KELUARGA:\n1. Nama: ANDRI WIRATMONO\n   NIK: 3571022311520001\n   Jenis Kelamin: LAKI-LAKI\n   Tempat Lahir: KEDIRI\n   Tanggal Lahir: 23-11-1962\n   Agama: ISLAM\n   Pendidikan: SLTA/SEDERAJAT\n   Pekerjaan: KARYAWAN SWASTA\n\n2. Nama: RINA KUSUMANINGRUM\n   NIK: 3571021108800005\n   Jenis Kelamin: PEREMPUAN\n   Tempat Lahir: KEDIRI\n   Tanggal Lahir: 01-10-1980\n   Agama: ISLAM\n   Pendidikan: SLTA/SEDERAJAT\n   Pekerjaan: KARYAWAN SWASTA\n\nSTATUS PERNIKAHAN DAN HUBUNGAN:\n1. Nama: ANDRI WIRATMONO\n   Status Pernikahan: KAWIN\n   Hubungan Dalam Keluarga: KEPALA KELUARGA\n   Kewarganegaraan: WNI\n\n2. Nama: RINA KUSUMANINGRUM\n   Status Pernikahan: KAWIN\n   Hubungan Dalam Keluarga: ISTRI\n   Kewarganegaraan: WNI\n\nORANG TUA:\n1. Nama: ANDRI WIRATMONO\n   Ayah: SURATNO\n   Ibu: SRI SUMANGE STI\n\n2. Nama: RINA KUSUMANINGRUM\n   Ayah: SUPARJAN EDI SOFYAN\n   Ibu: LILIK S.\n\nTANGGAL PENERBITAN: 18-11-2010",
              parsed: {
                status: "success",
                nomor_kk: "3571021511100006",
                kode_keluarga: "3571010965",
                kepala_keluarga: {
                  nama: "ANDRI WIRATMONO",
                  nik: "3571022311520001",
                  alamat: "JLN REJOMULYO VII / 322",
                  rt_rw: "003/006",
                  desa_kelurahan: "REJOMULYO",
                  kecamatan: "KOTA KEDIRI",
                  kabupaten_kota: "KOTA KEDIRI",
                  kode_pos: "64129",
                  provinsi: "JAWA TIMUR"
                },
                anggota_keluarga: [
                  {
                    nama: "ANDRI WIRATMONO",
                    nik: "3571022311520001",
                    jenis_kelamin: "LAKI-LAKI",
                    tempat_lahir: "KEDIRI",
                    tanggal_lahir: "23-11-1962",
                    agama: "ISLAM",
                    pendidikan: "SLTA/SEDERAJAT",
                    pekerjaan: "KARYAWAN SWASTA"
                  },
                  {
                    nama: "RINA KUSUMANINGRUM",
                    nik: "3571021108800005",
                    jenis_kelamin: "PEREMPUAN",
                    tempat_lahir: "KEDIRI",
                    tanggal_lahir: "01-10-1980",
                    agama: "ISLAM",
                    pendidikan: "SLTA/SEDERAJAT",
                    pekerjaan: "KARYAWAN SWASTA"
                  }
                ],
                status_hubungan: [
                  {
                    nama: "ANDRI WIRATMONO",
                    status_pernikahan: "KAWIN",
                    hubungan_keluarga: "KEPALA KELUARGA",
                    kewarganegaraan: "WNI"
                  },
                  {
                    nama: "RINA KUSUMANINGRUM",
                    status_pernikahan: "KAWIN",
                    hubungan_keluarga: "ISTRI",
                    kewarganegaraan: "WNI"
                  }
                ],
                orang_tua: [
                  {
                    nama: "ANDRI WIRATMONO",
                    ayah: "SURATNO",
                    ibu: "SRI SUMANGE STI"
                  },
                  {
                    nama: "RINA KUSUMANINGRUM",
                    ayah: "SUPARJAN EDI SOFYAN",
                    ibu: "LILIK S."
                  }
                ],
                tanggal_penerbitan: "18-11-2010"
              }
            }
          }
        }
      }
    }
  };

  return docs;
}

/**
 * Clean up the API response
 */
function cleanupResponse(response) {
  // Minimal cleanup to ensure response is nicely formatted
  return response.trim();
}

/**
 * Parse KK data from the Gemini API response
 */
function parseKKData(description) {
  // Initialize object to store parsed data
  const kkData = {
    nomor_kk: '',
    kode_keluarga: '',
    kepala_keluarga: {
      nama: '',
      nik: '',
      alamat: '',
      rt_rw: '',
      desa_kelurahan: '',
      kecamatan: '',
      kabupaten_kota: '',
      kode_pos: '',
      provinsi: ''
    },
    anggota_keluarga: [],
    status_hubungan: [],
    orang_tua: [],
    tanggal_penerbitan: ''
  };

  // Extract Nomor KK
  const nomorKKMatch = description.match(/NOMOR KK: (.+?)$/m);
  if (nomorKKMatch) {
    kkData.nomor_kk = nomorKKMatch[1].trim();
  }

  // Extract Kode Keluarga
  const kodeKelMatch = description.match(/KODE KELUARGA: (.+?)$/m);
  if (kodeKelMatch) {
    kkData.kode_keluarga = kodeKelMatch[1].trim();
  }

  // Extract Kepala Keluarga data
  const kepalaNamaMatch = description.match(/KEPALA KELUARGA:\s*Nama: (.+?)$/m);
  if (kepalaNamaMatch) {
    kkData.kepala_keluarga.nama = kepalaNamaMatch[1].trim();
  }

  const kepalaNikMatch = description.match(/NIK: (.+?)$/m);
  if (kepalaNikMatch) {
    kkData.kepala_keluarga.nik = kepalaNikMatch[1].trim();
  }

  const kepalaAlamatMatch = description.match(/Alamat: (.+?)$/m);
  if (kepalaAlamatMatch) {
    kkData.kepala_keluarga.alamat = kepalaAlamatMatch[1].trim();
  }

  const kepalaRTRWMatch = description.match(/RT\/RW: (.+?)$/m);
  if (kepalaRTRWMatch) {
    kkData.kepala_keluarga.rt_rw = kepalaRTRWMatch[1].trim();
  }

  const kepalaDesaMatch = description.match(/Desa\/Kelurahan: (.+?)$/m);
  if (kepalaDesaMatch) {
    kkData.kepala_keluarga.desa_kelurahan = kepalaDesaMatch[1].trim();
  }

  const kepalaKecMatch = description.match(/Kecamatan: (.+?)$/m);
  if (kepalaKecMatch) {
    kkData.kepala_keluarga.kecamatan = kepalaKecMatch[1].trim();
  }

  const kepalaKabMatch = description.match(/Kabupaten\/Kota: (.+?)$/m);
  if (kepalaKabMatch) {
    kkData.kepala_keluarga.kabupaten_kota = kepalaKabMatch[1].trim();
  }

  const kepalaPosMatch = description.match(/Kode Pos: (.+?)$/m);
  if (kepalaPosMatch) {
    kkData.kepala_keluarga.kode_pos = kepalaPosMatch[1].trim();
  }

  const kepalaProvMatch = description.match(/Provinsi: (.+?)$/m);
  if (kepalaProvMatch) {
    kkData.kepala_keluarga.provinsi = kepalaProvMatch[1].trim();
  }

  // Extract tanggal penerbitan
  const tanggalMatch = description.match(/TANGGAL PENERBITAN: (.+?)$/m);
  if (tanggalMatch) {
    kkData.tanggal_penerbitan = tanggalMatch[1].trim();
  }

  // Extract Anggota Keluarga data
  // Here we use a regex to extract all sections for each anggota keluarga
  const anggotaSection = description.match(/ANGGOTA KELUARGA:([\s\S]*?)(?=STATUS PERNIKAHAN|$)/);
  if (anggotaSection) {
    const anggotaText = anggotaSection[1];
    const anggotaEntries = anggotaText.split(/\d+\.\s+Nama:/).slice(1);
    
    anggotaEntries.forEach((entry) => {
      const anggota = {
        nama: '',
        nik: '',
        jenis_kelamin: '',
        tempat_lahir: '',
        tanggal_lahir: '',
        agama: '',
        pendidikan: '',
        pekerjaan: ''
      };

      // Extract data for each anggota
      const namaMatch = entry.match(/^(.+?)$/m);
      if (namaMatch) anggota.nama = namaMatch[1].trim();

      const nikMatch = entry.match(/NIK: (.+?)$/m);
      if (nikMatch) anggota.nik = nikMatch[1].trim();

      const jenisKelaminMatch = entry.match(/Jenis Kelamin: (.+?)$/m);
      if (jenisKelaminMatch) anggota.jenis_kelamin = jenisKelaminMatch[1].trim();

      const tempatLahirMatch = entry.match(/Tempat Lahir: (.+?)$/m);
      if (tempatLahirMatch) anggota.tempat_lahir = tempatLahirMatch[1].trim();

      const tanggalLahirMatch = entry.match(/Tanggal Lahir: (.+?)$/m);
      if (tanggalLahirMatch) anggota.tanggal_lahir = tanggalLahirMatch[1].trim();

      const agamaMatch = entry.match(/Agama: (.+?)$/m);
      if (agamaMatch) anggota.agama = agamaMatch[1].trim();

      const pendidikanMatch = entry.match(/Pendidikan: (.+?)$/m);
      if (pendidikanMatch) anggota.pendidikan = pendidikanMatch[1].trim();

      const pekerjaanMatch = entry.match(/Pekerjaan: (.+?)$/m);
      if (pekerjaanMatch) anggota.pekerjaan = pekerjaanMatch[1].trim();

      kkData.anggota_keluarga.push(anggota);
    });
  }

  // Extract status pernikahan dan hubungan
  const statusSection = description.match(/STATUS PERNIKAHAN DAN HUBUNGAN:([\s\S]*?)(?=ORANG TUA|$)/);
  if (statusSection) {
    const statusText = statusSection[1];
    const statusEntries = statusText.split(/\d+\.\s+Nama:/).slice(1);
    
    statusEntries.forEach((entry) => {
      const status = {
        nama: '',
        status_pernikahan: '',
        hubungan_keluarga: '',
        kewarganegaraan: ''
      };

      // Extract data for each status entry
      const namaMatch = entry.match(/^(.+?)$/m);
      if (namaMatch) status.nama = namaMatch[1].trim();

      const statusMatch = entry.match(/Status Pernikahan: (.+?)$/m);
      if (statusMatch) status.status_pernikahan = statusMatch[1].trim();

      const hubunganMatch = entry.match(/Hubungan Dalam Keluarga: (.+?)$/m);
      if (hubunganMatch) status.hubungan_keluarga = hubunganMatch[1].trim();

      const kewarganegaraanMatch = entry.match(/Kewarganegaraan: (.+?)$/m);
      if (kewarganegaraanMatch) status.kewarganegaraan = kewarganegaraanMatch[1].trim();

      kkData.status_hubungan.push(status);
    });
  }

  // Extract orang tua data
  const orangTuaSection = description.match(/ORANG TUA:([\s\S]*?)(?=TANGGAL PENERBITAN|$)/);
  if (orangTuaSection) {
    const orangTuaText = orangTuaSection[1];
    const orangTuaEntries = orangTuaText.split(/\d+\.\s+Nama:/).slice(1);
    
    orangTuaEntries.forEach((entry) => {
      const orangTua = {
        nama: '',
        ayah: '',
        ibu: ''
      };

      // Extract data for each orang tua entry
      const namaMatch = entry.match(/^(.+?)$/m);
      if (namaMatch) orangTua.nama = namaMatch[1].trim();

      const ayahMatch = entry.match(/Ayah: (.+?)$/m);
      if (ayahMatch) orangTua.ayah = ayahMatch[1].trim();

      const ibuMatch = entry.match(/Ibu: (.+?)$/m);
      if (ibuMatch) orangTua.ibu = ibuMatch[1].trim();

      kkData.orang_tua.push(orangTua);
    });
  }

  return kkData;
}

/**
 * Save KK data to sheet
 */
function saveKKDataToSheet(kkData, fileName) {
  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const dataSheet = spreadsheet.getSheetByName(KK_DATA_SHEET_NAME) || spreadsheet.insertSheet(KK_DATA_SHEET_NAME);
    
    // Create headers if the sheet is empty
    if (dataSheet.getLastRow() === 0) {
      dataSheet.appendRow([
        'Timestamp', 
        'File Name',
        'Nomor KK',
        'Kode Keluarga',
        'Kepala Keluarga Nama',
        'Kepala Keluarga NIK',
        'Alamat',
        'RT/RW',
        'Desa/Kelurahan',
        'Kecamatan',
        'Kabupaten/Kota',
        'Kode Pos',
        'Provinsi',
        'Jumlah Anggota',
        'Tanggal Penerbitan'
      ]);
    }
    
    // Append basic KK data
    dataSheet.appendRow([
      new Date().toISOString(),
      fileName,
      kkData.nomor_kk,
      kkData.kode_keluarga,
      kkData.kepala_keluarga.nama,
      kkData.kepala_keluarga.nik,
      kkData.kepala_keluarga.alamat,
      kkData.kepala_keluarga.rt_rw,
      kkData.kepala_keluarga.desa_kelurahan,
      kkData.kepala_keluarga.kecamatan,
      kkData.kepala_keluarga.kabupaten_kota,
      kkData.kepala_keluarga.kode_pos,
      kkData.kepala_keluarga.provinsi,
      kkData.anggota_keluarga.length,
      kkData.tanggal_penerbitan
    ]);
    
    // Create or get sheet for anggota keluarga
    const anggotaSheet = spreadsheet.getSheetByName(ANGGOTA_SHEET_NAME) || spreadsheet.insertSheet(ANGGOTA_SHEET_NAME);
    
    // Create headers if the sheet is empty
    if (anggotaSheet.getLastRow() === 0) {
      anggotaSheet.appendRow([
        'Nomor KK',
        'Nama',
        'NIK',
        'Jenis Kelamin',
        'Tempat Lahir',
        'Tanggal Lahir',
        'Agama',
        'Pendidikan',
        'Pekerjaan',
        'Status Pernikahan',
        'Hubungan Keluarga',
        'Kewarganegaraan',
        'Nama Ayah',
        'Nama Ibu'
      ]);
    }
    
    // Append anggota keluarga data
    kkData.anggota_keluarga.forEach((anggota, index) => {
      // Find corresponding status and orang tua data if available
      const statusData = kkData.status_hubungan[index] || { 
        status_pernikahan: 'N/A', 
        hubungan_keluarga: 'N/A', 
        kewarganegaraan: 'N/A' 
      };
      
      const orangTuaData = kkData.orang_tua[index] || { 
        ayah: 'N/A', 
        ibu: 'N/A' 
      };
      
      anggotaSheet.appendRow([
        kkData.nomor_kk,
        anggota.nama,
        anggota.nik,
        anggota.jenis_kelamin,
        anggota.tempat_lahir,
        anggota.tanggal_lahir,
        anggota.agama,
        anggota.pendidikan,
        anggota.pekerjaan,
        statusData.status_pernikahan,
        statusData.hubungan_keluarga,
        statusData.kewarganegaraan,
        orangTuaData.ayah,
        orangTuaData.ibu
      ]);
    });
    
    return true;
  } catch (error) {
    logAction('Data Error', `Error saving KK data: ${error.toString()}`, 'ERROR');
    return false;
  }
}

/**
 * Process the uploaded image and get description from Gemini AI
 */
function processImage(fileData, fileName, mimeType) {
  try {
    // Log the request
    logAction('Request', 'Image processing request received', 'INFO');
    
    // Save image to Drive
    const folder = DriveApp.getFolderById(FOLDER_ID);
    const blob = Utilities.newBlob(Utilities.base64Decode(fileData), mimeType, fileName);
    const file = folder.createFile(blob);
    const fileId = file.getId();
    const fileUrl = file.getUrl();
    
    logAction('File Upload', `File saved to Drive: ${fileName}, ID: ${fileId}`, 'INFO');
    
    // Create request to Gemini API
    const requestBody = {
      contents: [
        {
          parts: [
            { text: PROMPT_TEMPLATE },
            { 
              inline_data: { 
                mime_type: mimeType, 
                data: fileData
              } 
            }
          ]
        }
      ]
    };
    
    // Call Gemini API
    const rawResponse = callGeminiAPI(requestBody);
    
    // Clean up the response
    const cleanedResponse = cleanupResponse(rawResponse);
    
    // Check if the document is not a Kartu Keluarga
    if (cleanedResponse === "Dokumen ini bukan Kartu Keluarga") {
      logAction('Info', 'Document is not a Kartu Keluarga', 'INFO');
      
      // Save metadata to spreadsheet
      const metadata = {
        timestamp: new Date().toISOString(),
        fileName: fileName,
        fileId: fileId,
        fileUrl: fileUrl,
        description: cleanedResponse,
        isKK: false
      };
      
      saveMetadata(metadata);
      
      return {
        success: true,
        description: cleanedResponse,
        fileUrl: fileUrl,
        dataSaved: false
      };
    }
    
    // Parse KK data
    const kkData = parseKKData(cleanedResponse);
    
    // Save KK data to sheet
    const dataSaved = saveKKDataToSheet(kkData, fileName);
    
    // Save metadata to spreadsheet
    const metadata = {
      timestamp: new Date().toISOString(),
      fileName: fileName,
      fileId: fileId,
      fileUrl: fileUrl,
      description: rawResponse,
      isKK: true
    };
    
    saveMetadata(metadata);
    
    logAction('Success', 'Image processed successfully', 'SUCCESS');
    
    return {
      success: true,
      description: cleanedResponse,
      fileUrl: fileUrl,
      dataSaved: dataSaved
    };
  } catch (error) {
    logAction('Error', `Error processing image: ${error.toString()}`, 'ERROR');
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * Call Gemini API
 */
function callGeminiAPI(requestBody) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
  
  const options = {
    method: 'POST',
    contentType: 'application/json',
    payload: JSON.stringify(requestBody),
    muteHttpExceptions: true
  };
  
  logAction('API Call', 'Calling Gemini API', 'INFO');
  
  try {
    const response = UrlFetchApp.fetch(url, options);
    const responseCode = response.getResponseCode();
    
    if (responseCode !== 200) {
      const errorText = response.getContentText();
      logAction('API Error', `Error from Gemini API: ${errorText}`, 'ERROR');
      throw new Error(`API error: ${responseCode} - ${errorText}`);
    }
    
    const responseJson = JSON.parse(response.getContentText());
    
    if (!responseJson.candidates || responseJson.candidates.length === 0) {
      throw new Error('No response from Gemini API');
    }
    
    // Extract text from response
    const text = responseJson.candidates[0].content.parts[0].text;
    return text;
  } catch (error) {
    logAction('API Error', `Error calling Gemini API: ${error.toString()}`, 'ERROR');
    throw error;
  }
}

/**
 * Log actions to spreadsheet
 */
function logAction(action, message, level) {
  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const logSheet = spreadsheet.getSheetByName(LOG_SHEET_NAME) || spreadsheet.insertSheet(LOG_SHEET_NAME);
    
    // Create headers if the sheet is empty
    if (logSheet.getLastRow() === 0) {
      logSheet.appendRow(['Timestamp', 'Action', 'Message', 'Level']);
    }
    
    logSheet.appendRow([new Date().toISOString(), action, message, level]);
  } catch (error) {
    console.error(`Error logging to spreadsheet: ${error.toString()}`);
  }
}

/**
 * Save metadata to spreadsheet
 */
function saveMetadata(metadata) {
  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const metadataSheet = spreadsheet.getSheetByName(METADATA_SHEET_NAME) || spreadsheet.insertSheet(METADATA_SHEET_NAME);
    
    // Create headers if the sheet is empty
    if (metadataSheet.getLastRow() === 0) {
      metadataSheet.appendRow(['Timestamp', 'FileName', 'FileID', 'FileURL', 'Description', 'IsKK']);
    }
    
    metadataSheet.appendRow([
      metadata.timestamp,
      metadata.fileName,
      metadata.fileId,
      metadata.fileUrl,
      metadata.description,
      metadata.isKK ? 'Yes' : 'No'
    ]);
  } catch (error) {
    logAction('Metadata Error', `Error saving metadata: ${error.toString()}`, 'ERROR');
    throw error;
  }
}
