import { useEffect, useMemo, useRef, useState } from 'react'

const REGION_RULES = [
  {
    id: 'bandung-kota',
    title: 'Kota Bandung',
    leadLetters: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'R'],
    samsat: 'P3DW Kota Bandung',
    offices: 'Samsat Kota Bandung I Pajajaran / Kota Bandung II Kawaluyaan',
    address: 'Layanan resmi Bapenda Jawa Barat',
  },
  {
    id: 'cimahi',
    title: 'Kota Cimahi',
    leadLetters: ['S', 'T'],
    samsat: 'P3DW Kota Cimahi',
    offices: 'Samsat Induk Kota Cimahi',
    address: 'Jl. Jend. H. Amir Machmud No. 331A, Cimahi',
  },
  {
    id: 'bandung-barat',
    title: 'Kabupaten Bandung Barat',
    leadLetters: ['U', 'X', 'Z'],
    samsat: 'P3DW Kabupaten Bandung Barat',
    offices: 'Samsat Induk Kabupaten Bandung Barat',
    address: 'Jl. Raya Gadobangkong No. 203, Ngamprah',
  },
  {
    id: 'bandung-kabupaten',
    title: 'Kabupaten Bandung',
    leadLetters: ['V', 'W', 'Y'],
    samsat: 'P3DW Kabupaten Bandung',
    offices: 'Samsat Soreang / Samsat Rancaekek',
    address: 'Unit penerbit tidak dapat dipastikan dari plat saja',
  },
]

const PLATE_COLORS = {
  unknown: { title: 'Belum diketahui', description: 'Warna dasar TNKB diperlukan untuk menyimpulkan peruntukan.' },
  black: { title: 'Perseorangan / badan hukum', description: 'TNKB dasar hitam menunjukkan kendaraan perseorangan atau badan hukum.' },
  yellow: { title: 'Angkutan umum', description: 'TNKB dasar kuning menunjukkan kendaraan umum.' },
  red: { title: 'Instansi pemerintah', description: 'TNKB dasar merah menunjukkan kendaraan instansi pemerintah.' },
  white: { title: 'Kendaraan baru / uji coba', description: 'TNKB dasar putih adalah nomor sementara untuk kendaraan baru atau uji coba tertentu.' },
  green: { title: 'Kawasan perdagangan bebas', description: 'TNKB dasar hijau dipakai untuk kendaraan di kawasan perdagangan bebas tertentu.' },
}

function parsePlate(input) {
  const cleaned = input.trim().toUpperCase().replace(/\s+/g, ' ')
  const compact = cleaned.replace(/\s/g, '')
  const match = compact.match(/^([A-Z]{1,2})(\d{1,4})([A-Z]{0,3})$/)

  if (!match) {
    return { error: 'Masukkan format seperti D 5002 FA. Nomor terdiri dari kode wilayah, 1–4 angka, dan seri huruf.' }
  }

  const [, prefix, numberText, suffix = ''] = match
  return {
    prefix,
    number: Number(numberText),
    numberText,
    suffix,
    formatted: [prefix, numberText, suffix].filter(Boolean).join(' '),
  }
}

function getVehicleClass(number) {
  if (number >= 1 && number <= 1999) return { label: 'Mobil penumpang', detail: 'Rentang nomor 1–1999' }
  if (number >= 2000 && number <= 6999) return { label: 'Sepeda motor', detail: 'Rentang nomor 2000–6999' }
  if (number >= 7000 && number <= 7999) return { label: 'Mobil bus', detail: 'Rentang nomor 7000–7999' }
  if (number >= 8000 && number <= 8999) return { label: 'Mobil barang', detail: 'Rentang nomor 8000–8999' }
  if (number >= 9000 && number <= 9999) return { label: 'Kendaraan khusus', detail: 'Rentang nomor 9000–9999' }
  return { label: 'Belum terklasifikasi', detail: 'Nomor di luar rentang standar' }
}

