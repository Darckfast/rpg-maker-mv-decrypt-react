import React, { FormEvent, useState } from 'react'
import Head from 'next/head'
import {
  Button,
  Container,
  Filler,
  InputLabel,
  ProgressBar,
  ProgressStatus
} from '../styles/pages/Home'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'

const Home: React.FC = () => {
  const [system, setSystem] = useState([])
  const [files, setFiles] = useState([])
  const [progress, setProgress] = useState(0.0)
  const [progressStatus, setProgressStatus] = useState('')
  let encryptKey = ''

  function handleFiles(e: FileList): void {
    setProgress(0)
    setProgressStatus('ready')
    if (e) {
      console.log(files.length)
      const filesArray = Array.from(e)

      setFiles(filesArray.filter((file: File) => file.name.endsWith('.rpgmvp')))
      setSystem(filesArray.filter((file: File) => file.name === 'System.json'))
    }
  }

  function decryptFiles() {
    if (files.length > 0) {
      setProgress(1)
      setProgressStatus('reading')

      const blobs = []
      const lastIndex = files.length - 1
      const toIncrement = 1 + 9 / lastIndex
      const zip = new JSZip()

      files.forEach((file, index) => {
        const reader = new FileReader()
        reader.fileName = file.webkitRelativePath
        reader.last = index === lastIndex

        reader.onload = e => {
          setProgressStatus('decrypting')
          setProgress(progress + toIncrement)

          let arrayBuffer: ArrayBuffer = e.target.result as ArrayBuffer

          arrayBuffer = arrayBuffer.slice(16, arrayBuffer.byteLength)

          const view = new DataView(arrayBuffer)
          const parsedKey = encryptKey.split(/(.{2})/).filter(Boolean)
          const byteArray = new Uint8Array(arrayBuffer)

          for (let i = 0; i < 16; i++) {
            byteArray[i] = byteArray[i] ^ parseInt(parsedKey[i], 16)
            view.setUint8(i, byteArray[i])
          }

          const fileName = e.target.fileName
            .replace(/.(rpgmvp)$/, '.png')
            .replace(/.(rpgmvm)$/, '.m4a')
            .replace(/.(rpgmvo)$/, '.ogg')

          zip.file(fileName, new Blob([arrayBuffer]))
        }

        reader.readAsArrayBuffer(file)
        reader.onloadend = e => {
          setProgressStatus('zipping')

          if (e.target.last) {
            console.log('done, zipping files', blobs.length, progress)

            zip
              .generateAsync({ type: 'blob', streamFiles: true }, metadata => {
                const prog = metadata.percent - progress
                if (prog > 0) {
                  setProgress(progress + prog)
                }
              })
              .then(content => {
                saveAs(content, 'Extract.zip')
              })
              .finally(() => {
                setProgress(0)
                setProgressStatus('completed')
              })
          }
        }
      })
    }
  }

  function submitFiles(e: FormEvent): void {
    e.preventDefault()
    console.log(system, files.length)
    findEncryptionCode()
  }

  function findEncryptionCode(): void {
    const reader = new FileReader()

    reader.onload = e => {
      const content = JSON.parse(e.target.result.toString())

      for (const key in content) {
        if (Object.prototype.hasOwnProperty.call(content, key)) {
          const element = content[key]

          if (/^[a-f0-9]{32}$/i.test(element)) {
            encryptKey = element
            break
          }
        }
      }

      decryptFiles()
    }

    reader.readAsText(system[0])
  }

  return (
    <Container>
      <Head>
        <title>Create Next App</title>
      </Head>

      <main>
        <h1>RPG Maker MV decrypt</h1>

        <div>
          <form onSubmit={submitFiles}>
            <input
              style={{ display: 'none' }}
              id="fileUpload"
              type="file"
              webkitdirectory=""
              mozdirectory=""
              onChange={e => handleFiles(e.target.files)}
              accept=".json,.rpgmvp,.rpgmvm,.rpgmvo"
            />
            <InputLabel htmlFor="fileUpload">
              <span>Select www/ dir</span>
            </InputLabel>
            <Button type="submit" disabled={files.length === 0}>
              <span>Decrypt</span>
            </Button>

            <div>files found: {files.length}</div>
            <ProgressBar>
              <Filler style={{ width: `${progress}%` }}>
                <ProgressStatus>{progressStatus}</ProgressStatus>
              </Filler>
            </ProgressBar>
          </form>
        </div>
      </main>
    </Container>
  )
}

export default Home
