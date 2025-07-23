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
 * Return API documentation in JSON format with dummy data
 */
function getApiDocumentation() {
  const docs = {
    api_name: "API Ekstraksi Data KK",
    version: "1.0.0",
    description: "API untuk menganalisis dan mengekstrak data dari Kartu Keluarga (KK) Indonesia menggunakan Gemini AI",
    base_url: "https://script.google.com/macros/s/AKfycbxxxxxxxxxxxxxxxxxxxxxxx/exec",
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
      "process-kk-keluarga-besar": {
        request: {
          method: "POST",
          url: "https://script.google.com/macros/s/AKfycbxxxxxxxxxxxxxxxxxxxxxxx/exec",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded"
          },
          body: "action=process-kk&fileData=base64_encoded_kk_image&fileName=kk_keluarga_besar.jpg&mimeType=image/jpeg"
        },
        response: {
          status: "success",
          code: 200,
          data: {
            original: {
              fileUrl: "https://drive.google.com/file/d/1ABCdef123456789/view",
              fileName: "kk_keluarga_besar.jpg",
              mimeType: "image/jpeg"
            },
            analysis: {
              raw: "NOMOR KK: 3273051708150002\nKODE KELUARGA: 3273050892\n\nKEPALA KELUARGA:\nNama: BUDI SANTOSO\nNIK: 3273051708740001\nAlamat: JL. MERDEKA TIMUR NO. 45\nRT/RW: 007/003\nDesa/Kelurahan: CIPINANG\nKecamatan: PULOGADUNG\nKabupaten/Kota: JAKARTA TIMUR\nKode Pos: 13240\nProvinsi: DKI JAKARTA\n\nANGGOTA KELUARGA:\n1. Nama: BUDI SANTOSO\n   NIK: 3273051708740001\n   Jenis Kelamin: LAKI-LAKI\n   Tempat Lahir: JAKARTA\n   Tanggal Lahir: 17-08-1974\n   Agama: ISLAM\n   Pendidikan: S1\n   Pekerjaan: PEGAWAI NEGERI SIPIL\n\n2. Nama: SITI AMINAH\n   NIK: 3273054502780002\n   Jenis Kelamin: PEREMPUAN\n   Tempat Lahir: BANDUNG\n   Tanggal Lahir: 05-02-1978\n   Agama: ISLAM\n   Pendidikan: D3\n   Pekerjaan: GURU\n\n3. Nama: AHMAD RIZKI SANTOSO\n   NIK: 3273052801020001\n   Jenis Kelamin: LAKI-LAKI\n   Tempat Lahir: JAKARTA\n   Tanggal Lahir: 28-01-2002\n   Agama: ISLAM\n   Pendidikan: SMA/SEDERAJAT\n   Pekerjaan: PELAJAR/MAHASISWA\n\n4. Nama: PUTRI AYU SANTOSO\n   NIK: 3273051506050001\n   Jenis Kelamin: PEREMPUAN\n   Tempat Lahir: JAKARTA\n   Tanggal Lahir: 15-06-2005\n   Agama: ISLAM\n   Pendidikan: SMP/SEDERAJAT\n   Pekerjaan: PELAJAR/MAHASISWA\n\n5. Nama: MUHAMMAD FAJAR SANTOSO\n   NIK: 3273052209080001\n   Jenis Kelamin: LAKI-LAKI\n   Tempat Lahir: JAKARTA\n   Tanggal Lahir: 22-09-2008\n   Agama: ISLAM\n   Pendidikan: SD/SEDERAJAT\n   Pekerjaan: PELAJAR/MAHASISWA\n\nSTATUS PERNIKAHAN DAN HUBUNGAN:\n1. Nama: BUDI SANTOSO\n   Status Pernikahan: KAWIN\n   Hubungan Dalam Keluarga: KEPALA KELUARGA\n   Kewarganegaraan: WNI\n\n2. Nama: SITI AMINAH\n   Status Pernikahan: KAWIN\n   Hubungan Dalam Keluarga: ISTRI\n   Kewarganegaraan: WNI\n\n3. Nama: AHMAD RIZKI SANTOSO\n   Status Pernikahan: BELUM KAWIN\n   Hubungan Dalam Keluarga: ANAK\n   Kewarganegaraan: WNI\n\n4. Nama: PUTRI AYU SANTOSO\n   Status Pernikahan: BELUM KAWIN\n   Hubungan Dalam Keluarga: ANAK\n   Kewarganegaraan: WNI\n\n5. Nama: MUHAMMAD FAJAR SANTOSO\n   Status Pernikahan: BELUM KAWIN\n   Hubungan Dalam Keluarga: ANAK\n   Kewarganegaraan: WNI\n\nORANG TUA:\n1. Nama: BUDI SANTOSO\n   Ayah: SUTRISNO\n   Ibu: SARI WULANDARI\n\n2. Nama: SITI AMINAH\n   Ayah: AHMAD YUSUF\n   Ibu: FATIMAH\n\n3. Nama: AHMAD RIZKI SANTOSO\n   Ayah: BUDI SANTOSO\n   Ibu: SITI AMINAH\n\n4. Nama: PUTRI AYU SANTOSO\n   Ayah: BUDI SANTOSO\n   Ibu: SITI AMINAH\n\n5. Nama: MUHAMMAD FAJAR SANTOSO\n   Ayah: BUDI SANTOSO\n   Ibu: SITI AMINAH\n\nTANGGAL PENERBITAN: 15-03-2020",
              parsed: {
                status: "success",
                nomor_kk: "3273051708150002",
                kode_keluarga: "3273050892",
                kepala_keluarga: {
                  nama: "BUDI SANTOSO",
                  nik: "3273051708740001",
                  alamat: "JL. MERDEKA TIMUR NO. 45",
                  rt_rw: "007/003",
                  desa_kelurahan: "CIPINANG",
                  kecamatan: "PULOGADUNG",
                  kabupaten_kota: "JAKARTA TIMUR",
                  kode_pos: "13240",
                  provinsi: "DKI JAKARTA"
                },
                anggota_keluarga: [
                  {
                    nama: "BUDI SANTOSO",
                    nik: "3273051708740001",
                    jenis_kelamin: "LAKI-LAKI",
                    tempat_lahir: "JAKARTA",
                    tanggal_lahir: "17-08-1974",
                    agama: "ISLAM",
                    pendidikan: "S1",
                    pekerjaan: "PEGAWAI NEGERI SIPIL"
                  },
                  {
                    nama: "SITI AMINAH",
                    nik: "3273054502780002",
                    jenis_kelamin: "PEREMPUAN",
                    tempat_lahir: "BANDUNG",
                    tanggal_lahir: "05-02-1978",
                    agama: "ISLAM",
                    pendidikan: "D3",
                    pekerjaan: "GURU"
                  },
                  {
                    nama: "AHMAD RIZKI SANTOSO",
                    nik: "3273052801020001",
                    jenis_kelamin: "LAKI-LAKI",
                    tempat_lahir: "JAKARTA",
                    tanggal_lahir: "28-01-2002",
                    agama: "ISLAM",
                    pendidikan: "SMA/SEDERAJAT",
                    pekerjaan: "PELAJAR/MAHASISWA"
                  },
                  {
                    nama: "PUTRI AYU SANTOSO",
                    nik: "3273051506050001",
                    jenis_kelamin: "PEREMPUAN",
                    tempat_lahir: "JAKARTA",
                    tanggal_lahir: "15-06-2005",
                    agama: "ISLAM",
                    pendidikan: "SMP/SEDERAJAT",
                    pekerjaan: "PELAJAR/MAHASISWA"
                  },
                  {
                    nama: "MUHAMMAD FAJAR SANTOSO",
                    nik: "3273052209080001",
                    jenis_kelamin: "LAKI-LAKI",
                    tempat_lahir: "JAKARTA",
                    tanggal_lahir: "22-09-2008",
                    agama: "ISLAM",
                    pendidikan: "SD/SEDERAJAT",
                    pekerjaan: "PELAJAR/MAHASISWA"
                  }
                ],
                status_hubungan: [
                  {
                    nama: "BUDI SANTOSO",
                    status_pernikahan: "KAWIN",
                    hubungan_keluarga: "KEPALA KELUARGA",
                    kewarganegaraan: "WNI"
                  },
                  {
                    nama: "SITI AMINAH",
                    status_pernikahan: "KAWIN",
                    hubungan_keluarga: "ISTRI",
                    kewarganegaraan: "WNI"
                  },
                  {
                    nama: "AHMAD RIZKI SANTOSO",
                    status_pernikahan: "BELUM KAWIN",
                    hubungan_keluarga: "ANAK",
                    kewarganegaraan: "WNI"
                  },
                  {
                    nama: "PUTRI AYU SANTOSO",
                    status_pernikahan: "BELUM KAWIN",
                    hubungan_keluarga: "ANAK",
                    kewarganegaraan: "WNI"
                  },
                  {
                    nama: "MUHAMMAD FAJAR SANTOSO",
                    status_pernikahan: "BELUM KAWIN",
                    hubungan_keluarga: "ANAK",
                    kewarganegaraan: "WNI"
                  }
                ],
                orang_tua: [
                  {
                    nama: "BUDI SANTOSO",
                    ayah: "SUTRISNO",
                    ibu: "SARI WULANDARI"
                  },
                  {
                    nama: "SITI AMINAH",
                    ayah: "AHMAD YUSUF",
                    ibu: "FATIMAH"
                  },
                  {
                    nama: "AHMAD RIZKI SANTOSO",
                    ayah: "BUDI SANTOSO",
                    ibu: "SITI AMINAH"
                  },
                  {
                    nama: "PUTRI AYU SANTOSO",
                    ayah: "BUDI SANTOSO",
                    ibu: "SITI AMINAH"
                  },
                  {
                    nama: "MUHAMMAD FAJAR SANTOSO",
                    ayah: "BUDI SANTOSO",
                    ibu: "SITI AMINAH"
                  }
                ],
                tanggal_penerbitan: "15-03-2020"
              }
            }
          }
        }
      },
      "process-kk-keluarga-kecil": {
        request: {
          method: "POST",
          url: "https://script.google.com/macros/s/AKfycbxxxxxxxxxxxxxxxxxxxxxxx/exec",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            action: "process-kk",
            fileData: "base64_encoded_kk_image_data_here",
            fileName: "kk_keluarga_kecil.png",
            mimeType: "image/png"
          })
        },
        response: {
          status: "success",
          code: 200,
          data: {
            original: {
              fileUrl: "https://drive.google.com/file/d/1XYZabc987654321/view",
              fileName: "kk_keluarga_kecil.png",
              mimeType: "image/png"
            },
            analysis: {
              raw: "NOMOR KK: 6471011234560001\nKODE KELUARGA: 6471015678\n\nKEPALA KELUARGA:\nNama: DEWI SARTIKA\nNIK: 6471012506850003\nAlamat: JL. FLAMBOYAN RAYA NO. 12\nRT/RW: 002/001\nDesa/Kelurahan: SAMARINDA KOTA\nKecamatan: SAMARINDA KOTA\nKabupaten/Kota: SAMARINDA\nKode Pos: 75242\nProvinsi: KALIMANTAN TIMUR\n\nANGGOTA KELUARGA:\n1. Nama: DEWI SARTIKA\n   NIK: 6471012506850003\n   Jenis Kelamin: PEREMPUAN\n   Tempat Lahir: SAMARINDA\n   Tanggal Lahir: 25-06-1985\n   Agama: KRISTEN\n   Pendidikan: S2\n   Pekerjaan: DOSEN\n\n2. Nama: SARAH AMANDA PUTRI\n   NIK: 6471013008120001\n   Jenis Kelamin: PEREMPUAN\n   Tempat Lahir: SAMARINDA\n   Tanggal Lahir: 30-08-2012\n   Agama: KRISTEN\n   Pendidikan: SD/SEDERAJAT\n   Pekerjaan: PELAJAR/MAHASISWA\n\nSTATUS PERNIKAHAN DAN HUBUNGAN:\n1. Nama: DEWI SARTIKA\n   Status Pernikahan: CERAI HIDUP\n   Hubungan Dalam Keluarga: KEPALA KELUARGA\n   Kewarganegaraan: WNI\n\n2. Nama: SARAH AMANDA PUTRI\n   Status Pernikahan: BELUM KAWIN\n   Hubungan Dalam Keluarga: ANAK\n   Kewarganegaraan: WNI\n\nORANG TUA:\n1. Nama: DEWI SARTIKA\n   Ayah: HERMAN SARTIKA\n   Ibu: MARIA ELISABETH\n\n2. Nama: SARAH AMANDA PUTRI\n   Ayah: RICHARD MAHENDRA\n   Ibu: DEWI SARTIKA\n\nTANGGAL PENERBITAN: 08-07-2022",
              parsed: {
                status: "success",
                nomor_kk: "6471011234560001",
                kode_keluarga: "6471015678",
                kepala_keluarga: {
                  nama: "DEWI SARTIKA",
                  nik: "6471012506850003",
                  alamat: "JL. FLAMBOYAN RAYA NO. 12",
                  rt_rw: "002/001",
                  desa_kelurahan: "SAMARINDA KOTA",
                  kecamatan: "SAMARINDA KOTA",
                  kabupaten_kota: "SAMARINDA",
                  kode_pos: "75242",
                  provinsi: "KALIMANTAN TIMUR"
                },
                anggota_keluarga: [
                  {
                    nama: "DEWI SARTIKA",
                    nik: "6471012506850003",
                    jenis_kelamin: "PEREMPUAN",
                    tempat_lahir: "SAMARINDA",
                    tanggal_lahir: "25-06-1985",
                    agama: "KRISTEN",
                    pendidikan: "S2",
                    pekerjaan: "DOSEN"
                  },
                  {
                    nama: "SARAH AMANDA PUTRI",
                    nik: "6471013008120001",
                    jenis_kelamin: "PEREMPUAN",
                    tempat_lahir: "SAMARINDA",
                    tanggal_lahir: "30-08-2012",
                    agama: "KRISTEN",
                    pendidikan: "SD/SEDERAJAT",
                    pekerjaan: "PELAJAR/MAHASISWA"
                  }
                ],
                status_hubungan: [
                  {
                    nama: "DEWI SARTIKA",
                    status_pernikahan: "CERAI HIDUP",
                    hubungan_keluarga: "KEPALA KELUARGA",
                    kewarganegaraan: "WNI"
                  },
                  {
                    nama: "SARAH AMANDA PUTRI",
                    status_pernikahan: "BELUM KAWIN",
                    hubungan_keluarga: "ANAK",
                    kewarganegaraan: "WNI"
                  }
                ],
                orang_tua: [
                  {
                    nama: "DEWI SARTIKA",
                    ayah: "HERMAN SARTIKA",
                    ibu: "MARIA ELISABETH"
                  },
                  {
                    nama: "SARAH AMANDA PUTRI",
                    ayah: "RICHARD MAHENDRA",
                    ibu: "DEWI SARTIKA"
                  }
                ],
                tanggal_penerbitan: "08-07-2022"
              }
            }
          }
        }
      },
      "process-kk-error-not-kk": {
        request: {
          method: "POST",
          url: "https://script.google.com/macros/s/AKfycbxxxxxxxxxxxxxxxxxxxxxxx/exec",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded"
          },
          body: "action=process-kk&fileData=base64_encoded_random_image&fileName=landscape.jpg&mimeType=image/jpeg"
        },
        response: {
          status: "success",
          code: 200,
          data: {
            original: {
              fileUrl: "https://drive.google.com/file/d/1QWErty456789012/view",
              fileName: "landscape.jpg",
              mimeType: "image/jpeg"
            },
            analysis: {
              raw: "Gambar ini tampaknya bukan Kartu Keluarga. Gambar menunjukkan pemandangan alam dengan pepohonan dan langit biru. Tidak ditemukan format atau struktur yang sesuai dengan Kartu Keluarga Indonesia.",
              parsed: {
                status: "not_kk",
                message: "Gambar yang diupload bukan Kartu Keluarga"
              }
            }
          }
        }
      },
      "error-bad-request": {
        request: {
          method: "POST",
          url: "https://script.google.com/macros/s/AKfycbxxxxxxxxxxxxxxxxxxxxxxx/exec",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded"
          },
          body: "action=process-kk&fileName=test.jpg"
        },
        response: {
          status: "error",
          code: 400,
          message: "Parameter fileData is required"
        }
      },
      "get-docs": {
        request: {
          method: "POST",
          url: "https://script.google.com/macros/s/AKfycbxxxxxxxxxxxxxxxxxxxxxxx/exec",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded"
          },
          body: "action=docs"
        },
        response: docs
      }
    },
    notes: {
      base64_encoding: "Untuk mengkonversi gambar menjadi base64, Anda dapat menggunakan berbagai tools online atau programming libraries",
      supported_formats: ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/bmp"],
      max_file_size: "10MB per file",
      rate_limit: "100 requests per hour per IP",
      data_retention: "File disimpan di Google Drive untuk 30 hari kemudian dihapus otomatis"
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