function decodePlate(parsed, plateColor) {
  const suffixLead = parsed.suffix.charAt(0)
  const region = REGION_RULES.find((item) => item.leadLetters.includes(suffixLead))
  const vehicle = getVehicleClass(parsed.number)

  if (parsed.prefix !== 'D') {
    return {
      kind: 'outside',
      plate: parsed.formatted,
      vehicle,
      suffixLead,
      message: 'Saat ini decoder ini difokuskan untuk kode D (Bandung Raya). Kode ' + parsed.prefix + ' berada di luar cakupan data lokal.',
    }
  }

  if (!parsed.suffix) {
    return {
      kind: 'partial',
      plate: parsed.formatted,
      vehicle,
      suffixLead,
      message: 'Tambahkan seri huruf belakang agar wilayah administrasi dapat dipetakan.',
    }
  }

  if (!region) {
    return {
      kind: 'unknown',
      plate: parsed.formatted,
      vehicle,
      suffixLead,
      message: 'Seri awal ' + suffixLead + ' belum ada dalam peta Bandung Raya. Periksa kembali karakter pada plat.',
    }
  }

  return {
    kind: 'success',
    plate: parsed.formatted,
    region,
    vehicle,
    suffixLead,
    color: PLATE_COLORS[plateColor],
  }
}

function SourceLink({ children, href }) {
  return <a className="text-link" href={href} target="_blank" rel="noreferrer">{children} <span aria-hidden="true">↗</span></a>
}

function ResultCard({ result, onCopy }) {
  if (!result) return null

  if (result.kind !== 'success') {
    return (
      <section className="result-card muted-result" aria-live="polite">
        <div className="result-symbol" aria-hidden="true">i</div>
        <div>
          <p className="eyebrow">HASIL PEMBACAAN</p>
          <h2>{result.plate}</h2>
          <p>{result.message}</p>
          <div className="chip-row">
            <span className="chip">{result.vehicle.label}</span>
            <span className="chip chip-soft">{result.vehicle.detail}</span>
          </div>
        </div>
      </section>
    )
  }

  const { region, vehicle, color } = result
  return (
    <section className="result-card" aria-live="polite">
      <div className="result-topline">
        <div>
          <p className="eyebrow">HASIL DETEKSI LOKAL</p>
          <h2>{result.plate}</h2>
        </div>
        <button className="icon-button" type="button" onClick={() => onCopy(result)} aria-label="Salin ringkasan hasil">⧉</button>
      </div>

      <div className="location-block">
        <div className="location-icon" aria-hidden="true">⌖</div>
        <div>
          <p className="result-label">Wilayah registrasi</p>
          <h3>{region.title}</h3>
          <p>Ditentukan dari seri huruf pertama <strong>{result.suffixLead}</strong> pada bagian belakang plat.</p>
        </div>
      </div>

      <div className="fact-grid">
        <article className="fact">
          <span className="fact-icon" aria-hidden="true">▣</span>
          <p>Jenis kendaraan</p>
          <strong>{vehicle.label}</strong>
          <small>{vehicle.detail}</small>
        </article>
        <article className="fact">
          <span className="fact-icon" aria-hidden="true">◒</span>
          <p>Peruntukan TNKB</p>
          <strong>{color.title}</strong>
          <small>{color.description}</small>
        </article>
      </div>

      <div className="samsat-box">
        <div>
          <p className="result-label">Samsat / P3DW terkait</p>
          <h3>{region.samsat}</h3>
          <p>{region.offices}</p>
          <small>{region.address}</small>
        </div>
        <a className="button button-quiet" href="https://bapenda.jabarprov.go.id/" target="_blank" rel="noreferrer">Buka layanan resmi <span aria-hidden="true">↗</span></a>
      </div>

      <p className="result-note">Kantor penerbit spesifik, data pajak, merek, warna, nomor rangka, serta identitas pemilik tidak dapat dipastikan hanya dari nomor plat. Gunakan kanal resmi untuk verifikasi.</p>
    </section>
  )
}

