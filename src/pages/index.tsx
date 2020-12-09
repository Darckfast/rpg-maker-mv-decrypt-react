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
import CheckBox from '../components/Checkbox'

interface File1 extends File {
  webkitRelativePath?: string
}

const Home: React.FC = () => {
  const [system, setSystem] = useState([])
  const [files, setFiles] = useState([])
  const [filesDecrypted, setFilesDecrypted] = useState(0)
  const [progress, setProgress] = useState(0)
  const [removePath, setRemovePath] = useState(false)
  const [includeAudio, setIncludeAudio] = useState(true)
  const [includeVideo, setIncludeVideo] = useState(true)
  const [includeImage, setIncludeImage] = useState(true)
  const [progressStatus, setProgressStatus] = useState('')
  let encryptKey = ''

  function handleFiles(e: FileList): void {
    console.log(removePath, includeAudio, includeImage, includeVideo)
    setProgress(0)
    setProgressStatus('ready')
    if (e) {
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
      const toIncrement = 2 + 10 / lastIndex
      const zip = new JSZip()
      let totalDecrypted = 0

      files.forEach((file: File1, index) => {
        if (
          (file.webkitRelativePath.endsWith('rpgmvp') && !includeImage) ||
          (file.webkitRelativePath.endsWith('rpgmvm') && !includeAudio) ||
          (file.webkitRelativePath.endsWith('rpgmvo') && !includeVideo)
        ) {
          return
        }

        const reader = new FileReader()

        reader.onload = e => {
          let fileName: string = file.webkitRelativePath
            .replace(/.(rpgmvp)$/, '.png')
            .replace(/.(rpgmvm)$/, '.m4a')
            .replace(/.(rpgmvo)$/, '.ogg')

          if (removePath) {
            fileName = fileName.split('/')[fileName.split('/').length - 1]
          }

          let arrayBuffer: ArrayBuffer = e.target.result as ArrayBuffer

          arrayBuffer = arrayBuffer.slice(16, arrayBuffer.byteLength)

          const view = new DataView(arrayBuffer)
          const parsedKey = encryptKey.split(/(.{2})/).filter(Boolean)
          const byteArray = new Uint8Array(arrayBuffer)

          for (let i = 0; i < 16; i++) {
            byteArray[i] = byteArray[i] ^ parseInt(parsedKey[i], 16)
            view.setUint8(i, byteArray[i])
          }

          zip.file(fileName, new Blob([arrayBuffer]))

          setFilesDecrypted(++totalDecrypted)
          setProgressStatus('decrypting')

          if (index === lastIndex) {
            setProgressStatus('zipping')

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

        reader.onprogress = () => {
          setProgress(progress + toIncrement)
        }

        reader.readAsArrayBuffer(file)
      })
    }
  }

  function submitFiles(e: FormEvent): void {
    e.preventDefault()
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
        <title>RPG MV decrypt</title>
      </Head>

      <main>
        <h1>RPG Maker MV decrypt</h1>

        <div>
          <form onSubmit={submitFiles}>
            <input
              style={{ display: 'none' }}
              id="fileUpload"
              type="file"
              {...{ webkitdirectory: '', mozdirectory: '', directory: '' }}
              onChange={e => handleFiles(e.target.files)}
              accept=".json,.rpgmvp,.rpgmvm,.rpgmvo"
            />
            <InputLabel htmlFor="fileUpload">
              <span>Select www dir</span>
            </InputLabel>
            <Button type="submit" disabled={files.length === 0}>
              <span>Decrypt</span>
            </Button>

            <div>files found: {files.length}</div>
            <div>files decrypted: {filesDecrypted}</div>
            <ProgressBar>
              <Filler style={{ width: `${progress}%` }}>
                <ProgressStatus>{progressStatus}</ProgressStatus>
              </Filler>
            </ProgressBar>

            <CheckBox
              label="Remove path"
              value={removePath}
              onChangeValue={e => setRemovePath(e.target.checked)}
            ></CheckBox>
            <CheckBox
              label="Decrypt audio"
              value={includeAudio}
              onChangeValue={e => setIncludeAudio(e.target.checked)}
            ></CheckBox>
            <CheckBox
              label="Decrypt video"
              value={includeVideo}
              onChangeValue={e => setIncludeVideo(e.target.checked)}
            ></CheckBox>
            <CheckBox
              label="Decrypt image"
              value={includeImage}
              onChangeValue={e => setIncludeImage(e.target.checked)}
            ></CheckBox>
          </form>
        </div>
        <footer>
          <a href="https://github.com/Darckfast/rpg-maker-mv-decrypt-react">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
            >
              <path
                fill="white"
                d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"
              />
            </svg>
          </a>
        </footer>
      </main>
    </Container>
  )
}

export default Home