function App() {
  const [input, setInput] = useState('D 5002 FA')
  const [plateColor, setPlateColor] = useState('unknown')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [history, setHistory] = useState([])
  const [copied, setCopied] = useState(false)
  const [dark, setDark] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('plat-d-history') || '[]')
      setHistory(Array.isArray(stored) ? stored.slice(0, 5) : [])
    } catch {
      setHistory([])
    }
  }, [])

  const normalizedPreview = useMemo(() => input.toUpperCase().replace(/\s+/g, ' ').trim(), [input])

  function remember(plate) {
    const next = [plate, ...history.filter((item) => item !== plate)].slice(0, 5)
    setHistory(next)
    localStorage.setItem('plat-d-history', JSON.stringify(next))
  }

  function search(value = input) {
    const parsed = parsePlate(value)
    if (parsed.error) {
      setError(parsed.error)
      setResult(null)
      return
    }

    setError('')
    const next = decodePlate(parsed, plateColor)
    setResult(next)
    remember(next.plate)
  }

  function chooseHistory(plate) {
    setInput(plate)
    requestAnimationFrame(() => search(plate))
  }

  async function copySummary(current) {
    if (!current) return
    const text = current.kind === 'success'
      ? current.plate + ' — ' + current.region.title + '; ' + current.vehicle.label + '; ' + current.region.samsat + '.'
      : current.plate + ' — ' + current.message

    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }

  function clearHistory() {
    setHistory([])
    localStorage.removeItem('plat-d-history')
  }

  return (
    <main className={dark ? 'app dark' : 'app'}>
      <div className="glow glow-one" />
      <div className="glow glow-two" />

      <header className="site-header container">
        <a className="brand" href="#top" aria-label="Plat D Bandung Raya">
          <span className="brand-mark">D</span>
          <span><b>Plat</b> Bandung Raya</span>
        </a>
        <nav aria-label="Navigasi utama">
          <a href="#cara-kerja">Cara kerja</a>
          <a href="#batasan">Akurasi & batasan</a>
          <button className="theme-toggle" type="button" onClick={() => setDark(!dark)} aria-label="Ubah tema">
            {dark ? '☀' : '◐'}
          </button>
        </nav>
      </header>

      <section className="hero container" id="top">
        <div className="hero-copy">
          <p className="kicker"><span aria-hidden="true">✦</span> DECODER PLAT D · BANDUNG RAYA</p>
          <h1>Pahami asal registrasi kendaraan, <em>lebih cepat.</em></h1>
          <p className="hero-description">Masukkan nomor plat untuk melihat wilayah registrasi, P3DW/Samsat terkait, dan klasifikasi kendaraan berdasarkan aturan penomoran.</p>
          <div className="coverage-tags" aria-label="Wilayah cakupan">
            <span>Bandung</span><span>Cimahi</span><span>Kab. Bandung</span><span>KBB</span>
          </div>
        </div>

        <div className="search-panel">
          <div className="search-heading">
            <div>
              <p className="eyebrow">CEK PLAT SEKARANG</p>
              <h2>Temukan wilayah asal</h2>
            </div>
            <span className="secure-badge">Data lokal</span>
          </div>

          <form onSubmit={(event) => { event.preventDefault(); search() }}>
            <label htmlFor="plate">Nomor plat kendaraan</label>
            <div className={error ? 'plate-input invalid' : 'plate-input'}>
              <span className="plate-prefix">D</span>
              <input
                ref={inputRef}
                id="plate"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="5002 FA"
                autoCapitalize="characters"
                autoComplete="off"
                spellCheck="false"
                aria-describedby={error ? 'plate-error' : 'plate-help'}
              />
            </div>
            <p className="input-help" id={error ? 'plate-error' : 'plate-help'}>{error || (normalizedPreview ? 'Format terbaca: ' + normalizedPreview : 'Contoh: D 5002 FA')}</p>

            <label htmlFor="plate-color">Warna dasar TNKB <span>opsional</span></label>
            <select id="plate-color" value={plateColor} onChange={(event) => setPlateColor(event.target.value)}>
              <option value="unknown">Tidak diketahui</option>
              <option value="black">Hitam</option>
              <option value="yellow">Kuning</option>
              <option value="red">Merah</option>
              <option value="white">Putih</option>
              <option value="green">Hijau</option>
            </select>

            <button className="button button-primary" type="submit">Deteksi plat <span aria-hidden="true">→</span></button>
          </form>

          <p className="privacy-note"><span aria-hidden="true">⌁</span> Tidak menyimpan nomor plat ke server.</p>
        </div>
      </section>

      <section className="content container" aria-label="Hasil dan riwayat">
        <div className="results-column">
          {result ? <ResultCard result={result} onCopy={copySummary} /> : (
            <div className="empty-state">
              <div aria-hidden="true">⌁</div>
              <h2>Belum ada hasil</h2>
              <p>Masukkan plat nomor di atas untuk memulai deteksi.</p>
            </div>
          )}

          {copied && <div className="toast" role="status">Ringkasan berhasil disalin</div>}
        </div>

        <aside className="side-column">
          <section className="side-card">
            <div className="side-title">
              <h2>Riwayat terbaru</h2>
              {history.length > 0 && <button type="button" onClick={clearHistory}>Bersihkan</button>}
            </div>
            {history.length > 0 ? (
              <ul className="history-list">
                {history.map((item) => <li key={item}><button type="button" onClick={() => chooseHistory(item)}><span className="mini-plate">{item}</span><span aria-hidden="true">↗</span></button></li>)}
              </ul>
            ) : <p className="side-empty">Pencarian Anda akan muncul di perangkat ini.</p>}
          </section>

          <section className="side-card official-card">
            <span className="official-icon" aria-hidden="true">✓</span>
            <p className="eyebrow">VERIFIKASI RESMI</p>
            <h2>Butuh informasi pajak?</h2>
            <p>Gunakan kanal Samsat Information Center Jawa Barat. Verifikasi resmi membutuhkan data tambahan.</p>
            <SourceLink href="https://bapenda.jabarprov.go.id/2025/01/10/cara-praktis-mengecek-nominal-pajak-kendaraan-di-jawa-barat-melalui-whatsapp/">Panduan Bapenda Jabar</SourceLink>
          </section>
        </aside>
      </section>

      <section className="how container" id="cara-kerja">
        <div className="section-intro">
          <p className="kicker"><span aria-hidden="true">✦</span> CARA KERJA</p>
          <h2>Dibaca dari struktur resmi NRKB.</h2>
          <p>Plat dibaca sebagai kode wilayah, nomor urut, lalu seri huruf. Kami menampilkan kesimpulan pada tingkat kepastian yang benar-benar didukung oleh input.</p>
        </div>
        <div className="steps">
          <article><span>01</span><h3>Kode D</h3><p>Menandai cakupan Bandung Raya: Kota Bandung, Kota Cimahi, Kabupaten Bandung, dan Bandung Barat.</p></article>
          <article><span>02</span><h3>Angka registrasi</h3><p>Rentang angka menjadi indikator golongan jenis kendaraan menurut pengaturan NRKB.</p></article>
          <article><span>03</span><h3>Seri huruf</h3><p>Huruf pertama setelah angka memetakan wilayah administrasi dalam cakupan kode D.</p></article>
        </div>
      </section>

      <section className="disclaimer container" id="batasan">
        <div className="disclaimer-mark" aria-hidden="true">!</div>
        <div>
          <p className="eyebrow">AKURASI & PRIVASI</p>
          <h2>Jujur tentang apa yang bisa dan tidak bisa dibaca dari plat.</h2>
          <p>Nomor plat tidak membuka data pribadi. Situs ini tidak menebak nama pemilik, alamat, merek, pajak, status blokir, atau nomor rangka. Klasifikasi kendaraan berbasis rentang nomor adalah indikator pengalokasian NRKB, bukan pengganti data STNK.</p>
          <div className="source-list">
            <SourceLink href="https://korlantas.polri.go.id/wp-content/uploads/2021/05/PERATURAN-POLRI-NOMOR-7-TAHUN-2021-TENTANG-REGISTRASI-DAN-IDENTIFIKASI-KENDARAAN-BERMOTOR.pdf">Perpol 7/2021 · Struktur NRKB</SourceLink>
            <SourceLink href="https://bapenda.jabarprov.go.id/profile-sim-c/">Bapenda Jabar · Samsat Information Center</SourceLink>
            <SourceLink href="https://bapenda.jabarprov.go.id/samsat/kab-bandung-barat/informasi">Bapenda Jabar · Samsat Bandung Barat</SourceLink>
          </div>
        </div>
      </section>

      <footer className="footer container">
        <p>Plat D · Bandung Raya <span>—</span> Informasi publik berbasis kode registrasi.</p>
        <p>© {new Date().getFullYear()} · Dibuat untuk akses informasi yang bertanggung jawab.</p>
      </footer>
    </main>
  )
}

export default App
